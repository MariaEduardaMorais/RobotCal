// Variáveis globais para os gráficos e estado da aplicação
let graficoDistancia;
let graficoVelocidade;
let dados = []; // Armazena o histórico de dados: { tempo, distancia }
let pausado = localStorage.getItem('calcubotPause') === 'true'; // Verifica se o estado pausado foi salvo
let ultimoEstadoCalculado = null; // Guarda o último estado válido dos cálculos
let roboEstavaParado = true; // Nova variável para controlar o estado do robô

// Texto explicativo inicial para a seção de cálculos
const textoExplicativo = `
  <div>
    <h2 class="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">Análise de Movimento em Tempo Real</h2>
    <p class="text-gray-700 dark:text-gray-300">
      Acompanhe ao vivo o movimento do robô! A análise é resetada automaticamente quando um novo movimento começa. O sistema usará regressão polinomial para encontrar a função que descreve o movimento e, a partir dela, calculará as funções exatas de <strong>velocidade</strong> e <strong>aceleração</strong>.
    </p>
  </div>
  <hr class="my-6 border-gray-300 dark:border-gray-700">
  <div id="live-calculations">
    <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Aguardando movimento do robô...</h3>
  </div>
`;

// --- FUNÇÕES MATEMÁTICAS AUXILIARES ---

function aplicarRegressaoPolinomial(x, y, grau) {
  if (x.length < grau + 1) return [];
  const X = x.map(xi => Array.from({ length: grau + 1 }, (_, j) => Math.pow(xi, j)));
  const Xmatrix = math.matrix(X);
  const Ymatrix = math.matrix(y);
  try {
    const XT = math.transpose(Xmatrix);
    const XTX = math.multiply(XT, Xmatrix);
    const XTY = math.multiply(XT, Ymatrix);
    return math.lusolve(XTX, XTY).toArray().flat();
  } catch (e) {
    console.error("Erro na regressão:", e);
    return [];
  }
}

function gerarValoresPolinomiais(x, coef) {
  return x.map(xi => coef.reduce((soma, c, j) => soma + c * Math.pow(xi, j), 0));
}

function derivarPolinomio(coef) {
  if (coef.length < 2) return [0];
  return coef.slice(1).map((c, i) => c * (i + 1));
}

function calcularIntegralDefinida(coef, t_final) {
    const valorIntegral = coef.reduce((soma, c, i) => {
        const novoExpoente = i + 1;
        const termoIntegrado = (c / novoExpoente) * Math.pow(t_final, novoExpoente);
        return soma + termoIntegrado;
    }, 0);
    return valorIntegral;
}


function formatarPolinomio(coef, varName = 't') {
  if (!coef || coef.length === 0) return "0";
  const termos = coef.map((c, i) => {
    if (Math.abs(c) < 1e-4) return null;
    const sinal = c >= 0 ? '+' : '-';
    const valorAbs = Math.abs(c);
    const valorStr = valorAbs.toFixed(3);
    if (i === 0) return `${c.toFixed(3)}`;
    if (i === 1) return `${sinal} ${valorStr} ${varName}`;
    return `${sinal} ${valorStr} ${varName}^{${i}}`;
  }).filter(Boolean);
  let resultado = termos.reverse().join(' ').trim();
  if (resultado.startsWith('+')) {
    resultado = resultado.substring(2);
  }
  return resultado || "0";
}

// --- FUNÇÃO PRINCIPAL DE ATUALIZAÇÃO ---

function atualizarDados() {
  if (pausado) return;

  fetch('http://192.168.2.131:3000/api/dados')
    .then(res => {
      if (!res.ok) throw new Error(`Erro na rede: ${res.statusText}`);
      return res.json();
    })
    .then(novoDado => {
      const roboEstaParadoAgora = novoDado.velocidade === 0;

      if (roboEstaParadoAgora) {
        if (ultimoEstadoCalculado) {
          document.getElementById("live-calculations").innerHTML = ultimoEstadoCalculado;
          if (typeof MathJax !== 'undefined') MathJax.typesetPromise();
        } else {
          document.getElementById("live-calculations").innerHTML = `<h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Robô Parado</h3>`;
        }
        roboEstavaParado = true;
        return;
      }

      if (roboEstavaParado) {
        console.log("Robô iniciou um novo movimento. Resetando a análise.");
        dados = [];
        ultimoEstadoCalculado = null;
      }
      roboEstavaParado = false;

      const tempo = Date.now() / 1000;
      dados.push({ tempo, distancia: novoDado.distancia });
      if (dados.length > 50) dados.shift();

      const grau = parseInt(document.getElementById("grauPolinomio").value);
      if (dados.length < grau + 2) {
        document.getElementById("live-calculations").innerHTML = `<h3 class="text-xl font-semibold text-yellow-500">Coletando dados iniciais...</h3>`;
        return;
      }

      const temposRelativos = dados.map(p => p.tempo - dados[0].tempo);
      const distancias = dados.map(p => p.distancia);

      const coefPosicao = aplicarRegressaoPolinomial(temposRelativos, distancias, grau);

      if (coefPosicao.length === 0) return;

      const coefVelocidade = derivarPolinomio(coefPosicao);
      const coefAceleracao = derivarPolinomio(coefVelocidade);

      const curvaPosicao = gerarValoresPolinomiais(temposRelativos, coefPosicao);
      const curvaVelocidade = gerarValoresPolinomiais(temposRelativos, coefVelocidade);

      const labelsFormatados = temposRelativos.map(t => t.toFixed(1));
      graficoDistancia.data.labels = labelsFormatados;
      graficoDistancia.data.datasets[0].data = distancias;
      graficoDistancia.data.datasets[1].data = curvaPosicao;
      graficoDistancia.update('none');

      graficoVelocidade.data.labels = labelsFormatados;
      graficoVelocidade.data.datasets[0].data = curvaVelocidade;
      graficoVelocidade.update('none');

      const tempoFinal = temposRelativos[temposRelativos.length - 1];
      const posFinal = gerarValoresPolinomiais([tempoFinal], coefPosicao)[0];
      const velFinal = gerarValoresPolinomiais([tempoFinal], coefVelocidade)[0];
      const acelFinal = gerarValoresPolinomiais([tempoFinal], coefAceleracao)[0];
      const distIntegrada = calcularIntegralDefinida(coefVelocidade, tempoFinal);

      const htmlCalculos = `
        <div class="space-y-8">
          <!-- INTRODUÇÃO AOS CONCEITOS -->
          <div>
            <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">A Base de Tudo: O Limite</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">O Cálculo nos permite analisar o movimento contínuo ao "aproximar o zoom" infinitamente. A ideia de <strong>limite</strong> é o que torna isso possível, transformando aproximações em valores exatos. É a fundação para a Derivada e a Integral.</p>
          </div>

          <!-- SEÇÃO DA DERIVADA -->
          <div class="p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 class="flex items-center text-xl font-semibold text-green-600 dark:text-green-400 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              A Derivada: Encontrando a Velocidade Instantânea
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">A velocidade instantânea é o <strong>limite</strong> da velocidade média quando o intervalo de tempo (\\(\\Delta t\\)) se aproxima de zero. Ao aplicar este conceito à nossa função de posição \\(s(t)\\), encontramos a função exata da velocidade, \\(v(t)\\).</p>
            <div class="space-y-2">
              <p class="text-gray-700 dark:text-gray-300"><strong>Posição:</strong> \\( s(t) = ${formatarPolinomio(coefPosicao, 't')} \\)</p>
              <p class="text-gray-700 dark:text-gray-300"><strong>Velocidade:</strong> \\( v(t) = \\lim_{\\Delta t \\to 0} \\frac{\\Delta s}{\\Delta t} = s'(t) = ${formatarPolinomio(coefVelocidade, 't')} \\)</p>
            </div>
          </div>

          <!-- SEÇÃO DA INTEGRAL -->
          <div class="p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 class="flex items-center text-xl font-semibold text-orange-500 dark:text-orange-400 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1-1m-6-6h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
              A Integral: Somando as Partes para Encontrar a Distância
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">A distância total percorrida é a "soma infinita" de todas as velocidades instantâneas ao longo do tempo. Isso é a <strong>integral definida</strong>, que geometricamente representa a área sob a curva do gráfico de velocidade.</p>
            <div class="space-y-2">
               <p class="text-gray-700 dark:text-gray-300"><strong>Cálculo:</strong> \\( \\Delta s = \\int_{0}^{${tempoFinal.toFixed(1)}} v(t) \\,dt \\)</p>
               <p class="text-gray-700 dark:text-gray-300"><strong>Resultado:</strong> O deslocamento total calculado foi de <strong>${distIntegrada.toFixed(2)} cm</strong>.</p>
            </div>
          </div>
        </div>
        
        <hr class="my-8 border-gray-300 dark:border-gray-700">
        
        <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Resumo Numérico (no instante t = ${tempoFinal.toFixed(1)}s)</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div class="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <p class="text-sm text-blue-800 dark:text-blue-200 font-semibold">Posição Final</p>
                <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">${posFinal.toFixed(2)} cm</p>
            </div>
            <div class="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
                <p class="text-sm text-green-800 dark:text-green-200 font-semibold">Velocidade Final</p>
                <p class="text-2xl font-bold text-green-900 dark:text-green-100">${velFinal.toFixed(2)} cm/s</p>
            </div>
            <div class="p-4 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <p class="text-sm text-purple-800 dark:text-purple-200 font-semibold">Aceleração Final</p>
                <p class="text-2xl font-bold text-purple-900 dark:text-purple-100">${acelFinal.toFixed(2)} cm/s²</p>
            </div>
        </div>
      `;
      
      document.getElementById("live-calculations").innerHTML = htmlCalculos;
      ultimoEstadoCalculado = htmlCalculos;
      if (typeof MathJax !== 'undefined') MathJax.typesetPromise();
    })
    .catch(err => {
      const area = document.getElementById("live-calculations");
      area.innerHTML = `<h3 class="text-xl font-semibold text-red-500">Erro ao buscar dados</h3><p class="text-gray-700 dark:text-gray-300">${err.message}</p>`;
    });
}


// --- INICIALIZAÇÃO DA PÁGINA ---

window.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#calculos").innerHTML = textoExplicativo;

  function resetarAnalise() {
    dados = [];
    ultimoEstadoCalculado = null;
    roboEstavaParado = true;
    
    if (graficoDistancia) {
      graficoDistancia.data.labels = [];
      graficoDistancia.data.datasets.forEach(dataset => { dataset.data = []; });
      graficoDistancia.update();
    }
    if (graficoVelocidade) {
      graficoVelocidade.data.labels = [];
      graficoVelocidade.data.datasets.forEach(dataset => { dataset.data = []; });
      graficoVelocidade.update();
    }
    
    document.getElementById("live-calculations").innerHTML = `<h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Aguardando movimento do robô...</h3>`;
    console.log("Análise resetada.");
  }

  const ctxDist = document.getElementById("graficoMovimento").getContext("2d");
  graficoDistancia = new Chart(ctxDist, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "Distância Real (cm)", data: [], borderColor: "#3b82f6", backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: false, tension: 0.4, pointRadius: 3 },
        { label: "Curva Ajustada (Polinômio)", data: [], borderColor: "#f97316", borderDash: [5, 5], tension: 0.4, pointRadius: 0, borderWidth: 2 }
      ]
    },
    options: { plugins: { title: { display: true, text: "Distância vs Tempo" } }, scales: { x: { title: { display: true, text: "Tempo (s)" } }, y: { title: { display: true, text: "Distância (cm)" } } } }
  });

  const ctxVel = document.getElementById("graficoVelocidade").getContext("2d");
  graficoVelocidade = new Chart(ctxVel, {
    type: "line",
    data: {
      labels: [],
      datasets: [{ label: "Velocidade Derivada (cm/s)", data: [], borderColor: "#16a34a", backgroundColor: 'rgba(22, 163, 74, 0.1)', fill: true, tension: 0.4, pointRadius: 0 }]
    },
    options: { plugins: { title: { display: true, text: "Velocidade vs Tempo" } }, scales: { x: { title: { display: true, text: "Velocidade (cm/s)" } }, y: { title: { display: true, text: "Velocidade (cm/s)" } } } }
  });

  const togglePauseButton = document.getElementById("togglePause");
  function ajustarBotaoPause() {
    togglePauseButton.textContent = pausado ? "▶️ Retomar" : "⏸️ Pausar";
  }

  togglePauseButton.addEventListener("click", () => {
    pausado = !pausado;
    localStorage.setItem('calcubotPause', pausado);
    ajustarBotaoPause();
  });

  document.getElementById("grauPolinomio").addEventListener("change", () => {
    if (!pausado) atualizarDados();
  });
  
  document.getElementById("resetData").addEventListener("click", resetarAnalise);

  ajustarBotaoPause();
  atualizarDados();
  setInterval(atualizarDados, 400);
});
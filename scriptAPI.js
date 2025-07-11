let graficoPosicao;
let graficoVelocidade;
let dados = []; // Armazena o histórico de dados: tempo, distancia, velocidade
let tempoInicial = 0;

function atualizarDados() {
  fetch('http://192.168.2.131:3000/api/dados')
    .then(res => {
      if (!res.ok) throw new Error(`Erro na rede: ${res.statusText}`);
      return res.json();
    })
    .then(novoDado => {
      if (dados.length === 0 && novoDado.velocidade > 0) {
        tempoInicial = Date.now() / 1000;
      }
      
      if (novoDado.velocidade > 0) {
        const tempoRelativo = (Date.now() / 1000) - tempoInicial;
        dados.push({ tempo: tempoRelativo, ...novoDado });
      }
      
      if (dados.length > 100) dados.shift();
      
      const labels = dados.map(p => p.tempo.toFixed(1));
      const posicoes = dados.map(p => p.distancia);
      const velocidades = dados.map(p => p.velocidade);

      if (graficoPosicao) {
        graficoPosicao.data.labels = labels;
        graficoPosicao.data.datasets[0].data = posicoes;
        graficoPosicao.update('none');
      }

      if (graficoVelocidade) {
        graficoVelocidade.data.labels = labels;
        graficoVelocidade.data.datasets[0].data = velocidades;
        graficoVelocidade.update('none');
      }

      renderizarAbasDeCalculo();
    })
    .catch(err => {
      const area = document.getElementById("calculos-content");
      if(area) area.innerHTML = `<h3 class="text-xl font-semibold text-red-500">Erro ao buscar dados</h3><p>${err.message}</p>`;
    });
}

function renderizarAbasDeCalculo() {
    const areaLimite = document.getElementById("content-limite");
    const areaDerivada = document.getElementById("content-derivada");
    const areaIntegral = document.getElementById("content-integral");

    if (!areaLimite || !areaDerivada || !areaIntegral) return;

    areaLimite.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">O Conceito de Limite</h3>
        <div class="p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p class="text-gray-700 dark:text-gray-400">
                O <strong>Limite</strong> é a ideia fundamental do Cálculo. Ele permite-nos descobrir o valor exato para o qual uma função se aproxima à medida que a sua entrada se aproxima de um certo valor.
                <br><br>
                No nosso robô, usamos o limite para encontrar a <strong>velocidade instantânea</strong>. Calculamos a velocidade média (\\(\\frac{\\Delta s}{\\Delta t}\\)) em intervalos de tempo (\\(\\Delta t\\)) cada vez menores. O limite desta velocidade média, quando \\(\\Delta t\\) tende a zero, é a definição da <strong>derivada</strong>.
            </p>
            <div class="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg text-lg text-center shadow">
                \\( v(t) = \\lim_{\\Delta t \\to 0} \\frac{s(t + \\Delta t) - s(t)}{\\Delta t} \\)
            </div>
        </div>
    `;

    if (dados.length < 2) {
        const msg = `<p class="mt-4 text-center text-lg font-semibold text-gray-800 dark:text-gray-200">Aguardando movimento para iniciar a análise...</p>`;
        areaDerivada.innerHTML = msg;
        areaIntegral.innerHTML = msg;
        return;
    }

    const p2 = dados[dados.length - 1];
    const p1 = dados[dados.length - 2];

    const dt = p2.tempo - p1.tempo;
    const ds = p2.distancia - p1.distancia;
    const velocidadeMedia = (dt > 1e-9) ? ds / dt : 0;
    const distanciaTotal = p2.distancia;

    areaDerivada.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">A Derivada na Prática</h3>
        <div class="p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                A derivada da função da posição em relação ao tempo nos dá a velocidade. Aqui, aproximamos este valor calculando a velocidade média entre os dois últimos pontos de dados recebidos. Como o intervalo de tempo (\\(\\Delta t\\)) é muito pequeno, esta é uma excelente aproximação da velocidade instantânea.
            </p>
            <div class="space-y-4">
                <div>
                    <p class="font-mono text-gray-700 dark:text-gray-300">1. Variação da Posição (\\(\\Delta s\\)): ${ds.toFixed(2)} cm</p>
                    <p class="font-mono text-gray-700 dark:text-gray-300">2. Variação do Tempo (\\(\\Delta t\\)): ${dt.toFixed(3)} s</p>
                </div>
                <div class="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg text-lg text-center shadow">
                  \\( v_{inst} \\approx \\frac{\\Delta s}{\\Delta t} = \\frac{${ds.toFixed(2)}}{${dt.toFixed(3)}} \\approx ${velocidadeMedia.toFixed(2)} \\text{ cm/s} \\)
                </div>
            </div>
        </div>
    `;
    
    areaIntegral.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">A Integral na Prática</h3>
        <div class="p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                A integral é a operação inversa da derivada. Se a derivada nos dá a taxa de variação, a integral "soma" todas essas pequenas variações para nos dar o total acumulado. No nosso caso, a <strong>distância total</strong> percorrida pelo robô é a integral da sua velocidade ao longo do tempo.
            </p>
            <div class="space-y-2">
                <p class="text-gray-700 dark:text-gray-300">A distância total é a soma de todos os pequenos deslocamentos (\\(\\sum \\Delta s\\)).</p>
                <p class="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg text-lg text-center shadow">
                    Distância Total Percorrida: <strong>${distanciaTotal.toFixed(2)} cm</strong>
                </p>
            </div>
        </div>
    `;

    if (typeof MathJax !== 'undefined') MathJax.typesetPromise();
}

window.addEventListener("DOMContentLoaded", () => {
  // Configuração dos gráficos
  const ctxPos = document.getElementById("graficoPosicao").getContext("2d");
  graficoPosicao = new Chart(ctxPos, {
    type: "line",
    data: {
      labels: [],
      datasets: [{ label: "Posição (cm)", data: [], borderColor: "#3b82f6", fill: false, tension: 0.4, borderWidth: 2 }]
    },
    options: { 
        plugins: { title: { display: true, text: "Posição vs Tempo" } }, 
        scales: { 
            x: { title: { display: true, text: "Tempo (s)" } }, 
            y: { title: { display: true, text: "Posição (cm)" } } 
        } 
    }
  });

  const ctxVel = document.getElementById("graficoVelocidade").getContext("2d");
  graficoVelocidade = new Chart(ctxVel, {
    type: "line",
    data: {
      labels: [],
      datasets: [{ label: "Velocidade (cm/s)", data: [], borderColor: "#16a34a", backgroundColor: 'rgba(22, 163, 74, 0.1)', fill: true, tension: 0.4, borderWidth: 2 }]
    },
    options: { 
        plugins: { title: { display: true, text: "Velocidade vs Tempo" } }, 
        scales: { 
            x: { title: { display: true, text: "Tempo (s)" } }, 
            y: { title: { display: true, text: "Velocidade (cm/s)" } } 
        } 
    }
  });

  const tabs = document.querySelectorAll('.tab-btn');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');

      tabs.forEach(t => {
        t.classList.remove('border-blue-500', 'text-blue-600');
        t.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300', 'dark:text-gray-400', 'dark:hover:text-gray-300');
      });

      tab.classList.add('border-blue-500', 'text-blue-600');
      tab.classList.remove('border-transparent', 'text-gray-500');

      panes.forEach(pane => {
        if (pane.id === `content-${target}`) {
          pane.classList.remove('hidden');
        } else {
          pane.classList.add('hidden');
        }
      });
    });
  });

  document.querySelectorAll('.comando-btn').forEach(button => {
    button.addEventListener('click', () => {
      const comando = button.getAttribute('data-comando');
      if (comando !== 'parar') {
        dados = [];
        tempoInicial = 0;
        if (graficoPosicao) {
            graficoPosicao.data.labels = [];
            graficoPosicao.data.datasets[0].data = [];
            graficoPosicao.update();
        }
        if (graficoVelocidade) {
            graficoVelocidade.data.labels = [];
            graficoVelocidade.data.datasets[0].data = [];
            graficoVelocidade.update();
        }
      }
      fetch('http://192.168.2.131:3000/api/comando', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comando: comando })
      });
    });
  });

  renderizarAbasDeCalculo(); // Mostra a mensagem inicial
  setInterval(atualizarDados, 500);
});
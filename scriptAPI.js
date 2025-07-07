// Variáveis globais para os gráficos
let graficoDistancia;
let graficoVelocidade;
let dados = []; 

const textoExplicativo = `
  <div class="prose dark:prose-invert max-w-none mb-8">
    <h2 class="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">Análise de Movimento em Tempo Real</h2>
    <p>
      Acompanhe ao vivo o movimento do robô! Usamos a <strong>Derivada</strong> para encontrar a velocidade instantânea e a <strong>Integral</strong> para confirmar a distância total percorrida.
    </p>
    <h4 class="font-semibold mt-4">Derivada (Velocidade Instantânea)</h4>
    <p>
      A derivada mede a taxa de mudança. Ao calcular a variação da distância pela variação do tempo (\\(\\frac{\\Delta s}{\\Delta t}\\)) no intervalo mais recente, obtemos uma excelente aproximação da <strong>velocidade atual</strong> do robô.
    </p>
    <h4 class="font-semibold mt-4">Integral (Distância Total)</h4>
    <p>
      A integral acumula valores. No nosso caso, o sensor já nos fornece a distância total acumulada desde o início, que é o resultado prático da integração da velocidade do robô ao longo do tempo.
    </p>
  </div>
  <hr class="my-6 border-gray-300 dark:border-gray-600">
  
  <div id="live-calculations">
    <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Aguardando dados do robô...</h3>
  </div>
`;

function atualizarDados() {
  fetch('http://SEU_SITE/api/dados') 
    .then(res => {
        if (!res.ok) {
            throw new Error(`Erro na rede: ${res.statusText}`);
        }
        return res.json();
    })
    .then(novoDado => {
      const tempo = Math.round(Date.now() / 1000); 
      dados.push({ tempo, distancia: novoDado.distancia });
      if (dados.length > 20) {
        dados.shift();
      }

      const temposRelativos = dados.map(p => p.tempo - dados[0].tempo);
      const distancias = dados.map(p => p.distancia);
      
      graficoDistancia.data.labels = temposRelativos;
      graficoDistancia.data.datasets[0].data = distancias;
      graficoDistancia.update();

      const areaCalculosVivos = document.getElementById('live-calculations');
      
      let htmlCalculos = '<h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Cálculos do Último Intervalo:</h3>';
      let velocidades = [];

      if (dados.length > 1) {
        const ultimoPonto = dados[dados.length - 1];
        const penultimoPonto = dados[dados.length - 2];
        const dt = ultimoPonto.tempo - penultimoPonto.tempo;
        const ds = ultimoPonto.distancia - penultimoPonto.distancia;
        const velocidadeAtual = dt > 0 ? (ds / dt) : 0;
        
        htmlCalculos += `
          <div class="prose dark:prose-invert max-w-none">
            <h4>Passo a Passo da Derivada (Velocidade Atual)</h4>
            <p>Analisando o intervalo entre ${penultimoPonto.tempo}s e ${ultimoPonto.tempo}s:</p>
            <p>\\(\\Delta t = ${ultimoPonto.tempo} - ${penultimoPonto.tempo} = ${dt.toFixed(2)}\\) s</p>
            <p>\\(\\Delta s = ${ultimoPonto.distancia.toFixed(2)} - ${penultimoPonto.distancia.toFixed(2)} = ${ds.toFixed(2)}\\) cm</p>
            <p class="text-lg"><strong>Velocidade Atual ≈ \\(\\frac{${ds.toFixed(2)}}{${dt.toFixed(2)}} = ${velocidadeAtual.toFixed(2)}\\) cm/s</strong></p>
            <hr class="my-4 border-gray-300 dark:border-gray-600">
            <h4>Integral (Distância Total Acumulada)</h4>
            <p class="text-lg"><strong>Distância Total: ${ultimoPonto.distancia.toFixed(2)} cm</strong></p>
          </div>
        `;
        
        for (let i = 1; i < dados.length; i++) {
            const deltaT = dados[i].tempo - dados[i - 1].tempo;
            const deltaS = dados[i].distancia - dados[i - 1].distancia;
            velocidades.push(deltaT > 0 ? (deltaS / deltaT).toFixed(2) : 0);
        }

        graficoVelocidade.data.labels = temposRelativos.slice(1);
        graficoVelocidade.data.datasets[0].data = velocidades;
        graficoVelocidade.update();

      } else {
        htmlCalculos += '<p class="text-gray-600 dark:text-gray-400">Aguardando mais dados para calcular a velocidade...</p>';
      }

      areaCalculosVivos.innerHTML = htmlCalculos;

      if (typeof MathJax !== 'undefined') {
        MathJax.typesetPromise([areaCalculosVivos]);
      }
    })
    .catch(err => {
      console.error('Erro ao buscar dados:', err);
      const areaCalculosVivos = document.getElementById('live-calculations');
      if(areaCalculosVivos) {
        areaCalculosVivos.innerHTML = `<h3 class="text-xl font-semibold text-red-500">Falha ao conectar com o robô.</h3><p class="text-red-700 dark:text-red-400">Verifique a URL da API e a conexão de rede. (${err.message})</p>`;
      }
    });
}

window.addEventListener('DOMContentLoaded', () => {
  const cardCalculos = document.querySelector('#calculos');
  cardCalculos.innerHTML = textoExplicativo;

  const ctxDistancia = document.getElementById('graficoMovimento').getContext('2d');
  graficoDistancia = new Chart(ctxDistancia, {
    type: 'line', data: { labels: [], datasets: [{ label: 'Distância (cm)', data: [], borderColor: '#007bff', tension: 0.3 }] },
    options: { plugins: { title: { display: true, text: 'Distância vs. Tempo' }}, scales: { x: { title: { display: true, text: 'Tempo Relativo (s)' }}, y: { title: { display: true, text: 'Distância (cm)' }} }}
  });

  const ctxVelocidade = document.getElementById('graficoVelocidade').getContext('2d');
  graficoVelocidade = new Chart(ctxVelocidade, {
    type: 'line', data: { labels: [], datasets: [{ label: 'Velocidade (cm/s)', data: [], borderColor: '#28a745', tension: 0.3 }] },
    options: { plugins: { title: { display: true, text: 'Velocidade vs. Tempo' }}, scales: { x: { title: { display: true, text: 'Tempo Relativo (s)' }}, y: { title: { display: true, text: 'Velocidade (cm/s)' }} }}
  });

  if (typeof MathJax !== 'undefined') {
    MathJax.typesetPromise();
  }

  atualizarDados(); 
  setInterval(atualizarDados, 5000);
});
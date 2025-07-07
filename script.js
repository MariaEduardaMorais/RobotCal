window.addEventListener('DOMContentLoaded', () => {
    // Dados simulados com movimento não-linear (ex: com aceleração)
    const dadosMock = [
        { tempo: 0, distancia: 0 }, { tempo: 1, distancia: 2 },
        { tempo: 2, distancia: 8 }, { tempo: 3, distancia: 18 },
        { tempo: 4, distancia: 32 }, { tempo: 5, distancia: 50 },
        { tempo: 6, distancia: 72 }, { tempo: 7, distancia: 98 },
        { tempo: 8, distancia: 128 }, { tempo: 9, distancia: 162 },
        { tempo: 10, distancia: 200 }
    ];

    const textoExplicativo = `
    <div>
      <h2 class="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">Entendendo os Cálculos do Robô</h2>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        Bem-vindo à central de análises do Calcubot! Aqui, usamos duas ferramentas poderosas do Cálculo — a <strong>Derivada</strong> e a <strong>Integral</strong> — para traduzir os dados de movimento do robô em informações úteis, como sua velocidade e a distância total que ele percorreu.
      </p>

      <h4 class="font-semibold mt-6 text-lg text-gray-800 dark:text-gray-200">O que é a Derivada? (Encontrando a Velocidade)</h4>
      <p class="text-gray-700 dark:text-gray-300 mt-2">
        Pense na <strong>derivada</strong> como um "medidor de velocidade instantânea". Ela nos diz o quão rápido algo está mudando em um determinado momento. No nosso caso, estamos medindo como a <em>distância</em> do robô muda ao longo do <em>tempo</em>. O resultado dessa medição é a <strong>velocidade</strong>.
      </p>
      <p class="text-gray-700 dark:text-gray-300 mt-2">
        Como não temos uma função matemática contínua, mas sim pontos de dados, calculamos a velocidade média em cada pequeno intervalo usando a fórmula:
      </p>
      <p class="text-center font-bold text-xl p-2 rounded text-gray-800 dark:text-gray-200 my-4">
        Velocidade ≈ \\( \\frac{\\Delta s}{\\Delta t} \\)
      </p>
      <p class="text-gray-700 dark:text-gray-300">
        Onde \\(\\Delta s\\) é a variação da distância e \\(\\Delta t\\) é a variação do tempo. O resultado que você verá abaixo é o passo a passo desse cálculo para cada intervalo.
      </p>

      <h4 class="font-semibold mt-6 text-lg text-gray-800 dark:text-gray-200">O que é a Integral? (Encontrando a Distância Total)</h4>
      <p class="text-gray-700 dark:text-gray-300 mt-2">
        A <strong>integral</strong> faz o trabalho oposto da derivada: ela "soma" pequenas partes para encontrar um total acumulado. É como o odômetro de um carro, que soma todas as pequenas distâncias percorridas para mostrar o total da viagem.
      </p>
      <p class="text-gray-700 dark:text-gray-300 mt-2">
        No nosso projeto, a forma mais simples de ver a integral em ação é somar todas as pequenas distâncias (\\(\\Delta s\\)) que o robô percorreu em cada intervalo de tempo. Ao final, a soma de todos esses pedaços nos dá a distância total percorrida.
      </p>
    </div>
    <hr class="my-6 border-gray-300 dark:border-gray-700">
  `;

    const tempos = dadosMock.map(ponto => ponto.tempo);
    const distancias = dadosMock.map(ponto => ponto.distancia);
    const velocidades = [];
    
    let detalheDerivada = `<h4 class="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-2">Passo a passo da Derivada (Velocidade)</h4>`;
    let detalheIntegral = `<h4 class="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-2">Passo a passo da Integral (Distância Percorrida)</h4>`;

    for (let i = 1; i < dadosMock.length; i++) {
        const dt = dadosMock[i].tempo - dadosMock[i - 1].tempo;
        const ds = dadosMock[i].distancia - dadosMock[i - 1].distancia;
        const velocidadeAtual = (ds / dt);
        velocidades.push(velocidadeAtual.toFixed(2));

        detalheDerivada += `
            <div class="text-gray-700 dark:text-gray-300 mt-4">
                <p class="font-semibold">No intervalo de tempo ${dadosMock[i - 1].tempo}s a ${dadosMock[i].tempo}s:</p>
                <p>\\(\\Delta t = ${dadosMock[i].tempo} - ${dadosMock[i - 1].tempo} = ${dt}\\) s</p>
                <p>\\(\\Delta s = ${dadosMock[i].distancia} - ${dadosMock[i - 1].distancia} = ${ds}\\) cm</p>
                <p><strong>Velocidade = \\(\\frac{\\Delta s}{\\Delta t} = \\frac{${ds}}{${dt}} = ${velocidadeAtual.toFixed(2)}\\) cm/s</strong></p>
            </div>
        `;
        
        detalheIntegral += `<p class="text-gray-700 dark:text-gray-300">Adicionando ao total: \\(\\Delta s = ${ds}\\) cm</p>`;
    }

    const distanciaTotal = dadosMock[dadosMock.length - 1].distancia;
    detalheIntegral += `<p class="text-lg font-bold text-gray-800 dark:text-gray-200 mt-4">Distância Total (Soma dos \\(\\Delta s\\)): ${distanciaTotal} cm</p>`;

    // --- CÓDIGO DOS GRÁFICOS RESTAURADO ---
    const ctx = document.getElementById('graficoMovimento').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: tempos,
            datasets: [{
                label: 'Distância (cm)',
                data: distancias,
                borderColor: '#007bff',
                fill: false,
                tension: 0.3,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Gráfico de Movimento do Robô (Distância vs Tempo)'
                }
            },
            scales: {
                x: { title: { display: true, text: 'Tempo (s)' } },
                y: { title: { display: true, text: 'Distância (cm)' } }
            }
        }
    });

    const ctxVelocidade = document.getElementById('graficoVelocidade').getContext('2d');
    new Chart(ctxVelocidade, {
        type: 'line',
        data: {
            labels: tempos.slice(1),
            datasets: [{
                label: 'Velocidade (cm/s)',
                data: velocidades,
                borderColor: '#28a745',
                fill: false,
                tension: 0.3,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Gráfico de Velocidade do Robô (Velocidade vs Tempo)'
                }
            },
            scales: {
                x: { title: { display: true, text: 'Tempo (s)' } },
                y: { title: { display: true, text: 'Velocidade (cm/s)' } }
            }
        }
    });

    const cardCalculos = document.querySelector('#calculos');
    
    const resultadoHTML = `
        ${textoExplicativo}
        <div>
            ${detalheDerivada}
        </div>
        <hr class="my-6 border-gray-300 dark:border-gray-700">
        <div>
            ${detalheIntegral}
        </div>
    `;
    cardCalculos.innerHTML = resultadoHTML;

    if (typeof MathJax !== 'undefined') {
        MathJax.typesetPromise();
    }
});
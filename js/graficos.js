let classificacaoAtual = "";

let chartLinha = null;
let chartMedias = null;
let chartPioresEquipamentos = null;
let chartPioresOrgaos = null;
let chartPizza = null;

const statusBox = document.getElementById("status-box");

function mostrarStatus(texto, tipo = "info") {
    statusBox.className = "status-box " + tipo;
    statusBox.textContent = texto;
}

function esconderStatus() {
    statusBox.className = "status-box";
    statusBox.textContent = "";
}

function formatarNumero(valor, casas = 2) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas
    });
}

function formatarData(dataISO) {
    if (!dataISO) return "-";

    const partes = dataISO.split("-");
    if (partes.length !== 3) return dataISO;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function escaparHtml(texto) {
    if (texto === null || texto === undefined) return "";
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function media(lista) {
    if (!lista.length) return 0;
    return lista.reduce((soma, valor) => soma + Number(valor || 0), 0) / lista.length;
}

function atualizarBotoesClassificacao() {
    document.querySelectorAll(".btn-classificacao").forEach((botao) => {
        const valor = botao.dataset.classificacao || "";
        if (valor === classificacaoAtual) {
            botao.classList.add("ativo");
        } else {
            botao.classList.remove("ativo");
        }
    });
}

function lerFiltrosDaTela() {
    return {
        equipamento: document.getElementById("filtro_equipamento").value.trim(),
        marca: document.getElementById("filtro_marca").value.trim(),
        modelo: document.getElementById("filtro_modelo").value.trim(),
        orgao: document.getElementById("filtro_orgao").value.trim(),
        localizacao: document.getElementById("filtro_localizacao").value.trim(),
        data_inicio: document.getElementById("filtro_data_inicio").value,
        data_fim: document.getElementById("filtro_data_fim").value,
        classificacao: classificacaoAtual
    };
}

function preencherFiltrosComUrl() {
    const params = new URLSearchParams(window.location.search);

    document.getElementById("filtro_equipamento").value = params.get("equipamento") || "";
    document.getElementById("filtro_marca").value = params.get("marca") || "";
    document.getElementById("filtro_modelo").value = params.get("modelo") || "";
    document.getElementById("filtro_orgao").value = params.get("orgao") || "";
    document.getElementById("filtro_localizacao").value = params.get("localizacao") || "";
    document.getElementById("filtro_data_inicio").value = params.get("data_inicio") || "";
    document.getElementById("filtro_data_fim").value = params.get("data_fim") || "";

    classificacaoAtual = params.get("classificacao") || "";
    atualizarBotoesClassificacao();
}

function atualizarUrlComFiltros() {
    const filtros = lerFiltrosDaTela();
    const params = new URLSearchParams();

    Object.entries(filtros).forEach(([chave, valor]) => {
        if (valor) params.set(chave, valor);
    });

    const novaUrl = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
    window.history.replaceState({}, "", novaUrl);
}

function destruirGraficos() {
    if (chartLinha) chartLinha.destroy();
    if (chartMedias) chartMedias.destroy();
    if (chartPioresEquipamentos) chartPioresEquipamentos.destroy();
    if (chartPioresOrgaos) chartPioresOrgaos.destroy();
}

function construirLinkHistorico(classificacao = "") {
    const filtros = lerFiltrosDaTela();
    const params = new URLSearchParams();

    if (filtros.equipamento) params.set("equipamento", filtros.equipamento);
    if (filtros.marca) params.set("marca", filtros.marca);
    if (filtros.modelo) params.set("modelo", filtros.modelo);
    if (filtros.orgao) params.set("orgao", filtros.orgao);
    if (filtros.localizacao) params.set("localizacao", filtros.localizacao);
    if (filtros.data_inicio) params.set("data_inicio", filtros.data_inicio);
    if (filtros.data_fim) params.set("data_fim", filtros.data_fim);
    if (classificacao) params.set("classificacao", classificacao);

    return `historico.html${params.toString() ? "?" + params.toString() : ""}`;
}

function atualizarLinksHistorico() {
    document.getElementById("link_promotores").href = construirLinkHistorico("promotor");
    document.getElementById("link_neutros").href = construirLinkHistorico("neutro");
    document.getElementById("link_detratores").href = construirLinkHistorico("detrator");
}

function aplicarClassificacaoSeNecessario(lista) {
    return lista.map((item) => {
        const q3 = Number(item.q3 || 0);

        let classificacao = "detrator";

        if (q3 === 3) classificacao = "neutro";
        if (q3 === 4 || q3 === 5) classificacao = "promotor";

        return { ...item, classificacao };
    });
}

function calcularSatisfacaoGeralItem(item) {
    return (Number(item.q1 || 0) + Number(item.q2 || 0) + Number(item.q3 || 0)) / 3;
}

function calcularTopPioresPorCampo(lista, campo) {
    const grupos = {};

    lista.forEach((item) => {
        const chave = (item[campo] || "Não informado").trim() || "Não informado";

        if (!grupos[chave]) {
            grupos[chave] = [];
        }

        grupos[chave].push(calcularSatisfacaoGeralItem(item));
    });

    return Object.entries(grupos)
        .map(([nome, valores]) => ({
            nome,
            media: media(valores)
        }))
        .sort((a, b) => a.media - b.media)
        .slice(0, 5);
}

function renderizarComentarios(lista) {
    const container = document.getElementById("comentarios_recentes");

    const comentarios = lista
        .filter((item) => item.comentario && item.comentario.trim() !== "")
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .slice(0, 10);

    if (!comentarios.length) {
        container.innerHTML = `<p style="color: #666;">Nenhum comentário encontrado para os filtros aplicados.</p>`;
        return;
    }

    container.innerHTML = comentarios.map((c) => `
        <div class="comentario-card">
            <div class="comentario-meta">
                📅 ${formatarData(c.data)} | 🏥 ${escaparHtml(c.orgao || "-")} | 🛠 ${escaparHtml(c.equipamento || "-")}
            </div>
            <div class="comentario-texto">
                ${escaparHtml(c.comentario)}
            </div>
        </div>
    `).join("");
}

function preencherCardsEMetricas(lista) {
    const totalAvaliacoes = lista.length;
    const mediasGerais = lista.map(calcularSatisfacaoGeralItem);


    const mediaQ1 = media(lista.map((item) => item.q1));
    const mediaQ2 = media(lista.map((item) => item.q2));
    const mediaQ3 = media(lista.map((item) => item.q3));
    const satisfacaoGeral = media(mediasGerais);

    const promotores = lista.filter((item) => item.classificacao === "promotor").length;
    const neutros = lista.filter((item) => item.classificacao === "neutro").length;
    const detratores = lista.filter((item) => item.classificacao === "detrator").length;

    const percPromotores = totalAvaliacoes ? (promotores / totalAvaliacoes) * 100 : 0;
    const percNeutros = totalAvaliacoes ? (neutros / totalAvaliacoes) * 100 : 0;
    const percDetratores = totalAvaliacoes ? (detratores / totalAvaliacoes) * 100 : 0;
    const nps = percPromotores - percDetratores;

    const criticas = mediasGerais.filter((valor) => valor < 3).length;
    const percCriticas = totalAvaliacoes ? (criticas / totalAvaliacoes) * 100 : 0;

    const limite15Dias = new Date();
    limite15Dias.setDate(limite15Dias.getDate() - 15);

    const criticasUltimos15 = lista.filter((item) => {
        const dataItem = new Date(item.data + "T00:00:00");
        return dataItem >= limite15Dias && calcularSatisfacaoGeralItem(item) < 3;
    }).length;

    const ultima = [...lista].sort((a, b) => new Date(b.data) - new Date(a.data))[0];

    document.getElementById("satisfacao_geral").textContent = formatarNumero(satisfacaoGeral);
    document.getElementById("media_q1").textContent = formatarNumero(mediaQ1);
    document.getElementById("media_q2").textContent = formatarNumero(mediaQ2);
    document.getElementById("media_q3").textContent = formatarNumero(mediaQ3);
    document.getElementById("nps").textContent = formatarNumero(nps, 2);

    document.getElementById("perc_promotores").textContent = formatarNumero(percPromotores, 0);
    document.getElementById("perc_neutros").textContent = formatarNumero(percNeutros, 0);
    document.getElementById("perc_detratores").textContent = formatarNumero(percDetratores, 0);

    document.getElementById("ultima_avaliacao").textContent = ultima ? formatarData(ultima.data) : "-";

    document.getElementById("perc_criticas").textContent = formatarNumero(percCriticas, 0);
    document.getElementById("criticas_ultimos_15").textContent = String(criticasUltimos15);
    document.getElementById("total_avaliacoes").textContent = String(totalAvaliacoes);
    document.getElementById("avaliacoesFeitas").textContent = String(totalAvaliacoes);
}

function renderizarGraficoLinha(lista) {
    const ordenada = [...lista].sort((a, b) => new Date(a.data) - new Date(b.data));

    const labels = ordenada.map((item) => formatarData(item.data));
    const dadosQ1 = ordenada.map((item) => Number(item.q1 || 0));
    const dadosQ2 = ordenada.map((item) => Number(item.q2 || 0));
    const dadosQ3 = ordenada.map((item) => Number(item.q3 || 0));

    chartLinha = new Chart(document.getElementById("graficoLinha"), {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Serviço (P1)",
                    data: dadosQ1,
                    borderWidth: 3,
                    tension: 0.3
                },
                {
                    label: "Técnico (P2)",
                    data: dadosQ2,
                    borderWidth: 3,
                    tension: 0.3
                },
                {
                    label: "Engenharia Clínica (P3)",
                    data: dadosQ3,
                    borderWidth: 3,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    min: 0,
                    max: 5,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function renderizarGraficoMedias(lista) {
    const mediasValores = [
        media(lista.map((item) => item.q1)),
        media(lista.map((item) => item.q2)),
        media(lista.map((item) => item.q3))
    ];

    chartMedias = new Chart(document.getElementById("graficoMedias"), {
        type: "bar",
        data: {
            labels: ["Serviço", "Técnico", "Engenharia Clínica"],
            datasets: [{
                label: "Média",
                data: mediasValores,
                borderWidth: 1,
                barThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return "Média: " + formatarNumero(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 5,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function renderizarGraficoPioresEquipamentos(lista) {
    const top = calcularTopPioresPorCampo(lista, "equipamento");

    chartPioresEquipamentos = new Chart(document.getElementById("graficoPioresEquipamentos"), {
        type: "bar",
        data: {
            labels: top.map((item) => item.nome),
            datasets: [{
                label: "Média da satisfação geral",
                data: top.map((item) => item.media),
                borderWidth: 1,
                barThickness: 35
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return "Média: " + formatarNumero(context.raw);
                        }
                    }
                }
            },
            scales: {
                x: {
                    min: 0,
                    max: 5,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function renderizarGraficoPioresOrgaos(lista) {
    const top = calcularTopPioresPorCampo(lista, "orgao");

    chartPioresOrgaos = new Chart(document.getElementById("graficoPioresOrgaos"), {
        type: "bar",
        data: {
            labels: top.map((item) => item.nome),
            datasets: [{
                label: "Média da satisfação geral",
                data: top.map((item) => item.media),
                borderWidth: 1,
                barThickness: 35
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return "Média: " + formatarNumero(context.raw);
                        }
                    }
                }
            },
            scales: {
                x: {
                    min: 0,
                    max: 5,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function gerarGraficoPizza() {
    const totalOS = parseInt(document.getElementById("totalOS").value, 10);
    const avaliacoesFeitas = parseInt(document.getElementById("total_avaliacoes").textContent, 10) || 0;

    if (isNaN(totalOS) || totalOS <= 0) {
        alert("Digite um valor válido para o total de OS.");
        return;
    }

    let pendentes = totalOS - avaliacoesFeitas;
    if (pendentes < 0) pendentes = 0;

    document.getElementById("avaliacoesPendentes").textContent = String(pendentes);

    if (chartPizza) {
        chartPizza.destroy();
    }

    chartPizza = new Chart(document.getElementById("graficoPizza"), {
        type: "pie",
        data: {
            labels: ["Avaliações feitas", "OS sem avaliação"],
            datasets: [{
                data: [avaliacoesFeitas, pendentes],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "bottom" }
            }
        }
    });
}

async function buscarAvaliacoes() {
    const filtros = lerFiltrosDaTela();

    let query = supabaseClient
        .from("avaliacoes")
        .select("*");

    if (filtros.equipamento) {
        query = query.ilike("equipamento", `%${filtros.equipamento}%`);
    }

    if (filtros.marca) {
        query = query.ilike("marca", `%${filtros.marca}%`);
    }

    if (filtros.modelo) {
        query = query.ilike("modelo", `%${filtros.modelo}%`);
    }

    if (filtros.orgao) {
        query = query.ilike("orgao", `%${filtros.orgao}%`);
    }

    if (filtros.localizacao) {
        query = query.ilike("localizacao", `%${filtros.localizacao}%`);
    }

    if (filtros.data_inicio) {
        query = query.gte("data", filtros.data_inicio);
    }

    if (filtros.data_fim) {
        query = query.lte("data", filtros.data_fim);
    }

    if (filtros.classificacao) {
        query = query.eq("classificacao", filtros.classificacao);
    }

    const { data, error } = await query.order("data", { ascending: true });

    if (error) {
        throw error;
    }

    let lista = aplicarClassificacaoSeNecessario(data || []);

    if (filtros.classificacao) {
        lista = lista.filter((item) => item.classificacao === filtros.classificacao);
    }

    return lista;
}

async function carregarGraficos() {
    try {
        esconderStatus();
        atualizarUrlComFiltros();
        atualizarLinksHistorico();

        const avaliacoes = await buscarAvaliacoes();

        destruirGraficos();
        preencherCardsEMetricas(avaliacoes);
        renderizarComentarios(avaliacoes);

        if (!avaliacoes.length) {
            mostrarStatus("Nenhuma avaliação encontrada para os filtros aplicados.", "info");
        }

        renderizarGraficoLinha(avaliacoes);
        renderizarGraficoMedias(avaliacoes);
        renderizarGraficoPioresEquipamentos(avaliacoes);
        renderizarGraficoPioresOrgaos(avaliacoes);

    } catch (error) {
        console.error("Erro ao carregar gráficos:", error);
        mostrarStatus("Erro ao carregar gráficos: " + error.message, "erro");
    }
}

document.getElementById("form-filtros").addEventListener("submit", async function (e) {
    e.preventDefault();
    await carregarGraficos();
});

document.getElementById("btn-limpar").addEventListener("click", async function () {
    document.getElementById("form-filtros").reset();
    classificacaoAtual = "";
    atualizarBotoesClassificacao();
    await carregarGraficos();
});

document.querySelectorAll(".btn-classificacao").forEach((botao) => {
    botao.addEventListener("click", async function () {
        classificacaoAtual = this.dataset.classificacao || "";
        atualizarBotoesClassificacao();
        await carregarGraficos();
    });
});

document.getElementById("btn-gerar-pizza").addEventListener("click", gerarGraficoPizza);

document.addEventListener("DOMContentLoaded", async function () {
    preencherFiltrosComUrl();
    atualizarLinksHistorico();
    await carregarGraficos();
});
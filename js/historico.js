let classificacaoAtual = "";
let idParaExcluir = null;

let paginaAtual = 1;
const itensPorPagina = 15;
let dadosFiltradosGlobais = [];

const tbody = document.getElementById("tabela-avaliacoes");
const statusBox = document.getElementById("status-box");
const modalExcluir = document.getElementById("modalExcluir");
const confirmarExclusaoBtn = document.getElementById("confirmarExclusao");
const cancelarExclusaoBtn = document.getElementById("cancelarExclusao");

let paginacaoDiv = document.getElementById("paginacao");

if (!paginacaoDiv) {
    paginacaoDiv = document.createElement("div");
    paginacaoDiv.id = "paginacao";
    paginacaoDiv.style.textAlign = "center";
    paginacaoDiv.style.marginTop = "20px";

    const tabelaResponsiva = document.querySelector(".table-responsive");
    if (tabelaResponsiva) {
        tabelaResponsiva.insertAdjacentElement("afterend", paginacaoDiv);
    }
}

function mostrarStatus(texto, tipo = "info") {
    statusBox.className = "status-box";
    statusBox.classList.add(tipo === "erro" ? "status-erro" : "status-info");
    statusBox.textContent = texto;
}

function esconderStatus() {
    statusBox.className = "status-box";
    statusBox.textContent = "";
}

function formatarData(dataISO) {
    if (!dataISO) return "";

    const partes = String(dataISO).split("-");
    if (partes.length !== 3) return dataISO;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function normalizar(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function igualIgnorandoAcentoEMaiuscula(valorBanco, valorFiltro) {
    const banco = normalizar(valorBanco);
    const filtro = normalizar(valorFiltro);

    if (!filtro) return true;

    return banco === filtro;
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

// --- AJUSTE: Função agora lê o objeto inteiro para verificar se é recusa ---
function obterClassificacaoPorItem(item) {
    if (item.recusou_responder) return "recusa";

    const nota = Number(item.q3);

    if (nota === 1 || nota === 2) return "detrator";
    if (nota === 3) return "neutro";
    if (nota === 4 || nota === 5) return "promotor";

    return "";
}

function obterClasseLinhaPorItem(item) {
    const classificacao = obterClassificacaoPorItem(item);

    if (classificacao === "recusa") return "linha-recusa";
    if (classificacao === "promotor") return "linha-promotor";
    if (classificacao === "neutro") return "linha-neutro";
    if (classificacao === "detrator") return "linha-detrator";

    return "";
}

function obterBadgeClassificacaoPorItem(item) {
    const classificacao = obterClassificacaoPorItem(item);

    if (classificacao === "recusa") {
        return '<span class="classificacao-badge badge-recusa">Recusou</span>';
    }

    if (classificacao === "promotor") {
        return '<span class="classificacao-badge badge-promotor">Promotor</span>';
    }

    if (classificacao === "neutro") {
        return '<span class="classificacao-badge badge-neutro">Neutro</span>';
    }

    if (classificacao === "detrator") {
        return '<span class="classificacao-badge badge-detrator">Detrator</span>';
    }

    return "";
}

function lerFiltrosDaTela() {
    return {
        os: document.getElementById("filtro_os").value.trim(),
        data_inicio: document.getElementById("filtro_data_inicio").value,
        data_fim: document.getElementById("filtro_data_fim").value,
        equipamento: document.getElementById("filtro_equipamento").value.trim(),
        marca: document.getElementById("filtro_marca").value.trim(),
        modelo: document.getElementById("filtro_modelo").value.trim(),
        localizacao: document.getElementById("filtro_localizacao").value.trim(),
        orgao: document.getElementById("filtro_orgao").value.trim(),
        classificacao: classificacaoAtual
    };
}

function preencherFiltrosComUrl() {
    const params = new URLSearchParams(window.location.search);

    document.getElementById("filtro_os").value = params.get("os") || "";
    document.getElementById("filtro_data_inicio").value = params.get("data_inicio") || "";
    document.getElementById("filtro_data_fim").value = params.get("data_fim") || "";
    document.getElementById("filtro_equipamento").value = params.get("equipamento") || "";
    document.getElementById("filtro_marca").value = params.get("marca") || "";
    document.getElementById("filtro_modelo").value = params.get("modelo") || "";
    document.getElementById("filtro_localizacao").value = params.get("localizacao") || "";
    document.getElementById("filtro_orgao").value = params.get("orgao") || "";

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

function atualizarBotoesClassificacao() {
    const botoes = document.querySelectorAll(".btn-classificacao");

    botoes.forEach((botao) => {
        const valor = botao.dataset.classificacao || "";

        if (valor === classificacaoAtual) {
            botao.classList.add("ativo");
        } else {
            botao.classList.remove("ativo");
        }
    });
}

function montarLinhaHtml(a) {
    const classeLinha = obterClasseLinhaPorItem(a);
    const badge = obterBadgeClassificacaoPorItem(a);

    // AJUSTE: Se for recusa, exibe "-" em vez de vazio nas notas
    const p1 = a.recusou_responder ? "-" : (a.q1 ?? "");
    const p2 = a.recusou_responder ? "-" : (a.q2 ?? "");
    const p3 = a.recusou_responder ? "-" : (a.q3 ?? "");

    return `
        <tr class="${classeLinha}">
            <td>${a.id ?? ""}</td>
            <td>${escaparHtml(a.os_numero ?? "")}</td>
            <td>${escaparHtml(a.equipamento ?? "")}</td>
            <td>${escaparHtml(a.marca ?? "")}</td>
            <td>${escaparHtml(a.modelo ?? "")}</td>
            <td>${escaparHtml(a.localizacao ?? "")}</td>
            <td>${escaparHtml(a.orgao ?? "")}</td>
            <td>${formatarData(a.data)}</td>
            <td>${p1}</td>
            <td>${p2}</td>
            <td>${p3}</td>
            <td class="comentario-coluna">${escaparHtml(a.comentario ?? "")}</td>
            <td>${escaparHtml(a.registrado_por ?? "")}</td>
            <td>${badge}</td>
            <td>
                <button type="button" class="btn-excluir" onclick="abrirModalExclusao(${a.id})">
                    🗑 Excluir
                </button>
            </td>
        </tr>
    `;
}

function aplicarFiltrosTexto(avaliacoes, filtros) {
    return avaliacoes.filter((a) => {
        const classificacaoDoItem = obterClassificacaoPorItem(a);

        if (filtros.classificacao && classificacaoDoItem !== filtros.classificacao) {
            return false;
        }

        if (filtros.equipamento && !igualIgnorandoAcentoEMaiuscula(a.equipamento, filtros.equipamento)) return false;
        if (filtros.marca && !igualIgnorandoAcentoEMaiuscula(a.marca, filtros.marca)) return false;
        if (filtros.modelo && !igualIgnorandoAcentoEMaiuscula(a.modelo, filtros.modelo)) return false;
        if (filtros.localizacao && !igualIgnorandoAcentoEMaiuscula(a.localizacao, filtros.localizacao)) return false;
        if (filtros.orgao && !igualIgnorandoAcentoEMaiuscula(a.orgao, filtros.orgao)) return false;

        return true;
    });
}

function renderizarTabelaPaginada() {
    if (!dadosFiltradosGlobais || dadosFiltradosGlobais.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="15">Nenhuma avaliação encontrada.</td>
            </tr>
        `;

        if (paginacaoDiv) paginacaoDiv.innerHTML = "";
        return;
    }

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const dadosDaPagina = dadosFiltradosGlobais.slice(inicio, fim);

    tbody.innerHTML = dadosDaPagina.map(montarLinhaHtml).join("");

    renderizarPaginacao();
}

function renderizarPaginacao() {
    if (!paginacaoDiv) return;

    const totalItens = dadosFiltradosGlobais.length;
    const totalPaginas = Math.ceil(totalItens / itensPorPagina);

    if (totalPaginas <= 1) {
        paginacaoDiv.innerHTML = `
            <div style="font-size:13px; color:#555;">
                ${totalItens} avaliações encontradas
            </div>
        `;
        return;
    }

    let html = "";

    html += `
        <button onclick="irParaPagina(${paginaAtual - 1})"
            ${paginaAtual === 1 ? "disabled" : ""}
            style="margin:4px; padding:8px 12px; border:none; border-radius:6px; cursor:pointer;">
            ◀ Anterior
        </button>
    `;

    for (let i = 1; i <= totalPaginas; i++) {
        // AJUSTE: Cor do botão ativo para o Azul Escuro Metrolife (#0a3659)
        html += `
            <button onclick="irParaPagina(${i})"
                style="
                    margin:4px;
                    padding:8px 12px;
                    border:none;
                    border-radius:6px;
                    cursor:pointer;
                    background:${i === paginaAtual ? "#0a3659" : "#ddd"};
                    color:${i === paginaAtual ? "white" : "#333"};
                    font-weight:${i === paginaAtual ? "bold" : "normal"};
                ">
                ${i}
            </button>
        `;
    }

    html += `
        <button onclick="irParaPagina(${paginaAtual + 1})"
            ${paginaAtual === totalPaginas ? "disabled" : ""}
            style="margin:4px; padding:8px 12px; border:none; border-radius:6px; cursor:pointer;">
            Próximo ▶
        </button>
    `;

    html += `
        <div style="margin-top:10px; font-size:13px; color:#555;">
            Página ${paginaAtual} de ${totalPaginas} |
            ${totalItens} avaliações encontradas
        </div>
    `;

    paginacaoDiv.innerHTML = html;
}

function irParaPagina(pagina) {
    const totalPaginas = Math.ceil(dadosFiltradosGlobais.length / itensPorPagina);

    if (pagina < 1 || pagina > totalPaginas) return;

    paginaAtual = pagina;
    renderizarTabelaPaginada();

    const tabelaResponsiva = document.querySelector(".table-responsive");

    if (tabelaResponsiva) {
        window.scrollTo({
            top: tabelaResponsiva.offsetTop - 20,
            behavior: "smooth"
        });
    }
}

async function carregarHistorico() {
    esconderStatus();

    tbody.innerHTML = `
        <tr>
            <td colspan="15">Carregando avaliações...</td>
        </tr>
    `;

    if (paginacaoDiv) paginacaoDiv.innerHTML = "";

    const filtros = lerFiltrosDaTela();

    let query = supabaseClient
        .from("avaliacoes")
        .select("*")
        .order("id", { ascending: false });

    if (filtros.os) {
        query = query.ilike("os_numero", `%${filtros.os}%`);
    }

    if (filtros.data_inicio) {
        query = query.gte("data", filtros.data_inicio);
    }

    if (filtros.data_fim) {
        query = query.lte("data", filtros.data_fim);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Erro ao carregar histórico:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="15">Erro ao carregar dados.</td>
            </tr>
        `;

        mostrarStatus("Erro ao carregar histórico: " + error.message, "erro");
        return;
    }

    dadosFiltradosGlobais = aplicarFiltrosTexto(data || [], filtros);
    paginaAtual = 1;

    renderizarTabelaPaginada();
    atualizarUrlComFiltros();
}

function abrirModalExclusao(id) {
    idParaExcluir = id;
    modalExcluir.style.display = "flex";
}

function fecharModalExclusao() {
    idParaExcluir = null;
    modalExcluir.style.display = "none";
}

async function excluirAvaliacao() {
    if (!idParaExcluir) return;

    const { error } = await supabaseClient
        .from("avaliacoes")
        .delete()
        .eq("id", idParaExcluir);

    if (error) {
        console.error("Erro ao excluir avaliação:", error);
        mostrarStatus("Erro ao excluir avaliação: " + error.message, "erro");
        fecharModalExclusao();
        return;
    }

    fecharModalExclusao();
    mostrarStatus("Avaliação excluída com sucesso.", "info");

    await carregarHistorico();
}

document.getElementById("form-filtros").addEventListener("submit", async function (e) {
    e.preventDefault();
    paginaAtual = 1;
    await carregarHistorico();
});

document.getElementById("btn-limpar").addEventListener("click", async function () {
    document.getElementById("form-filtros").reset();

    classificacaoAtual = "";
    paginaAtual = 1;

    atualizarBotoesClassificacao();
    esconderStatus();

    await carregarHistorico();
});

document.querySelectorAll(".btn-classificacao").forEach((botao) => {
    botao.addEventListener("click", async function () {
        classificacaoAtual = this.dataset.classificacao || "";
        paginaAtual = 1;

        atualizarBotoesClassificacao();

        await carregarHistorico();
    });
});

confirmarExclusaoBtn.addEventListener("click", excluirAvaliacao);
cancelarExclusaoBtn.addEventListener("click", fecharModalExclusao);

window.addEventListener("click", function (event) {
    if (event.target === modalExcluir) {
        fecharModalExclusao();
    }
});

document.addEventListener("DOMContentLoaded", async function () {
    preencherFiltrosComUrl();
    await carregarHistorico();
});

window.abrirModalExclusao = abrirModalExclusao;
window.irParaPagina = irParaPagina;
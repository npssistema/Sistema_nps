let classificacaoAtual = "";
let idParaExcluir = null;

const tbody = document.getElementById("tabela-avaliacoes");
const statusBox = document.getElementById("status-box");
const modalExcluir = document.getElementById("modalExcluir");
const confirmarExclusaoBtn = document.getElementById("confirmarExclusao");
const cancelarExclusaoBtn = document.getElementById("cancelarExclusao");

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

    const partes = dataISO.split("-");
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

function compararIgualIgnorandoAcentoEMaiuscula(valorBanco, valorFiltro) {
    return normalizar(valorBanco) === normalizar(valorFiltro);
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

function obterBadgeClassificacao(classificacao) {
    if (classificacao === "promotor") {
        return '<span class="classificacao-badge badge-promotor">Promotor</span>';
    }

    if (classificacao === "neutro") {
        return '<span class="classificacao-badge badge-neutro">Neutro</span>';
    }

    return '<span class="classificacao-badge badge-detrator">Detrator</span>';
}

function obterClasseLinha(classificacao) {
    if (classificacao === "promotor") return "linha-promotor";
    if (classificacao === "neutro") return "linha-neutro";
    return "linha-detrator";
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
    const classeLinha = obterClasseLinha(a.classificacao);
    const badge = obterBadgeClassificacao(a.classificacao);

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
            <td>${a.q1 ?? ""}</td>
            <td>${a.q2 ?? ""}</td>
            <td>${a.q3 ?? ""}</td>
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

function renderizarTabela(avaliacoes) {
    if (!avaliacoes || avaliacoes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="15">Nenhuma avaliação encontrada.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = avaliacoes.map(montarLinhaHtml).join("");
}

function aplicarFiltrosExatosSemAcento(avaliacoes, filtros) {
    return avaliacoes.filter((a) => {
        if (filtros.equipamento && !compararIgualIgnorandoAcentoEMaiuscula(a.equipamento, filtros.equipamento)) {
            return false;
        }

        if (filtros.marca && !compararIgualIgnorandoAcentoEMaiuscula(a.marca, filtros.marca)) {
            return false;
        }

        if (filtros.modelo && !compararIgualIgnorandoAcentoEMaiuscula(a.modelo, filtros.modelo)) {
            return false;
        }

        if (filtros.localizacao && !compararIgualIgnorandoAcentoEMaiuscula(a.localizacao, filtros.localizacao)) {
            return false;
        }

        if (filtros.orgao && !compararIgualIgnorandoAcentoEMaiuscula(a.orgao, filtros.orgao)) {
            return false;
        }

        return true;
    });
}

async function carregarHistorico() {
    esconderStatus();

    tbody.innerHTML = `
        <tr>
            <td colspan="15">Carregando avaliações...</td>
        </tr>
    `;

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

    if (filtros.classificacao) {
        query = query.eq("classificacao", filtros.classificacao);
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

    const dadosFiltrados = aplicarFiltrosExatosSemAcento(data, filtros);

    renderizarTabela(dadosFiltrados);
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
    await carregarHistorico();
});

document.getElementById("btn-limpar").addEventListener("click", async function () {
    document.getElementById("form-filtros").reset();
    classificacaoAtual = "";
    atualizarBotoesClassificacao();
    esconderStatus();
    await carregarHistorico();
});

document.querySelectorAll(".btn-classificacao").forEach((botao) => {
    botao.addEventListener("click", async function () {
        classificacaoAtual = this.dataset.classificacao || "";
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
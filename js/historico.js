let classificacaoSelecionada = "";
let idParaExcluir = null;

const tabela = document.getElementById("tabela-avaliacoes");
const formFiltros = document.getElementById("form-filtros");
const btnLimpar = document.getElementById("btn-limpar");
const statusBox = document.getElementById("status-box");

const modalExcluir = document.getElementById("modalExcluir");
const confirmarExclusao = document.getElementById("confirmarExclusao");
const cancelarExclusao = document.getElementById("cancelarExclusao");

function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function textoIgual(valorBanco, valorFiltro) {
    if (!valorFiltro) return true;
    return normalizarTexto(valorBanco) === normalizarTexto(valorFiltro);
}

function mostrarStatus(mensagem, tipo = "info") {
    statusBox.textContent = mensagem;
    statusBox.className = `status-box status-${tipo}`;
}

function limparStatus() {
    statusBox.textContent = "";
    statusBox.className = "status-box";
}

function classificarNPS(nota) {
    const nps = Number(nota);

    if (nps >= 9) return "promotor";
    if (nps >= 7) return "neutro";
    return "detrator";
}

function formatarClassificacao(classificacao) {
    if (classificacao === "promotor") {
        return `<span class="classificacao-badge badge-promotor">Promotor</span>`;
    }

    if (classificacao === "neutro") {
        return `<span class="classificacao-badge badge-neutro">Neutro</span>`;
    }

    return `<span class="classificacao-badge badge-detrator">Detrator</span>`;
}

function formatarData(data) {
    if (!data) return "";

    const partes = data.split("-");
    if (partes.length !== 3) return data;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

async function carregarAvaliacoes() {
    limparStatus();

    tabela.innerHTML = `
        <tr>
            <td colspan="15">Carregando avaliações...</td>
        </tr>
    `;

    const os = document.getElementById("filtro_os").value.trim();
    const dataInicio = document.getElementById("filtro_data_inicio").value;
    const dataFim = document.getElementById("filtro_data_fim").value;

    const equipamento = document.getElementById("filtro_equipamento").value.trim();
    const marca = document.getElementById("filtro_marca").value.trim();
    const modelo = document.getElementById("filtro_modelo").value.trim();
    const localizacao = document.getElementById("filtro_localizacao").value.trim();
    const orgao = document.getElementById("filtro_orgao").value.trim();

    let query = supabase
        .from("avaliacoes")
        .select("*")
        .order("id", { ascending: false });

    if (os) {
        query = query.eq("os", os);
    }

    if (dataInicio) {
        query = query.gte("data_manutencao", dataInicio);
    }

    if (dataFim) {
        query = query.lte("data_manutencao", dataFim);
    }

    const { data, error } = await query;

    if (error) {
        console.error(error);
        tabela.innerHTML = `
            <tr>
                <td colspan="15">Erro ao carregar avaliações.</td>
            </tr>
        `;
        mostrarStatus("Erro ao carregar avaliações.", "erro");
        return;
    }

    let avaliacoesFiltradas = data.filter(item => {
        const classificacao = classificarNPS(item.nota_suporte);

        return (
            textoIgual(item.equipamento, equipamento) &&
            textoIgual(item.marca, marca) &&
            textoIgual(item.modelo, modelo) &&
            textoIgual(item.localizacao, localizacao) &&
            textoIgual(item.orgao, orgao) &&
            (!classificacaoSelecionada || classificacao === classificacaoSelecionada)
        );
    });

    if (avaliacoesFiltradas.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="15">Nenhuma avaliação encontrada.</td>
            </tr>
        `;
        mostrarStatus("Nenhuma avaliação encontrada com os filtros informados.", "info");
        return;
    }

    tabela.innerHTML = "";

    avaliacoesFiltradas.forEach(item => {
        const classificacao = classificarNPS(item.nota_suporte);

        let classeLinha = "";
        if (classificacao === "promotor") classeLinha = "linha-promotor";
        if (classificacao === "neutro") classeLinha = "linha-neutro";
        if (classificacao === "detrator") classeLinha = "linha-detrator";

        const linha = document.createElement("tr");
        linha.className = classeLinha;

        linha.innerHTML = `
            <td>${item.id || ""}</td>
            <td>${item.os || ""}</td>
            <td>${item.equipamento || ""}</td>
            <td>${item.marca || ""}</td>
            <td>${item.modelo || ""}</td>
            <td>${item.localizacao || ""}</td>
            <td>${item.orgao || ""}</td>
            <td>${formatarData(item.data_manutencao)}</td>
            <td>${item.nota_servico || ""}</td>
            <td>${item.nota_tecnico || ""}</td>
            <td>${item.nota_suporte || ""}</td>
            <td class="comentario-coluna">${item.comentario || ""}</td>
            <td>${item.registrado_por || ""}</td>
            <td>${formatarClassificacao(classificacao)}</td>
            <td>
                <button class="btn-excluir" onclick="abrirModalExcluir(${item.id})">
                    Excluir
                </button>
            </td>
        `;

        tabela.appendChild(linha);
    });
}

function abrirModalExcluir(id) {
    idParaExcluir = id;
    modalExcluir.style.display = "flex";
}

function fecharModalExcluir() {
    idParaExcluir = null;
    modalExcluir.style.display = "none";
}

async function excluirAvaliacao() {
    if (!idParaExcluir) return;

    const { error } = await supabase
        .from("avaliacoes")
        .delete()
        .eq("id", idParaExcluir);

    if (error) {
        console.error(error);
        mostrarStatus("Erro ao excluir avaliação.", "erro");
        fecharModalExcluir();
        return;
    }

    fecharModalExcluir();
    carregarAvaliacoes();
}

formFiltros.addEventListener("submit", function(event) {
    event.preventDefault();
    carregarAvaliacoes();
});

btnLimpar.addEventListener("click", function() {
    formFiltros.reset();
    classificacaoSelecionada = "";

    document.querySelectorAll(".btn-classificacao").forEach(btn => {
        btn.classList.remove("ativo");
    });

    document.querySelector('.btn-classificacao[data-classificacao=""]').classList.add("ativo");

    carregarAvaliacoes();
});

document.querySelectorAll(".btn-classificacao").forEach(botao => {
    botao.addEventListener("click", function() {
        classificacaoSelecionada = this.dataset.classificacao;

        document.querySelectorAll(".btn-classificacao").forEach(btn => {
            btn.classList.remove("ativo");
        });

        this.classList.add("ativo");

        carregarAvaliacoes();
    });
});

confirmarExclusao.addEventListener("click", excluirAvaliacao);
cancelarExclusao.addEventListener("click", fecharModalExcluir);

modalExcluir.addEventListener("click", function(event) {
    if (event.target === modalExcluir) {
        fecharModalExcluir();
    }
});

carregarAvaliacoes();
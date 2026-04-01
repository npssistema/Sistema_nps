function mostrarMensagem(texto, tipo) {
    const msg = document.getElementById("mensagem");
    msg.className = "mensagem " + tipo;
    msg.textContent = texto;
}

function limparMensagem() {
    const msg = document.getElementById("mensagem");
    msg.className = "mensagem";
    msg.textContent = "";
}

function calcularClassificacao(q1, q2, q3) {
    const media = (Number(q1) + Number(q2) + Number(q3)) / 3;

    if (media >= 4) return "promotor";
    if (media >= 3) return "neutro";
    return "detrator";
}

document.getElementById("form-avaliacao").addEventListener("submit", async function (e) {
    e.preventDefault();
    limparMensagem();

    const btnSalvar = document.getElementById("btnSalvar");
    btnSalvar.disabled = true;
    btnSalvar.textContent = "Salvando...";

    const form = e.target;

    const dados = {
        os_numero: form.os_numero.value.trim(),
        equipamento: form.equipamento.value.trim(),
        marca: form.marca.value.trim(),
        modelo: form.modelo.value.trim(),
        localizacao: form.localizacao.value.trim(),
        orgao: form.orgao.value.trim(),
        data: form.data.value,
        q1: Number(form.q1.value),
        q2: Number(form.q2.value),
        q3: Number(form.q3.value),
        comentario: form.comentario.value.trim(),
        registrado_por: form.registrado_por.value.trim(),
        classificacao: calcularClassificacao(
            form.q1.value,
            form.q2.value,
            form.q3.value
        )
    };

    try {
        const { error } = await supabaseClient
            .from("avaliacoes")
            .insert([dados]);

        if (error) {
            mostrarMensagem("Erro ao salvar: " + error.message, "erro");
            return;
        }

        mostrarMensagem("Avaliação salva com sucesso!", "sucesso");
        form.reset();

    } catch (err) {
        console.error(err);
        mostrarMensagem("Erro inesperado.", "erro");
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = "Salvar";
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const campoData = document.getElementById("data");

    if (!campoData.value) {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");

        campoData.value = `${ano}-${mes}-${dia}`;
    }
});
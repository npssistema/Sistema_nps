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
    const osNumero = form.os_numero.value.trim();

    try {
        const { data: osExistente, error: erroBusca } = await supabaseClient
            .from("avaliacoes")
            .select("id")
            .eq("os_numero", osNumero)
            .maybeSingle();

        if (erroBusca) {
            mostrarMensagem("Erro ao verificar OS: " + erroBusca.message, "erro");
            btnSalvar.disabled = false;
            btnSalvar.textContent = "Salvar";
            return;
        }

        if (osExistente) {
            mostrarMensagem(`A Ordem de Serviço ${osNumero} já possui uma avaliação cadastrada!`, "erro");
            form.os_numero.focus();
            btnSalvar.disabled = false;
            btnSalvar.textContent = "Salvar";
            return;
        }

        const recusouResponder = form.recusou_responder ? form.recusou_responder.checked : false;

        const dados = {
            os_numero: osNumero,
            equipamento: form.equipamento.value.trim(),
            marca: form.marca.value.trim(),
            modelo: form.modelo.value.trim(),
            localizacao: form.localizacao.value.trim(),
            orgao: form.orgao.value.trim(),
            data: form.data.value,
            registrado_por: form.registrado_por.value.trim(),
            recusou_responder: recusouResponder,
            q1: recusouResponder ? null : Number(form.q1.value),
            q2: recusouResponder ? null : Number(form.q2.value),
            q3: recusouResponder ? null : Number(form.q3.value),
            comentario: recusouResponder ? null : form.comentario.value.trim(),
            classificacao: recusouResponder ? null : calcularClassificacao(form.q1.value, form.q2.value, form.q3.value)
        };

        const { error } = await supabaseClient.from("avaliacoes").insert([dados]);

        if (error) {
            mostrarMensagem("Erro ao salvar: " + error.message, "erro");
            return;
        }

        mostrarMensagem("Avaliação salva com sucesso!", "sucesso");
        form.reset();
        
        const botoesNota = document.querySelectorAll('input[type="radio"]');
        const campoComentario = document.getElementById('comentario');
        
        botoesNota.forEach(radio => {
            radio.disabled = false;
            radio.setAttribute('required', 'required');
        });
        if (campoComentario) {
            campoComentario.disabled = false;
        }

        // LIMPEZA AUTOMÁTICA APÓS 4 SEGUNDOS
        setTimeout(() => {
            limparMensagem();
        }, 4000);

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
    if (campoData && !campoData.value) {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");
        campoData.value = `${ano}-${mes}-${dia}`;
    }

    const checkboxRecusou = document.getElementById('recusou_responder');
    const botoesNota = document.querySelectorAll('input[type="radio"]');
    const campoComentario = document.getElementById('comentario');

    if (checkboxRecusou) {
        checkboxRecusou.addEventListener('change', function(e) {
            const isChecked = e.target.checked;
            botoesNota.forEach(radio => {
                radio.disabled = isChecked;
                if (isChecked) {
                    radio.checked = false;
                    radio.removeAttribute('required');
                } else {
                    radio.setAttribute('required', 'required');
                }
            });
            if (campoComentario) {
                campoComentario.disabled = isChecked;
                if (isChecked) {
                    campoComentario.value = "";
                }
            }
        });
    }

    const datalistOrgaos = document.getElementById('lista-orgaos');
    const listaDeOrgaos = [
        "CREDESH","DGC","DIRQS","DIVGP","HO-UFU","STCOR","STEC","UACE",
        "UADCP","UAPAT","UBCME","UCA","UCAP","UCIR","UCM","UDI","UFCD",
        "UGPESQ","UHH","ULAC","UMUL","UNUT","UONC","UPDR","UREAB","URES",
        "USCV","USD","USME","USNE","USOST","USUR","UTIAD","UTINEO","UTO","UUE","UVS"
    ];

    if (datalistOrgaos) {
        listaDeOrgaos.forEach(orgao => {
            const option = document.createElement('option');
            option.value = orgao;
            datalistOrgaos.appendChild(option);
        });
    }
});
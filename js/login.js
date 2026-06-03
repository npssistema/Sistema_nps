document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.getElementById("form-login");
    const btnSubmit = document.getElementById("btn-submit");
    const erroMsg = document.getElementById("erro-login");

    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault(); // Evita recarregar a página
        
        // Esconde erro e mostra status de carregamento
        erroMsg.style.display = "none";
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Verificando...";

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("senha").value;

        // Tenta fazer o login no Supabase
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            erroMsg.style.display = "block";
            erroMsg.textContent = "E-mail ou senha incorretos.";
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Entrar";
        } else {
            // Se der certo, manda para a tela inicial
            window.location.replace("index.html");
        }
    });
});
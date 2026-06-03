document.addEventListener("DOMContentLoaded", async () => {
    // 1. Verifica se o usuário tem permissão (Sessão ativa)
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (!session || error) {
        // Se não tiver, manda para o login imediatamente
        window.location.replace("login.html");
        return; 
    }

    // 2. Procura todos os botões de "Sair" na tela e ativa eles
    const botoesSair = document.querySelectorAll(".btn-sair");
    
    botoesSair.forEach(botao => {
        botao.addEventListener("click", async () => {
            // Mostra pro usuário que está saindo
            botao.textContent = "Saindo...";
            botao.disabled = true;

            // Desloga do Supabase e manda pro login
            await supabaseClient.auth.signOut();
            window.location.replace("login.html");
        });
    });
});

// Deixando a função global como plano B caso o HTML precise
window.fazerLogout = async function() {
    await supabaseClient.auth.signOut();
    window.location.replace("login.html");
};
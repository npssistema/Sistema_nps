console.log("SUPABASE JS CARREGOU");

const SUPABASE_URL = "https://qwuhsohaitzuzqjqikwn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_J6phyZVFiMF5F_V62NzTMg_xbZnjAiy";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log("CLIENTE CRIADO:", supabaseClient);
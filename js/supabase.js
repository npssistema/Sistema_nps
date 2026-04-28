console.log("SUPABASE JS CARREGOU");

const SUPABASE_URL = "https://maifzrzarjbnjqehfajv.supabase.co";
const SUPABASE_ANON_KEY = "https://qwuhsohaitzuzqjqikwn.supabase.co";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log("CLIENTE CRIADO:", supabaseClient);
console.log("SUPABASE JS CARREGOU");

const SUPABASE_URL = "https://maifzrzarjbnjqehfajv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tiQMppNIHYHFFHLCtJ2-8w_VmMPNSBc";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
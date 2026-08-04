// ============================================================
// supabase-config.js
// SETUP.md の手順に沿って、あなたのSupabaseプロジェクトの
// URLとanonキーをここに貼り付けてください。
// ============================================================

const SUPABASE_URL = "https://fgaqqumtuefrwlobotye.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnYXFxdW10dWVmcndsb2JvdHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NDAxMTQsImV4cCI6MjEwMTMxNjExNH0.223uoaVgHKWGg3N_XBTKxAfz33A5lkT2Iaxpa_4B3v8";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 写真・動画・音楽をアップロードするストレージバケット名
const MEDIA_BUCKET = "media";

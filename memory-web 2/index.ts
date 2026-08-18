// ============================================================
// supabase/functions/notify-push/index.ts
//
// データベースの変更（写真の追加など）が起きたときに、
// Database Webhook から呼び出され、そのコミュニティを
// 購読している端末にプッシュ通知を送ります。
//
// デプロイ方法・Webhookの設定方法は NOTIFICATIONS_SETUP.md を
// 参照してください。
// ============================================================

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

webpush.setVapidDetails("mailto:example@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TITLE_BY_TABLE: Record<string, string> = {
  photos: "新しい写真が追加されました",
  notes: "文言が追加・編集されました",
  comments: "新しいコメントが届きました",
  playlist_tracks: "新しい曲が追加されました"
};

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const table: string = payload.table;
    const record = payload.record ?? payload.old_record;
    const community: string | undefined = record?.community;

    if (!community) {
      return new Response("no community on record, skipping", { status: 200 });
    }

    const { data: subs, error: subErr } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("community", community);

    if (subErr) throw subErr;
    if (!subs || subs.length === 0) {
      return new Response("no subscribers", { status: 200 });
    }

    const body = JSON.stringify({
      title: TITLE_BY_TABLE[table] || "メモリーアルバムが更新されました",
      body: "アプリを開いて確認してみましょう",
      url: "./index.html"
    });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        ).catch(async (err: any) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
          throw err;
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return new Response(`sent ${sent}/${subs.length}`, { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 500 });
  }
});

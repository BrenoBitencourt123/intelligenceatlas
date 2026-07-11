// Edge function: streak-risk-push
// Agendada diariamente ~19h America/Sao_Paulo via pg_cron.
// Envia push para usuários com streak >= 3 E sem atividade hoje E com subscription ativa.
// Registra em push_log (tipo='streak_risk'). Uma por dia por usuário.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Janela: dia de hoje em São Paulo
    const now = new Date();
    const spDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
    }).format(now); // YYYY-MM-DD

    const dayStart = new Date(`${spDateStr}T00:00:00-03:00`).toISOString();
    const dayEnd = new Date(`${spDateStr}T23:59:59-03:00`).toISOString();

    // Pega TODAS as subscriptions (uma por user_id — usa a mais recente).
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth')
      .order('created_at', { ascending: false });
    if (!subs?.length) {
      return json({ sent: 0, message: 'no subscriptions' });
    }

    // Dedup por user_id
    const subByUser = new Map<string, typeof subs[number]>();
    for (const s of subs) if (!subByUser.has(s.user_id)) subByUser.set(s.user_id, s);
    const userIds = Array.from(subByUser.keys());

    // Já enviou push de risco hoje pra alguém? Evita spam.
    const { data: enviadosHoje } = await supabase
      .from('push_log')
      .select('user_id')
      .eq('tipo', 'streak_risk')
      .gte('sent_at', dayStart)
      .lte('sent_at', dayEnd);
    const jaEnviado = new Set((enviadosHoje ?? []).map((r) => r.user_id));

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    let sent = 0;
    let skipped = 0;
    let failed = 0;
    const cleaned: string[] = [];

    for (const uid of userIds) {
      if (jaEnviado.has(uid)) { skipped++; continue; }

      // Atividade HOJE? (checa 3 fontes)
      const [{ count: c1 }, { count: c2 }, { count: c3 }] = await Promise.all([
        supabase.from('question_attempts').select('*', { count: 'exact', head: true })
          .eq('user_id', uid).eq('session_date', spDateStr).eq('extra_session', false),
        supabase.from('essays').select('*', { count: 'exact', head: true })
          .eq('user_id', uid).gte('created_at', dayStart).lte('created_at', dayEnd),
        supabase.from('trilha_respostas').select('*', { count: 'exact', head: true })
          .eq('user_id', uid).gte('created_at', dayStart).lte('created_at', dayEnd),
      ]);
      const ativoHoje = (c1 ?? 0) + (c2 ?? 0) + (c3 ?? 0) > 0;
      if (ativoHoje) { skipped++; continue; }

      // Calcula streak simplificado — dias com atividade nos últimos 60 dias.
      const streak = await computeStreak(supabase, uid, spDateStr);
      if (streak < 3) { skipped++; continue; }

      const sub = subByUser.get(uid)!;
      const payload = JSON.stringify({
        title: `🔥 ${streak} dias em risco`,
        body: 'Seu fogo apaga à meia-noite. 10 minutos salvam.',
        url: '/hoje',
      });

      try {
        const res = await sendWebPush(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          vapidPublicKey,
          vapidPrivateKey,
        );
        if (res.ok || res.status === 201 || res.status === 202) {
          sent++;
          await supabase.from('push_log').insert({ user_id: uid, tipo: 'streak_risk' });
        } else if (res.status === 404 || res.status === 410) {
          cleaned.push(sub.endpoint);
          failed++;
        } else {
          failed++;
          console.error(`push failed uid=${uid} status=${res.status}`);
        }
        await res.text().catch(() => {});
      } catch (err) {
        failed++;
        console.error(`push error uid=${uid}`, err);
      }
    }

    if (cleaned.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', cleaned);
    }

    return json({ sent, skipped, failed, cleaned: cleaned.length });
  } catch (err) {
    console.error('streak-risk-push error', err);
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function computeStreak(
  supabase: ReturnType<typeof createClient>,
  uid: string,
  todayStr: string,
): Promise<number> {
  const since = new Date(todayStr + 'T00:00:00-03:00');
  since.setDate(since.getDate() - 60);
  const sinceIso = since.toISOString();

  const [sessions, essays, trilha, freezes] = await Promise.all([
    supabase.from('study_sessions').select('session_date').eq('user_id', uid).eq('is_extra', false).gte('session_date', since.toISOString().split('T')[0]),
    supabase.from('essays').select('created_at').eq('user_id', uid).gte('created_at', sinceIso),
    supabase.from('trilha_respostas').select('created_at').eq('user_id', uid).gte('created_at', sinceIso),
    supabase.from('streak_freezes').select('used_on').eq('user_id', uid),
  ]);

  const active = new Set<string>();
  (sessions.data ?? []).forEach((s: any) => active.add(s.session_date));
  (essays.data ?? []).forEach((e: any) => active.add(String(e.created_at).split('T')[0]));
  (trilha.data ?? []).forEach((t: any) => active.add(String(t.created_at).split('T')[0]));
  const frozen = new Set<string>((freezes.data ?? []).map((f: any) => f.used_on));

  let streak = 0;
  const cursor = new Date(todayStr + 'T12:00:00-03:00');
  const dStr = (d: Date) => d.toISOString().split('T')[0];
  // Se hoje não teve atividade, começa a contar de ontem
  if (!active.has(dStr(cursor))) cursor.setDate(cursor.getDate() - 1);
  for (let i = 0; i < 60; i++) {
    const k = dStr(cursor);
    if (active.has(k) || frozen.has(k)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return streak;
}

// ---- Web Push (copiado de send-push) ----
async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
): Promise<Response> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.hostname}`;
  const vapidJwt = await createVapidJwt(audience, vapidPublicKey, vapidPrivateKey);
  const encrypted = await encryptPayload(payload, subscription.keys.p256dh, subscription.keys.auth);
  return fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      'Authorization': `vapid t=${vapidJwt}, k=${vapidPublicKey}`,
    },
    body: encrypted as BodyInit,
  });
}

async function createVapidJwt(audience: string, publicKey: string, privateKey: string): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const claims = { aud: audience, exp: now + 12 * 3600, sub: 'mailto:contato@intelligenceatlas.com' };
  const headerB64 = b64u(new TextEncoder().encode(JSON.stringify(header)));
  const claimsB64 = b64u(new TextEncoder().encode(JSON.stringify(claims)));
  const unsigned = `${headerB64}.${claimsB64}`;
  const publicKeyData = b64uDec(publicKey);
  const jwk = {
    kty: 'EC', crv: 'P-256', d: privateKey,
    x: b64u(publicKeyData.slice(1, 33)),
    y: b64u(publicKeyData.slice(33, 65)),
  };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${b64u(new Uint8Array(sig))}`;
}

async function encryptPayload(payload: string, p256dhKey: string, authSecret: string): Promise<Uint8Array> {
  const clientPub = b64uDec(p256dhKey);
  const clientAuth = b64uDec(authSecret);
  const serverKeys = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const serverPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeys.publicKey));
  const clientKey = await crypto.subtle.importKey('raw', clientPub as BufferSource, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: clientKey }, serverKeys.privateKey, 256));
  const authInfo = cat(new TextEncoder().encode('WebPush: info\0'), clientPub, serverPubRaw);
  const ikm = await hkdf(clientAuth, shared, authInfo, 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, new TextEncoder().encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, new TextEncoder().encode('Content-Encoding: nonce\0'), 12);
  const padded = cat(new Uint8Array(new TextEncoder().encode(payload)), new Uint8Array([2]));
  const k = await crypto.subtle.importKey('raw', cek as BufferSource, 'AES-GCM', false, ['encrypt']);
  const enc = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce as BufferSource }, k, padded as BufferSource));
  const recSize = new ArrayBuffer(4);
  new DataView(recSize).setUint32(0, padded.length + 16);
  const hdr = cat(salt, new Uint8Array(recSize), new Uint8Array([serverPubRaw.length]), serverPubRaw);
  return cat(hdr, enc);
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC',
    await crypto.subtle.importKey('raw', salt as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
    ikm as BufferSource,
  ));
  const prkKey = await crypto.subtle.importKey('raw', prk as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const out = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey, cat(info, new Uint8Array([1])) as BufferSource));
  return out.slice(0, length);
}

function cat(...bufs: Uint8Array[]): Uint8Array {
  const total = bufs.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const b of bufs) { out.set(b, off); off += b.length; }
  return out;
}
function b64u(buf: Uint8Array): string {
  let s = '';
  for (const b of buf) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64uDec(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

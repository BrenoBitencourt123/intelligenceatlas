import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get today's theme
    const today = new Date().toISOString().split('T')[0];
    const { data: theme } = await supabase
      .from('daily_themes')
      .select('title')
      .eq('date', today)
      .maybeSingle();

    // Get all push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (subError || !subscriptions?.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'No subscriptions found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    // Build notification payload
    const payload = JSON.stringify({
      title: '📚 Atlas — Hora de estudar!',
      body: theme
        ? `Tema do dia: ${theme.title}`
        : 'Sua sessão de estudo está te esperando!',
      url: theme ? '/redacao' : '/',
    });

    let sent = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        const result = await sendWebPush(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          vapidPublicKey,
          vapidPrivateKey
        );

        if (result.ok) {
          sent++;
        } else if (result.status === 404 || result.status === 410) {
          // Subscription expired, mark for cleanup
          expiredEndpoints.push(sub.endpoint);
          failed++;
        } else {
          failed++;
          console.error(`Push failed for ${sub.endpoint}: ${result.status}`);
        }
      } catch (err) {
        failed++;
        console.error(`Push error for ${sub.endpoint}:`, err);
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
    }

    return new Response(JSON.stringify({ sent, failed, cleaned: expiredEndpoints.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Send push error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ---- Web Push implementation using Web Crypto API ----

async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.hostname}`;

  // Create VAPID JWT
  const vapidJwt = await createVapidJwt(audience, vapidPublicKey, vapidPrivateKey);

  // Encrypt payload
  const encrypted = await encryptPayload(payload, subscription.keys.p256dh, subscription.keys.auth);

  const headers: Record<string, string> = {
    'Content-Type': 'application/octet-stream',
    'Content-Encoding': 'aes128gcm',
    'TTL': '86400',
    'Authorization': `vapid t=${vapidJwt}, k=${vapidPublicKey}`,
  };

  return fetch(subscription.endpoint, {
    method: 'POST',
    headers,
    body: encrypted as BodyInit,
  });
}

async function createVapidJwt(audience: string, publicKey: string, privateKey: string): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: 'mailto:contato@intelligenceatlas.com',
  };

  const headerB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const claimsB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  const unsignedToken = `${headerB64}.${claimsB64}`;

  const keyData = base64urlDecode(privateKey);
  const publicKeyData = base64urlDecode(publicKey);

  // Import the raw private key as JWK
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: privateKey,
    x: base64urlEncode(publicKeyData.slice(1, 33)),
    y: base64urlEncode(publicKeyData.slice(33, 65)),
  };

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw r||s format
  const sigArray = new Uint8Array(signature);
  const sigB64 = base64urlEncode(sigArray);

  return `${unsignedToken}.${sigB64}`;
}

async function encryptPayload(payload: string, p256dhKey: string, authSecret: string): Promise<Uint8Array> {
  const clientPublicKey = base64urlDecode(p256dhKey);
  const clientAuth = base64urlDecode(authSecret);

  // Generate server key pair
  const serverKeys = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  const serverPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', serverKeys.publicKey)
  );

  // Import client public key
  const clientKey = await crypto.subtle.importKey(
    'raw',
    clientPublicKey as BufferSource,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: clientKey },
      serverKeys.privateKey,
      256
    )
  );

  // HKDF for auth
  const authInfo = concatBuffers(
    new TextEncoder().encode('WebPush: info\0'),
    clientPublicKey,
    serverPublicKeyRaw
  );

  const ikm = await hkdfExtractExpand(clientAuth, sharedSecret, authInfo, 32);

  // Derive content encryption key and nonce
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cekInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0');

  const cek = await hkdfExtractExpand(salt, ikm, cekInfo, 16);
  const nonce = await hkdfExtractExpand(salt, ikm, nonceInfo, 12);

  // Encrypt
  const paddedPayload = concatBuffers(new Uint8Array(new TextEncoder().encode(payload)), new Uint8Array([2]));

  const key = await crypto.subtle.importKey('raw', cek as BufferSource, 'AES-GCM', false, ['encrypt']);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce as BufferSource }, key, paddedPayload as BufferSource)
  );

  // Build aes128gcm header
  const recordSize = new ArrayBuffer(4);
  new DataView(recordSize).setUint32(0, paddedPayload.length + 16); // +16 for tag
  const header = concatBuffers(
    salt,
    new Uint8Array(recordSize),
    new Uint8Array([serverPublicKeyRaw.length]),
    serverPublicKeyRaw
  );

  return concatBuffers(header, encrypted);
}

async function hkdfExtractExpand(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', 
    await crypto.subtle.importKey('raw', salt as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
    ikm as BufferSource
  ));

  const infoWithCounter = concatBuffers(info, new Uint8Array([1]));
  const prkKey = await crypto.subtle.importKey('raw', prk as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const output = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey, infoWithCounter as BufferSource));

  return output.slice(0, length);
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    result.set(buf, offset);
    offset += buf.length;
  }
  return result;
}

function base64urlEncode(buffer: Uint8Array): string {
  let binary = '';
  for (const byte of buffer) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

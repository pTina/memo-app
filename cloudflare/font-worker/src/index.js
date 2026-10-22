const MAX_BYTES = 20 * 1024 * 1024;
const FONT_ID = /^[0-9a-f-]{8,64}$/i;
const ALLOWED_ORIGIN = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://ptina.github.io',
];

function allowedOrigin(origin) {
  if (ALLOWED_ORIGIN.includes(origin)) return origin;
  try {
    const host = new URL(origin).hostname;
    if (host === 'localhost' || host === '127.0.0.1') return origin;
  } catch {
    return '';
  }
  return '';
}

function cors(request) {
  const origin = request.headers.get('Origin') ?? '';
  const allow = allowedOrigin(origin) || ALLOWED_ORIGIN[2];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Font-Format',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(request, status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(request), 'Content-Type': 'application/json' },
  });
}

function b64url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return atob(padded + pad);
}

async function verifyFirebaseToken(token, projectId) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('invalid');
  const header = JSON.parse(b64url(parts[0]));
  const payload = JSON.parse(b64url(parts[1]));
  if (header.alg !== 'RS256' || !header.kid) throw new Error('invalid');
  if (payload.aud !== projectId) throw new Error('aud');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('iss');
  if (!payload.sub || typeof payload.sub !== 'string') throw new Error('sub');
  if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) throw new Error('exp');

  const jwks = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
    .then((res) => res.json());
  const jwk = (jwks.keys ?? []).find((key) => key.kid === header.kid);
  if (!jwk) throw new Error('kid');

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = Uint8Array.from(b64url(parts[2]), (ch) => ch.charCodeAt(0));
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signed);
  if (!ok) throw new Error('sig');
  return payload.sub;
}

async function uidFrom(request, env) {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('config');
  const header = request.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new Error('auth');
  return verifyFirebaseToken(token, projectId);
}

function objectKey(userId, fontId) {
  return `users/${userId}/fonts/${fontId}`;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(request) });
    }

    const url = new URL(request.url);
    const match = url.pathname.match(/^\/fonts\/([^/]+)$/);
    if (!match) return json(request, 404, { error: 'not_found' });
    const fontId = match[1];
    if (!FONT_ID.test(fontId)) return json(request, 400, { error: 'bad_id' });

    let userId;
    try {
      userId = await uidFrom(request, env);
    } catch {
      return json(request, 401, { error: 'unauthorized' });
    }

    const key = objectKey(userId, fontId);

    if (request.method === 'GET') {
      const object = await env.FONTS.get(key);
      if (!object) return json(request, 404, { error: 'not_found' });
      return new Response(object.body, {
        headers: {
          ...cors(request),
          'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
          'Cache-Control': 'private, max-age=31536000',
        },
      });
    }

    if (request.method === 'DELETE') {
      await env.FONTS.delete(key);
      return new Response(null, { status: 204, headers: cors(request) });
    }

    if (request.method === 'PUT') {
      const length = Number(request.headers.get('Content-Length') ?? 0);
      if (length > MAX_BYTES) return json(request, 413, { error: 'too_large' });
      const body = await request.arrayBuffer();
      if (body.byteLength > MAX_BYTES) return json(request, 413, { error: 'too_large' });
      const format = request.headers.get('X-Font-Format') ?? '';
      const types = {
        ttf: 'font/ttf',
        otf: 'font/otf',
        woff: 'font/woff',
        woff2: 'font/woff2',
      };
      if (!types[format]) return json(request, 400, { error: 'bad_format' });
      await env.FONTS.put(key, body, {
        httpMetadata: { contentType: types[format] },
      });
      return new Response(null, { status: 204, headers: cors(request) });
    }

    return json(request, 405, { error: 'method' });
  },
};

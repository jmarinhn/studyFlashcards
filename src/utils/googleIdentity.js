let sdkPromise;
let initializedClientId;
let initializedNonce;
let noncePromise;

export function getGoogleNonce() {
  if (!noncePromise) noncePromise = (async () => {
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce));
    const hashedNonce = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    return { nonce, hashedNonce };
  })();
  return noncePromise;
}

let credentialHandler;

export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    const finish = (error) => {
      clearTimeout(timer);
      script.onload = script.onerror = null;
      if (error) {
        script.remove();
        sdkPromise = undefined;
        reject(error);
      } else resolve(window.google.accounts.id);
    };
    const timer = setTimeout(() => finish(new Error('Google tardó demasiado en responder. Comprueba tu conexión y vuelve a intentarlo.')), 15000);
    script.onload = () => finish(window.google?.accounts?.id ? null : new Error('No se pudo iniciar Google. Vuelve a intentarlo.'));
    script.onerror = () => finish(new Error('No se pudo cargar Google. Comprueba tu conexión o los bloqueadores del navegador.'));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export function bindGoogleIdentity(api, clientId, handler, nonce) {
  credentialHandler = handler;
  if (initializedClientId !== clientId || initializedNonce !== nonce) {
    api.initialize({
      client_id: clientId,
      ...(nonce ? { nonce } : {}),
      callback: (response) => credentialHandler?.(response),
      auto_select: false,
    });
    initializedClientId = clientId;
    initializedNonce = nonce;
  }
  return () => {
    if (credentialHandler === handler) credentialHandler = undefined;
  };
}

// Decode profile claims for this local-only app; this is not server-side token verification.
export function profileFromCredential(credential, clientId, now = Date.now()) {
  try {
    const part = credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(part), (c) => c.charCodeAt(0))));
    if (!payload.sub || !payload.email || payload.email_verified !== true ||
        payload.aud !== clientId || !['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss) ||
        !Number.isFinite(payload.exp) || payload.exp * 1000 <= now) throw new Error();
    return {
      id: payload.sub,
      name: payload.name || payload.given_name || 'Usuario Google',
      email: payload.email,
      picture: payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name || 'G')}&background=4f46e5&color=fff`,
      provider: 'google',
      joinedAt: new Date(now).toISOString(),
    };
  } catch {
    throw new Error('Google no devolvió un perfil válido. Vuelve a iniciar sesión.');
  }
}

export function restoreGoogleProfile(saved) {
  try {
    const profile = JSON.parse(saved);
    return profile?.provider === 'google' && typeof profile.id === 'string' &&
      !profile.id.startsWith('g_') && profile.id && profile.name && profile.email ? profile : null;
  } catch { return null; }
}

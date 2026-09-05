import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const communityClient = url && key ? createClient(url, key) : null;
export async function communityApi(action, payload = {}) {
  if (!communityClient) throw new Error('Community Decks aún no está conectado. Puedes continuar usando tus mazos locales.');
  const { data, error } = await communityClient.rpc('study_community', { action, payload });
  if (error) throw new Error(error.message);
  return data;
}
export async function verifyGoogleCredential(token, nonce) {
  const { data, error } = await communityClient.auth.signInWithIdToken({ provider: 'google', token, nonce });
  if (error) throw new Error('No se pudo verificar la cuenta con el servidor. ' + error.message);
  return data.user;
}
export function cloudProfile(user) {
  if (!user) return null;
  return { id: user.id, name: user.user_metadata?.full_name || user.user_metadata?.name || 'Estudiante', email: user.email,
    picture: user.user_metadata?.avatar_url || '', provider: 'google', cloud: true };
}

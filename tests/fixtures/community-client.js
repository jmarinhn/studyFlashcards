// Test-only adapter, substituted by tests/devCommunity.mjs. Never imported by production.
export const communityClient = {};
export async function communityApi(action,payload={}) {
  const response=await fetch('/__test/rpc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,payload,actor:sessionStorage.getItem('test-actor')||'owner'})});
  const result=await response.json();if(!response.ok)throw new Error(result.error);return result;
}

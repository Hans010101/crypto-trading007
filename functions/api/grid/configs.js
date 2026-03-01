const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
// Grid configs are local files - not available on Cloudflare Pages (no filesystem)
export async function onRequestGet() {
    return new Response(JSON.stringify({ configs: [] }), { headers: CORS });
}
export async function onRequestOptions() { return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } }); }

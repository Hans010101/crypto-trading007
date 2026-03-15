const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
// Dedicated L/S ratio endpoint - each invocation has its own 50-subrequest budget
// Frontend calls this endpoint 2x concurrently to cover 90 symbols total

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const symbolParam = url.searchParams.get('symbols') || '';
    const symbols = symbolParam.split(',').map(s => s.trim()).filter(Boolean).slice(0, 45);

    if (symbols.length === 0) {
      return new Response(JSON.stringify({}), { headers: CORS });
    }

    const results = {};
    // All concurrent - 45 subrequests max, well within the 50 limit
    await Promise.all(symbols.map(sym =>
      fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${sym}&period=5m&limit=1`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            let ratio = parseFloat(data[0].longShortRatio || 0);
            if (!isFinite(ratio)) ratio = 9999;
            results[sym] = {
              ratio,
              long: parseFloat(data[0].longAccount || 0) * 100,
              short: parseFloat(data[0].shortAccount || 0) * 100,
            };
          }
        })
        .catch(() => { })
    ));

    return new Response(JSON.stringify(results), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { headers: CORS, status: 500 });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } });
}

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
// Dedicated OI 24H change endpoint - each invocation has its own 50-subrequest budget
// /api/binance/oi?symbols=BTCUSDT,ETHUSDT,...  (max 45 per call)

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const symbolParam = url.searchParams.get('symbols') || '';
    const symbols = symbolParam.split(',').map(s => s.trim()).filter(Boolean).slice(0, 45);

    if (symbols.length === 0) {
      return new Response(JSON.stringify({}), { headers: CORS });
    }

    const results = {};
    // All concurrent within 45-subrequest budget
    await Promise.all(symbols.map(sym =>
      fetch(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${sym}&period=1h&limit=25`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data) && data.length >= 2) {
            const last = data[data.length - 1];
            const first = data[0];
            const oiNow = parseFloat(last.sumOpenInterest || 0);
            const oi24h = parseFloat(first.sumOpenInterest || 0);
            results[sym] = {
              change: oi24h > 0 ? (oiNow - oi24h) / oi24h * 100 : 0,
              value: parseFloat(last.sumOpenInterestValue || 0),
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

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

export async function onRequestGet() {
    try {
        const res = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex');
        const data = await res.json();
        const usdtPairs = Array.isArray(data) ? data.filter(t => (t.symbol || '').endsWith('USDT')) : [];
        usdtPairs.sort((a, b) => Math.abs(parseFloat(b.lastFundingRate || 0)) - Math.abs(parseFloat(a.lastFundingRate || 0)));
        const top20 = usdtPairs.slice(0, 20).map((t, i) => ({
            rank: i + 1,
            symbol: t.symbol.replace('USDT', '/USDT'),
            markPrice: parseFloat(t.markPrice || 0),
            indexPrice: parseFloat(t.indexPrice || 0),
            fundingRate: parseFloat(t.lastFundingRate || 0),
            nextFundingTime: parseInt(t.nextFundingTime || 0),
        }));
        return new Response(JSON.stringify({ exchange: 'Binance', data: top20, ts: Date.now() }), { headers: CORS });
    } catch (e) {
        return new Response(JSON.stringify({ exchange: 'Binance', data: [], error: e.message }), { headers: CORS, status: 500 });
    }
}
export async function onRequestOptions() { return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } }); }

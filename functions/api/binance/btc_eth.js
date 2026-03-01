const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

export async function onRequestGet() {
    try {
        const url = 'https://fapi.binance.com/fapi/v1/ticker/24hr';
        const [btcRes, ethRes] = await Promise.all([
            fetch(`${url}?symbol=BTCUSDT`),
            fetch(`${url}?symbol=ETHUSDT`),
        ]);
        const [btc, eth] = await Promise.all([btcRes.json(), ethRes.json()]);
        return new Response(JSON.stringify({
            btc: { price: parseFloat(btc.lastPrice || 0), change: parseFloat(btc.priceChangePercent || 0) },
            eth: { price: parseFloat(eth.lastPrice || 0), change: parseFloat(eth.priceChangePercent || 0) },
        }), { headers: CORS });
    } catch (e) {
        return new Response(JSON.stringify({ btc: {}, eth: {}, error: e.message }), { headers: CORS, status: 500 });
    }
}
export async function onRequestOptions() { return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } }); }

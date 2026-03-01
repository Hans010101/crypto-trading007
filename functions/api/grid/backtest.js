const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

const TARGET_COINS = ['BTC', 'ETH', 'XRP', 'SOL', 'BNB', 'DOGE', 'ADA', 'TON', 'TRX', 'AVAX', 'SHIB', 'LINK', 'DOT', 'SUI', 'BCH', 'UNI', 'PEPE', 'LTC', 'NEAR', 'AAVE', 'APT'];

export async function onRequestGet() {
    try {
        const res = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr');
        const data = await res.json();
        const uniqueCoins = {};
        for (const t of (Array.isArray(data) ? data : [])) {
            const sym = t.symbol || '';
            if (!sym.endsWith('USDT')) continue;
            const base = sym.replace('USDT', '').replace('1000', '');
            if (!TARGET_COINS.includes(base)) continue;
            if (!uniqueCoins[base] || parseFloat(t.quoteVolume || 0) > parseFloat(uniqueCoins[base].quoteVolume || 0)) {
                uniqueCoins[base] = t;
            }
        }
        const sorted = TARGET_COINS.filter(c => uniqueCoins[c]).map((base, i) => {
            const t = uniqueCoins[base];
            const price = parseFloat(t.lastPrice || 0);
            const high = parseFloat(t.highPrice || 0);
            const low = parseFloat(t.lowPrice || 0);
            const change = parseFloat(t.priceChangePercent || 0);
            const volatility = low > 0 ? (high - low) / low * 100 : 0;
            const base_apr = volatility * 12;
            const long_apr = Math.max(-80, Math.min(base_apr + change * 15, 450));
            const short_apr = Math.max(-80, Math.min(base_apr - change * 15, 450));
            return { rank: i + 1, symbol: t.symbol.replace('USDT', '/USDT'), price, volatility, change24h: change, long_apr, short_apr };
        });
        return new Response(JSON.stringify({ data: sorted }), { headers: CORS });
    } catch (e) {
        return new Response(JSON.stringify({ data: [], error: e.message }), { headers: CORS, status: 500 });
    }
}
export async function onRequestOptions() { return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } }); }

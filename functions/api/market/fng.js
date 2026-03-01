const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

export async function onRequestGet() {
    try {
        const res = await fetch('https://api.alternative.me/fng/?limit=2');
        const data = await res.json();
        if (data?.data?.length >= 2) {
            const today = parseInt(data.data[0].value);
            const yesterday = parseInt(data.data[1].value);
            return new Response(JSON.stringify({
                value: today,
                classification: data.data[0].value_classification,
                change24h: yesterday > 0 ? (today - yesterday) / yesterday * 100 : 0,
            }), { headers: CORS });
        }
        if (data?.data?.length === 1) {
            return new Response(JSON.stringify({ value: parseInt(data.data[0].value), classification: data.data[0].value_classification, change24h: 0 }), { headers: CORS });
        }
        return new Response(JSON.stringify({ value: 50, classification: 'Neutral', change24h: 0 }), { headers: CORS });
    } catch (e) {
        return new Response(JSON.stringify({ value: 50, classification: 'Neutral', change24h: 0, error: e.message }), { headers: CORS, status: 500 });
    }
}
export async function onRequestOptions() { return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } }); }

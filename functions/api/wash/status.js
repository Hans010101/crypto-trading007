const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
export async function onRequestGet() {
    return new Response(JSON.stringify({
        data: [
            { id: 1, pair: 'ETH/USDT', mode: 'MAKER_TAKER (对敲)', target: '1,000 ETH', progress: '65%', status: 'Running', color: 'var(--gain)' },
            { id: 2, pair: 'SOL/USDT', mode: 'LIGHTER (市价单边)', target: '5,000 SOL', progress: '12%', status: 'Paused', color: 'var(--text-muted)' },
            { id: 3, pair: 'WIF/USDT', mode: 'RANDOM (随机抖动)', target: '100K WIF', progress: '99%', status: 'Running', color: 'var(--gain)' },
            { id: 4, pair: 'SUI/USDT', mode: 'GRID_WASH (网格刷量)', target: '20,000 SUI', progress: '87%', status: 'Running', color: 'var(--gain)' },
            { id: 5, pair: 'AVAX/USDT', mode: 'PING_PONG (乒乓自成交)', target: '15,000 AVAX', progress: '45%', status: 'Running', color: 'var(--gain)' },
            { id: 6, pair: 'APT/USDT', mode: 'MAKER_TAKER (对敲)', target: '10,000 APT', progress: '0%', status: 'Pending', color: 'var(--text-muted)' },
            { id: 7, pair: 'LINK/USDT', mode: 'TWAP (时间加权)', target: '5,000 LINK', progress: '100%', status: 'Finished', color: 'var(--text-primary)' },
        ]
    }), { headers: CORS });
}
export async function onRequestOptions() { return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } }); }

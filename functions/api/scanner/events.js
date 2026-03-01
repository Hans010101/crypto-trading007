const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
export async function onRequestGet() {
    return new Response(JSON.stringify({
        data: [
            { id: 1, pair: 'SUI/USDT', window: '5m', volatility: '8.5%', direction: '向上突破 (Bullish)', time: '刚才 (Just now)', color: 'var(--gain)' },
            { id: 2, pair: 'TRB/USDT', window: '1m', volatility: '15.2%', direction: '画门/砸盘 (Crash)', time: '2分钟前 (2m ago)', color: 'var(--loss)' },
            { id: 3, pair: 'BOME/USDT', window: '15s', volatility: '5.3%', direction: '暴力拉升 (Pump)', time: '5分钟前 (5m ago)', color: 'var(--gain)' },
            { id: 4, pair: 'ORDI/USDT', window: '3m', volatility: '7.1%', direction: '巨量承接 (Absorption)', time: '12分钟前 (12m ago)', color: 'var(--gain)' },
            { id: 5, pair: 'WIF/USDT', window: '1m', volatility: '10.0%', direction: '暴跌穿仓 (Flash Crash)', time: '18分钟前 (18m ago)', color: 'var(--loss)' },
            { id: 6, pair: 'MKR/USDT', window: '5m', volatility: '4.2%', direction: '异常买盘 (Whale Buy)', time: '25分钟前 (25m ago)', color: 'var(--gain)' },
            { id: 7, pair: 'TIA/USDT', window: '10s', volatility: '3.8%', direction: '流动性抽干 (Illiquid)', time: '半小时前 (30m ago)', color: 'var(--text-muted)' },
        ]
    }), { headers: CORS });
}
export async function onRequestOptions() { return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } }); }

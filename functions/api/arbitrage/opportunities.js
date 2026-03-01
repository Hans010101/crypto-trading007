const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
export async function onRequestGet() {
    return new Response(JSON.stringify({
        data: [
            { id: 1, type: '期现套利 (Spot/Perp)', pair: 'BTC', exchange_a: 'Binance ($64,710)', exchange_b: 'OKX ($64,750)', spread: '+0.06%', action: '一键双穿' },
            { id: 2, type: '跨币种三角 (Triangular)', pair: 'ETH/BTC', exchange_a: 'Binance (0.0450)', exchange_b: 'Bybit (0.0461)', spread: '+2.4%', action: '智能路由转换' },
            { id: 3, type: '跨所合约 (Perp/Perp)', pair: 'SOL/USDT', exchange_a: 'Bybit ($145.20)', exchange_b: 'MEXC ($146.10)', spread: '+0.62%', action: '单击套利' },
            { id: 4, type: '现货搬砖 (Spot/Spot)', pair: 'WIF/USDT', exchange_a: 'Gate.io ($2.105)', exchange_b: 'Binance ($2.130)', spread: '+1.18%', action: '执行划转搬砖' },
            { id: 5, type: '期现套利 (Spot/Perp)', pair: 'PEPE', exchange_a: 'KuCoin ($0.0001)', exchange_b: 'MEEX ($0.00012)', spread: '+0.20%', action: '自动对冲' },
            { id: 6, type: '跨所合约 (Perp/Perp)', pair: 'DOGE/USDT', exchange_a: 'Binance ($0.150)', exchange_b: 'OKX ($0.153)', spread: '+2.00%', action: '一键双穿' },
        ]
    }), { headers: CORS });
}
export async function onRequestOptions() { return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } }); }

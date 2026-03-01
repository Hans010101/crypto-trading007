const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
export async function onRequestGet() {
    return new Response(JSON.stringify({
        data: [
            { id: 1, pair: 'DOGE/USDT', condition: '涨破 (Price >)', target: '$0.500', distance: '还需要 7.5%', notify: 'Telegram, Webhook', status: 'Active', color: 'var(--text-primary)' },
            { id: 2, pair: 'PEPE/USDT', condition: '资金费率 <', target: '-0.5%', distance: '已触发 (Reached)', notify: 'SMS, App', status: 'Triggered', color: 'var(--loss)' },
            { id: 3, pair: 'BTC/USDT', condition: '跌破 (Price <)', target: '$58,000', distance: '还需要 10.3%', notify: 'Telegram', status: 'Active', color: 'var(--text-primary)' },
            { id: 4, pair: 'ETH/USDT', condition: '24H 交易量 >', target: '$5B', distance: '还需要 $1B', notify: 'App Notification', status: 'Active', color: 'var(--text-primary)' },
            { id: 5, pair: 'SOL/USDT', condition: '1小时涨幅 >', target: '10%', distance: '已触发 (Reached)', notify: 'Email, SMS', status: 'Triggered', color: 'var(--gain)' },
            { id: 6, pair: 'SUI/USDT', condition: '价格异常波动 >', target: '5% / 1m', distance: '未触发 (-2%)', notify: 'DingTalk', status: 'Active', color: 'var(--text-primary)' },
            { id: 7, pair: 'AR/USDT', condition: '深度失衡 (Bid/Ask)', target: '> 5.0', distance: '还需要 1.5', notify: 'Webhook', status: 'Active', color: 'var(--text-primary)' },
        ]
    }), { headers: CORS });
}
export async function onRequestOptions() { return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } }); }

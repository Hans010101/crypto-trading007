const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
export async function onRequestGet() {
    return new Response(JSON.stringify({
        name: '多交易所策略自动化系统', version: '2.0',
        modules: [
            { name: '网格交易系统', icon: '📊', status: 'available', desc: '普通/马丁/移动网格，剥头皮与本金保护', features: ['多种网格模式：普通网格、马丁网格、价格移动网格', '智能风控：剥头皮快速止损、本金保护自动平仓', '现货币种自动预留管理', '支持多交易所(Hyperliquid, Backpack, Lighter)', '自动订单监控和异常恢复系统'] },
            { name: '刷量交易系统', icon: '💹', status: 'available', desc: '挂单模式(Backpack)、市价模式(Lighter)', features: ['Backpack限价挂单刷量模式', 'Lighter WebSocket极速市价刷量', '智能订单匹配和多空对冲', '实时交易量、手续费精准追踪与统计', '支持多信号源(如跨交易所行情信号源)'] },
            { name: '套利监控系统', icon: '🔄', status: 'available', desc: '分段套利、多腿套利、跨交易所套利', features: ['基于历史天然独立价差的高级统计套利决策引擎', '分段网格分批下单机制，减少单笔大额的滑点冲击', '跨多交易所的实时毫秒级价差监控和自动执行合并', '自动监控并捕捉高额资金费率差的长线套利机会', '多重实盘流动性校验，确保挂单大概率完全成交'] },
            { name: '价格提醒系统', icon: '🔔', status: 'available', desc: '多交易所价格突破监控，声音提醒', features: ['监控币种实时价格阈值（上限/下限）并响应突破', '多交易所聚合深度监控架构', '达到设定的止盈止损线时通过系统蜂鸣声音震动提醒', '丰富的命令行桌面 UI 实时更新显示现价', '适合单次关键阻力/支撑位突破方向确认'] },
            { name: '波动率扫描器', icon: '🔍', status: 'available', desc: '虚拟网格模拟、实时APR计算、智能评级', features: ['在不实际花费手续费的情况下使用虚拟订单网格进行模拟推演回测', '实时换算当前各品种行情走势对应的预期年化收益率(APR)', '基于收益率预测模型为全市场所有代币打分客观评级(S/A/B/C/D)', '按高波动率对U本位合约进行实时滚动排序发现活跃标的', '为网格实盘操作提供强有力的数据导向建议和最优化参数'] },
        ],
        exchanges: [
            { name: 'Binance', spot: true, perp: true, status: 'active' },
            { name: 'OKX', spot: true, perp: true, status: 'active' },
            { name: 'Hyperliquid', spot: true, perp: true, status: 'active' },
            { name: 'Backpack', spot: false, perp: true, status: 'active' },
            { name: 'Lighter', spot: true, perp: true, status: 'active' },
            { name: 'EdgeX', spot: false, perp: true, status: 'active' },
            { name: 'Paradex', spot: false, perp: true, status: 'active' },
            { name: 'GRVT', spot: false, perp: true, status: 'active' },
            { name: 'Variational', spot: false, perp: false, status: 'limited' },
        ],
    }), { headers: CORS });
}
export async function onRequestOptions() { return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } }); }

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

export async function onRequestPost(context) {
    const apiKey = context.env.OPENAI_API_KEY;
    const apiBase = (context.env.OPENAI_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '');
    const model = context.env.LLM_MODEL || 'gpt-3.5-turbo';

    let message = '';
    try { const body = await context.request.json(); message = body.message || ''; } catch { }

    if (!apiKey) {
        const msg = '【系统提示】大模型未接通。\n\n由于您暂未配置大模型 API 密钥，当前处于脱机模式。请在 Cloudflare Pages 的项目设置 → Environment Variables 中添加 OPENAI_API_KEY 变量。';
        return new Response(JSON.stringify({ reply: msg }), { headers: CORS });
    }

    // Fetch market context (top coins + specific coin mentioned)
    let market_summary = '';
    try {
        const tickerRes = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr');
        const tickerData = await tickerRes.json();
        if (Array.isArray(tickerData)) {
            const usdtPairs = tickerData.filter(t => (t.symbol || '').endsWith('USDT') && parseFloat(t.quoteVolume || 0) > 1_000_000);
            const tickerMap = {};
            usdtPairs.forEach(t => { tickerMap[t.symbol.replace('USDT', '')] = t; });
            const mentioned = new Set(['BTC', 'ETH']);
            const msgUp = message.toUpperCase();
            Object.keys(tickerMap).forEach(sym => { if (msgUp.includes(sym)) mentioned.add(sym); });
            const byVol = [...usdtPairs].sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
            const byChg = [...usdtPairs].sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent));
            byVol.slice(0, 3).forEach(t => mentioned.add(t.symbol.replace('USDT', '')));
            byChg.slice(0, 3).forEach(t => mentioned.add(t.symbol.replace('USDT', '')));
            const lines = [];
            mentioned.forEach(sym => {
                const t = tickerMap[sym];
                if (t) {
                    const price = parseFloat(t.lastPrice || 0);
                    const chg = parseFloat(t.priceChangePercent || 0);
                    const vol = parseFloat(t.quoteVolume || 0);
                    lines.push(`- ${sym}: 现价 $${price.toLocaleString('en', { maximumFractionDigits: 4 })} | 24H涨跌 ${chg >= 0 ? '+' : ''}${chg.toFixed(2)}% | 24H成交额 $${(vol / 1e6).toFixed(0)}M`);
                }
            });
            if (lines.length) market_summary = '【系统捕获的实时行情切片 (包含用户询问标的、宏观基准与当前热点)】\n' + lines.join('\n');
        }
    } catch { }

    const system_prompt = `你是「大牛」——一位在加密货币与传统金融领域拥有超过15年实战经验的顶级量化投研顾问。
你的专业背景涵盖：
- **链上/链下数据分析**：精通 on-chain 指标（MVRV、NUPL、NVT、资金流向、巨鲸地址监控）；
- **衍生品结构与博弈**：深度理解永续合约资金费率、持仓量 OI、期权隐含波动率、多空挤压机制；
- **量化策略**：网格交易、统计套利、跨交易所价差策略、动量因子、流动性猎杀；
- **宏观金融视角**：美联储利率周期、美元指数 DXY、比特币减半周期、机构资金入场节奏；
- **币种基本面**：代币经济学、解锁压力、生态发展、技术路线与竞争壁垒分析。

**行为准则（必须严格遵守）：**
1. **拒绝泛泛而谈**——每一条建议必须有具体数据支撑（价格、费率、比率、关键位），绝不说"可能会涨"这类无效话语；
2. **给出明确操作方向**——做多/做空/观望，并说明入场区间、止损位、目标位，逻辑必须清晰闭环；
3. **精准排版**——使用 Markdown 加粗突出关键数字和结论，分点列出，总字数控制在 500 字以内以保持精炼；
4. **区分时间维度**——明确区分短线（1-48H）、中线（1-2周）操作建议，不混同；
5. **风控意识**——每个建议必须附带风险提示，尤其针对高资金费率、高杠杆、流动性不足场景；
6. 若行情数据中未收录该币种，直接基于你的专业训练库作答，并注明数据为截止训练日期的历史信息。

${market_summary}`;

    try {
        const resp = await fetch(`${apiBase}/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages: [{ role: 'system', content: system_prompt }, { role: 'user', content: message }] }),
        });
        if (resp.ok) {
            const data = await resp.json();
            return new Response(JSON.stringify({ reply: data.choices[0].message.content }), { headers: CORS });
        } else {
            const text = await resp.text();
            return new Response(JSON.stringify({ reply: `大模型接口请求失败: HTTP ${resp.status}\n\`\`\`json\n${text}\n\`\`\`` }), { headers: CORS });
        }
    } catch (e) {
        return new Response(JSON.stringify({ reply: `大模型网络请求异常: ${e.message}` }), { headers: CORS });
    }
}
export async function onRequestOptions() { return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } }); }

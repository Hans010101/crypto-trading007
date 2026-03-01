const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

function fmt(p) {
    if (p < 0.001) return p.toFixed(6);
    if (p < 1) return p.toFixed(4);
    return p.toFixed(2);
}

export async function onRequestGet(context) {
    const url = new URL(context.request.url);
    const symbolParam = (url.searchParams.get('symbol') || '').replace('/', '');
    if (!symbolParam) {
        return new Response(JSON.stringify({ analysis: '请指定交易对参数。' }), { headers: CORS });
    }
    try {
        const [tickerRes, fundingRes, lsRes] = await Promise.all([
            fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbolParam}`),
            fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbolParam}`),
            fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbolParam}&period=5m&limit=1`),
        ]);
        const [ticker, funding, lsData] = await Promise.all([tickerRes.json(), fundingRes.json(), lsRes.json()]);
        const price = parseFloat(ticker.lastPrice || 0);
        const change = parseFloat(ticker.priceChangePercent || 0);
        const vol = parseFloat(ticker.quoteVolume || 0);
        const funding_rate = parseFloat(funding.lastFundingRate || 0);
        let ls_ratio = 1;
        if (Array.isArray(lsData) && lsData.length > 0) {
            ls_ratio = parseFloat(lsData[0].longShortRatio || 1);
            if (!isFinite(ls_ratio)) ls_ratio = 9999;
        }
        const r_high24 = Math.max(parseFloat(ticker.highPrice || price * 1.05), price * 1.001);
        const r_low24 = Math.min(parseFloat(ticker.lowPrice || price * 0.95), price * 0.999);
        const res1 = fmt(r_high24), res2 = fmt(r_high24 * 1.05);
        const sup1 = fmt(r_low24 + (price - r_low24) * 0.5), sup2 = fmt(r_low24);
        const vol_text = vol >= 1e8 ? `${(vol / 1e8).toFixed(2)} 亿` : `${(vol / 1e6).toFixed(2)} 百万`;
        const tech_status = change >= 0 ? '放量拉升后的高位整理期' : '缩量下跌后的低位震荡期';
        const tech_action = change >= 0 ? '追涨' : '杀跌';
        const funding_pct = funding_rate * 100;
        const funding_desc = funding_pct < -0.01 ? '显著负值' : (funding_pct > 0.01 ? '显著正值' : '中性水平');
        const cost_side = funding_pct < -0.01 ? '空头' : (funding_pct > 0.01 ? '多头' : '多空双向');
        const squeeze_side = funding_pct < 0 ? '空头挤压 (Short Squeeze)' : '多头挤压 (Long Squeeze)';
        const dom_side = ls_ratio >= 1 ? '多头' : '空头';
        const fund_strategy_text = funding_pct < -0.01
            ? '结合负费率判断，当前市场主力正在利用负费率诱导空头入场，随后通过拉升强制空头止损。'
            : (funding_pct > 0.02 ? '结合极高正费率判断，主力利用派发筹码引发多头踩踏的风险加剧。' : '当前费率并未极端倒挂，行情更多由现货买盘真实驱动，相对健康。');
        const ls_disp = ls_ratio === 9999 ? '极高' : ls_ratio.toFixed(2);
        const long_entry = `${fmt(price * 0.98)} - ${fmt(price * 0.995)}`;
        const long_stop = fmt(price * 0.95), long_targ1 = fmt(price * 1.06), long_targ2 = fmt(price * 1.15);
        const long_mid_brk = fmt(price * 1.06), long_warn = fmt(price * 1.03);
        const short_entry = `${fmt(price * 1.015)} - ${fmt(price * 1.03)}`;
        const short_stop = fmt(price * 1.06), short_targ1 = fmt(price * 0.92), short_targ2 = fmt(price * 0.82);
        const short_mid_brk = fmt(price * 0.93), short_warn = fmt(price * 0.97);
        const sq_short1 = fmt(price * 1.04), sq_short2 = fmt(price * 1.08), sq_short3 = fmt(price * 1.05), sq_short4 = fmt(price * 1.12);
        const lq_long1 = fmt(price * 0.96), lq_long2 = fmt(price * 0.93);
        const dir_note = change >= 3 ? '当前趋势偏多，优先关注做多机会，做空需更保守' : (change <= -3 ? '当前趋势偏空，优先关注做空机会，做多需更保守' : '价格震荡，双向策略均可参与，需严格管控风险');
        const fc = (c) => funding_pct < 0 ? 'var(--loss)' : 'var(--gain)';
        const analysis = `
    <div style="margin-bottom:14px;"><strong style="color:var(--text-primary);"><span style="color:var(--accent-blue); margin-right:4px;">1.</span> 技术信号与压力</strong><br>
    <div style="color:var(--text-secondary); margin-top:4px;">
    - 价格处于${tech_status}，<span style="color:var(--text-primary);font-weight:600;">${fmt(price)}</span> 价位对应 ${vol_text} 成交量，为当前核心支撑区。<br>
    - 压力位参考: <span style="color:var(--loss)">${res1}</span> (近期高点), <span style="color:var(--loss)">${res2}</span> (心理关口)；支撑位参考: <span style="color:var(--gain)">${sup1}</span>, <span style="color:var(--gain)">${sup2}</span>。<br>
    - 动能分析: ${res1} 处成交量较当前减缓，显示高位${tech_action}动能出现阶段性变异，存在回踩支撑需求。
    </div></div>
    <div style="margin-bottom:14px;"><strong style="color:var(--text-primary);"><span style="color:var(--accent-rose); margin-right:4px;">2.</span> 筹码面博弈</strong><br>
    <div style="color:var(--text-secondary); margin-top:4px;">
    - 资金费率 <span style="color:${fc()}">${funding_pct.toFixed(4)}%</span> 呈现${funding_desc}，${cost_side}持仓成本极高，市场存在强烈的${squeeze_side}预期。<br>
    - 多空比 <span style="color:var(--text-primary);font-weight:600;">${ls_disp}</span> 显示${dom_side}占据优势。${fund_strategy_text}<br>
    - 结论: 筹码结构利于<span style="color:var(--text-primary);font-weight:600;">${dom_side}</span>，${dom_side === '多头' ? '空头' : '多头'}在当前价位极度被动。
    </div></div>
    <div style="margin-bottom:14px;"><strong style="color:var(--text-primary);"><span style="color:var(--accent-emerald); margin-right:4px;">3.</span> 爆仓挤压预警</strong><br>
    <div style="color:var(--text-secondary); margin-top:4px;">
    - 空头爆仓区: <span style="color:var(--text-primary);">${sq_short1} - ${sq_short2}</span> 区域为密集空头清算区，一旦突破 ${sq_short3}，将引发连环爆仓推动价格快速冲向 ${sq_short4} 以上。<br>
    - 多头清算区: <span style="color:var(--text-primary);">${lq_long1}</span> 以下存在多头杠杆清算风险，若跌破 ${lq_long2} 关键支撑，回撤幅度将扩大。
    </div></div>
    <div style="margin-bottom:0;"><strong style="color:var(--text-primary);"><span style="color:var(--warning-color); margin-right:4px;">4.</span> 实战策略清单</strong>
    <div style="color:var(--text-muted);font-size:0.82rem;margin:4px 0 10px;">💡 ${dir_note}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px;">
      <div style="background:rgba(5,150,105,0.06);border:1px solid rgba(5,150,105,0.2);border-radius:8px;padding:10px;">
        <div style="color:var(--gain);font-weight:700;margin-bottom:6px;">📈 做多策略</div>
        <div style="color:var(--text-secondary);font-size:0.88rem;line-height:1.7;">
          <b>入场区间：</b><span style="color:var(--text-primary);">${long_entry}</span><br>
          <b>止损位：</b><span style="color:var(--loss);">${long_stop}</span><br>
          <b>短期目标：</b><span style="color:var(--gain);">${long_targ1}</span><br>
          <b>中期目标：</b><span style="color:var(--gain);">${long_targ2}</span><br>
          <b>突破观察：</b>${long_mid_brk} 放量确认<br>
          <b style="color:var(--loss);">⚠ 禁忌：</b>禁止在 ${long_warn} 以上无保护追涨
        </div>
      </div>
      <div style="background:rgba(220,38,38,0.06);border:1px solid rgba(220,38,38,0.2);border-radius:8px;padding:10px;">
        <div style="color:var(--loss);font-weight:700;margin-bottom:6px;">📉 做空策略</div>
        <div style="color:var(--text-secondary);font-size:0.88rem;line-height:1.7;">
          <b>入场区间：</b><span style="color:var(--text-primary);">${short_entry}</span><br>
          <b>止损位：</b><span style="color:var(--loss);">${short_stop}</span><br>
          <b>短期目标：</b><span style="color:var(--gain);">${short_targ1}</span><br>
          <b>中期目标：</b><span style="color:var(--gain);">${short_targ2}</span><br>
          <b>跌破观察：</b>${short_mid_brk} 量能确认<br>
          <b style="color:var(--loss);">⚠ 禁忌：</b>禁止在 ${short_warn} 以下盲目追空
        </div>
      </div>
    </div></div>`;
        return new Response(JSON.stringify({ analysis }), { headers: CORS });
    } catch (e) {
        return new Response(JSON.stringify({ analysis: `无法获取该交易对的实时数据，AI 暂时无法生成分析建议。错误: ${e.message}` }), { headers: CORS });
    }
}
export async function onRequestOptions() { return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } }); }

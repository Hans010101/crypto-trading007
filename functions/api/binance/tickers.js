const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
// VERSION: 2.3 - No L/S here (delegated to /api/binance/ls), OI for top 45
// Subrequest budget: 3 core + 45 OI = 48 (within free plan limit of 50)

export async function onRequestGet() {
  try {
    // 3 subrequests
    const [tickerRes, fundingRes, infoRes] = await Promise.all([
      fetch('https://fapi.binance.com/fapi/v1/ticker/24hr'),
      fetch('https://fapi.binance.com/fapi/v1/premiumIndex'),
      fetch('https://fapi.binance.com/fapi/v1/fundingInfo'),
    ]);
    const [tickerData, fundingData, infoData] = await Promise.all([
      tickerRes.json(), fundingRes.json(), infoRes.json(),
    ]);

    const fundingMap = {};
    if (Array.isArray(fundingData)) fundingData.forEach(i => { if (i.symbol) fundingMap[i.symbol] = i; });
    const intervalMap = {};
    if (Array.isArray(infoData)) infoData.forEach(i => { if (i.symbol) intervalMap[i.symbol] = i.fundingIntervalHours || 8; });

    const usdtPairs = [], otherPairs = [];
    if (Array.isArray(tickerData)) {
      for (const t of tickerData) {
        const sym = t.symbol || '';
        if (!sym.endsWith('USDT') || parseFloat(t.quoteVolume || 0) <= 1_000_000) continue;
        const fInfo = fundingMap[sym] || {};
        if (!fInfo.nextFundingTime || fInfo.nextFundingTime <= 0) continue;
        const fr = parseFloat(fInfo.lastFundingRate || 0);
        (fr === 0 ? otherPairs : usdtPairs).push(t);
      }
    }
    usdtPairs.sort((a, b) => parseFloat(b.priceChangePercent || 0) - parseFloat(a.priceChangePercent || 0));
    otherPairs.sort((a, b) => parseFloat(b.priceChangePercent || 0) - parseFloat(a.priceChangePercent || 0));

    const mainSymbols = usdtPairs.map(t => t.symbol);

    // OI for top 45 symbols (45 subrequests, total: 3+45=48, within 50)
    const OI_LIMIT = 45;
    const oiSymbols = mainSymbols.slice(0, OI_LIMIT);
    const oiResponses = await Promise.all(
      oiSymbols.map(sym =>
        fetch(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${sym}&period=1h&limit=25`)
          .catch(() => null)
      )
    );
    const oiResults = {};
    for (let i = 0; i < oiSymbols.length; i++) {
      try {
        const data = oiResponses[i] ? await oiResponses[i].json() : null;
        if (Array.isArray(data) && data.length >= 2) {
          const sym = oiSymbols[i];
          const oiNow = parseFloat(data[data.length - 1].sumOpenInterest || 0);
          const oi24h = parseFloat(data[0].sumOpenInterest || 0);
          const oiValUsd = parseFloat(data[data.length - 1].sumOpenInterestValue || 0);
          oiResults[sym] = {
            change: oi24h > 0 ? (oiNow - oi24h) / oi24h * 100 : 0,
            value: oiValUsd,
          };
        }
      } catch { }
    }

    const totalVolume = [...usdtPairs, ...otherPairs].reduce((s, t) => s + parseFloat(t.quoteVolume || 0), 0);

    const mapResult = (items) => items.map((t, i) => {
      const sym = t.symbol || '';
      const fInfo = fundingMap[sym] || {};
      const oi = oiResults[sym] || { change: 0, value: 0 };
      return {
        rank: i + 1,
        symbol: sym.replace('USDT', '/USDT'),
        price: parseFloat(t.lastPrice || 0),
        change24h: parseFloat(t.priceChangePercent || 0),
        high24h: parseFloat(t.highPrice || 0),
        low24h: parseFloat(t.lowPrice || 0),
        volume24h: parseFloat(t.quoteVolume || 0),
        trades: parseInt(t.count || 0),
        fundingRate: parseFloat(fInfo.lastFundingRate || 0),
        nextFundingTime: parseInt(fInfo.nextFundingTime || 0),
        fundingInterval: intervalMap[sym] || 8,
        lsRatio: { ratio: 0, long: 0, short: 0 }, // populated by /api/binance/ls on the frontend
        oiChange24h: oi.change,
        oiValue: oi.value,
      };
    });

    return new Response(JSON.stringify({
      exchange: 'Binance',
      data: mapResult(usdtPairs),
      other: mapResult(otherPairs),
      total_volume: totalVolume,
      volume_change: 0,
      ts: Date.now(),
      _v: '2.3',
    }), { headers: CORS });

  } catch (e) {
    return new Response(
      JSON.stringify({ exchange: 'Binance', data: [], other: [], error: String(e), _v: '2.3-err' }),
      { headers: CORS, status: 500 }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } });
}

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
// VERSION: 3.0 - Pure ticker data only (3 subrequests)
// L/S data loaded separately via /api/binance/ls
// OI data loaded separately via /api/binance/oi

export async function onRequestGet() {
  try {
    // Only 3 subrequests - maximally reliable
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

    const totalVolume = [...usdtPairs, ...otherPairs].reduce((s, t) => s + parseFloat(t.quoteVolume || 0), 0);

    const mapResult = (items) => items.map((t, i) => {
      const sym = t.symbol || '';
      const fInfo = fundingMap[sym] || {};
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
        lsRatio: { ratio: 0, long: 0, short: 0 }, // filled by /api/binance/ls
        oiChange24h: 0,                             // filled by /api/binance/oi
        oiValue: 0,
      };
    });

    return new Response(JSON.stringify({
      exchange: 'Binance',
      data: mapResult(usdtPairs),
      other: mapResult(otherPairs),
      total_volume: totalVolume,
      volume_change: 0,
      ts: Date.now(),
      _v: '3.0',
    }), { headers: CORS });

  } catch (e) {
    return new Response(
      JSON.stringify({ exchange: 'Binance', data: [], other: [], error: String(e), _v: '3.0-err' }),
      { headers: CORS, status: 500 }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } });
}

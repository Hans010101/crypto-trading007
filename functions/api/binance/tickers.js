const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
// VERSION: 2.1 - strict 46-subrequest budget for Cloudflare Free plan

export async function onRequestGet() {
  try {
    // === 4 subrequests: initial data ===
    const [tickerRes, fundingRes, infoRes, btcKlinesRes] = await Promise.all([
      fetch('https://fapi.binance.com/fapi/v1/ticker/24hr'),
      fetch('https://fapi.binance.com/fapi/v1/premiumIndex'),
      fetch('https://fapi.binance.com/fapi/v1/fundingInfo'),
      fetch('https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1d&limit=2'),
    ]);
    const [tickerData, fundingData, infoData, btcKlines] = await Promise.all([
      tickerRes.json(), fundingRes.json(), infoRes.json(), btcKlinesRes.json(),
    ]);

    let volChange = 0;
    if (Array.isArray(btcKlines) && btcKlines.length >= 2) {
      const yVol = parseFloat(btcKlines[0][7]);
      const tVol = parseFloat(btcKlines[1][7]);
      if (yVol > 0) volChange = (tVol - yVol) / yVol * 100;
    }

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

    // === Strict subrequest budget: 46 total (50 limit - 4 initial) ===
    // L/S: 30 symbols concurrent = 30 subrequests
    // OI:  16 symbols concurrent = 16 subrequests
    // Total: 4 + 30 + 16 = 50  (exactly at limit with some buffer)
    const LS_LIMIT = 30;
    const OI_LIMIT = 16;

    const mainSymbols = usdtPairs.map(t => t.symbol);
    const lsSymbols = mainSymbols.slice(0, LS_LIMIT);
    const oiSymbols = mainSymbols.slice(0, OI_LIMIT);

    // Fire L/S and OI concurrently (all in one Promise.all to stay within wall-clock limit)
    const lsResults = {};
    const oiResults = {};

    await Promise.all([
      // L/S ratio fetches (30 concurrent)
      ...lsSymbols.map(sym =>
        fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${sym}&period=5m&limit=1`)
          .then(r => r.json())
          .then(data => {
            if (Array.isArray(data) && data.length > 0) {
              let ratio = parseFloat(data[0].longShortRatio || 0);
              if (!isFinite(ratio)) ratio = 9999;
              lsResults[sym] = {
                ratio,
                long: parseFloat(data[0].longAccount || 0) * 100,
                short: parseFloat(data[0].shortAccount || 0) * 100,
              };
            }
          })
          .catch(() => { })
      ),
      // OI 24h change fetches (16 concurrent)
      ...oiSymbols.map(sym =>
        fetch(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${sym}&period=1h&limit=25`)
          .then(r => r.json())
          .then(data => {
            if (Array.isArray(data) && data.length >= 2) {
              const oiNow = parseFloat(data[data.length - 1].sumOpenInterest || 0);
              const oi24h = parseFloat(data[0].sumOpenInterest || 0);
              const oiValUsd = parseFloat(data[data.length - 1].sumOpenInterestValue || 0);
              oiResults[sym] = {
                change: oi24h > 0 ? (oiNow - oi24h) / oi24h * 100 : 0,
                value: oiValUsd,
              };
            }
          })
          .catch(() => { })
      ),
    ]);

    const totalVolume = [...usdtPairs, ...otherPairs].reduce((s, t) => s + parseFloat(t.quoteVolume || 0), 0);

    const mapResult = (items) => items.map((t, i) => {
      const sym = t.symbol || '';
      const fInfo = fundingMap[sym] || {};
      const ls = lsResults[sym] || { ratio: 0, long: 0, short: 0 };
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
        lsRatio: ls,
        oiChange24h: oi.change,
        oiValue: oi.value,
      };
    });

    return new Response(JSON.stringify({
      exchange: 'Binance',
      data: mapResult(usdtPairs),
      other: mapResult(otherPairs),
      total_volume: totalVolume,
      volume_change: volChange,
      ts: Date.now(),
      _v: '2.1',
    }), { headers: CORS });

  } catch (e) {
    return new Response(
      JSON.stringify({ exchange: 'Binance', data: [], other: [], error: e.message, _v: '2.1' }),
      { headers: CORS, status: 500 }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } });
}

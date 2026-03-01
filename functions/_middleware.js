// Cloudflare Pages Middleware: Add CDN caching to all API responses
// This ensures API data is cached at edge nodes closest to China (HK/Japan/Singapore)
// so browsers in mainland China get data from CDN cache, not from Workers directly

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    // Only apply caching to API routes
    if (!url.pathname.startsWith('/api/')) {
        return await context.next();
    }

    // For OPTIONS and POST requests, pass through (no caching)
    if (request.method !== 'GET') {
        return await context.next();
    }

    try {
        // Execute the actual API function
        const response = await context.next();

        // Clone the response to modify headers
        const body = await response.text();

        // Determine cache duration based on endpoint
        let cacheDuration = 30; // default 30 seconds

        if (url.pathname.includes('/market/fng')) {
            cacheDuration = 300; // Fear & Greed index: 5 min cache
        } else if (url.pathname.includes('/system/info')) {
            cacheDuration = 3600; // System info: 1 hour cache
        } else if (url.pathname.includes('/wash/') || url.pathname.includes('/arbitrage/') ||
            url.pathname.includes('/alerts/') || url.pathname.includes('/scanner/')) {
            cacheDuration = 600; // Mock data: 10 min cache
        } else if (url.pathname.includes('/grid/')) {
            cacheDuration = 120; // Grid backtest: 2 min cache
        } else if (url.pathname.includes('/binance/')) {
            cacheDuration = 15; // Binance data: 15 second cache
        }

        // Return response with CDN cache headers
        return new Response(body, {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                // CDN Cache: cache at Cloudflare edge for cacheDuration seconds
                'Cache-Control': `public, s-maxage=${cacheDuration}, max-age=${Math.floor(cacheDuration / 2)}`,
                // CDN Tag for cache purging if needed
                'CDN-Cache-Control': `max-age=${cacheDuration}`,
                // Cloudflare-specific: cache even for dynamic responses  
                'Cloudflare-CDN-Cache-Control': `max-age=${cacheDuration}`,
            },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache',
            },
        });
    }
}

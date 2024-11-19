import { NextRequest, NextResponse } from 'next/server';

type SiteMap = {
  [key: string]: string;
};

const sites: SiteMap = {
  'icpswap': 'https://icpswap.com', 
  'kongswap': 'https://kongswap.io',
};

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    console.log('Incoming request URL:', url.toString());
    
    const pathname = url.pathname;
    const site = pathname.split('/proxy/')[1]?.split('?')[0];
    console.log('Requested site:', site);

    if (!site || !(site in sites)) {
      console.log('Site not found in mapping:', site);
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const target = sites[site];
    console.log('Attempting to proxy to:', target);

    const response = await fetch(target, {
      headers: {
        'User-Agent': request.headers.get('user-agent') || '',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': target,
        'Origin': target,
      },
    });

    if (!response.ok) {
      console.log('Target response not OK:', response.status, response.statusText);
      return NextResponse.json({ 
        error: 'Target site returned error',
        status: response.status,
        statusText: response.statusText
      }, { status: response.status });
    }

    const data = await response.text();
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors *; connect-src *",
        'X-Frame-Options': 'ALLOWALL',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
        'Cross-Origin-Opener-Policy': 'unsafe-none',
        'Cross-Origin-Resource-Policy': 'cross-origin'
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
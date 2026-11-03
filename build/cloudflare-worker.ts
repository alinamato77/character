import handler from 'vinext/server/fetch-handler';

// GitHub Pages sends only its anonymous chat token. Inbox cookies remain
// first-party on the owner's Worker and are never shared cross-origin.
export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const crossOrigin = !!origin && origin !== url.origin;
    const chat = ['/api/chat/session', '/api/chat/answers'].includes(url.pathname);
    if (crossOrigin) {
      if (!chat || origin !== env.FRONTEND_ORIGIN) return new Response('Forbidden', {status:403});
      const cors = {
        'Access-Control-Allow-Origin': origin!,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Bimba-CSRF',
        'Vary': 'Origin', 'Cache-Control': 'private, no-store',
      };
      if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:cors});
      const token = request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9-]{36})$/i)?.[1];
      if (url.pathname.endsWith('/answers') && !token) return new Response('Unauthorized', {status:401,headers:cors});
      const headers = new Headers(request.headers);
      headers.delete('cookie');
      headers.delete('authorization');
      headers.delete('sec-fetch-site');
      headers.set('origin',url.origin);
      if (token) headers.set('cookie',`__Host-bimba-visitor=${token}`);
      const internal = new Request(request,{headers});
      const response = await handler.fetch(internal,env,ctx);
      const outputHeaders = new Headers(response.headers);
      Object.entries(cors).forEach(([key,value]) => outputHeaders.set(key,value));
      const newToken = outputHeaders.get('set-cookie')?.match(/__Host-bimba-visitor=([a-f0-9-]{36})/)?.[1];
      outputHeaders.delete('set-cookie');
      if (url.pathname.endsWith('/session') && response.ok) {
        const body = await response.json() as Record<string, unknown>;
        return Response.json({...body,token:newToken || token},{status:response.status,headers:outputHeaders});
      }
      return new Response(response.body,{status:response.status,headers:outputHeaders});
    }
    const response = await handler.fetch(request,env,ctx);
    if (url.pathname.startsWith('/inbox')) {
      const safe = new Response(response.body,response);
      safe.headers.set('Cache-Control','private, no-store');
      safe.headers.set('X-Robots-Tag','noindex, nofollow');
      return safe;
    }
    return response;
  },
};

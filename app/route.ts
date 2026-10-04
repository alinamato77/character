import page from '../public/companion.html?raw';
export function GET() {
  return new Response(page, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
}

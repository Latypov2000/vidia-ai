const API_BASE = 'https://vidia-ai-api-vz0j.onrender.com';

export const runtime = 'nodejs';
export const maxDuration = 3600;

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type');
    const upstream = await fetch(`${API_BASE}/api/edit`, {
      method: 'POST',
      headers: contentType ? { 'content-type': contentType } : {},
      body: request.body,
      // Node's fetch requires duplex for a streamed request body.
      duplex: 'half',
      cache: 'no-store',
    } as RequestInit & { duplex: 'half' });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Vidia API proxy failed:', error);
    return Response.json(
      { detail: 'Не удалось связаться с сервером обработки. Попробуйте ещё раз.' },
      { status: 502 },
    );
  }
}

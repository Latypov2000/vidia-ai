const API_BASE = 'https://vidia-ai-api-vz0j.onrender.com';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ job_id: string }> },
) {
  const { job_id } = await context.params;
  if (!/^[a-f0-9]{32}$/.test(job_id)) {
    return Response.json({ detail: 'Файл не найден' }, { status: 404 });
  }

  try {
    const upstream = await fetch(`${API_BASE}/api/download/${job_id}`, {
      cache: 'no-store',
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/octet-stream',
        'content-disposition': upstream.headers.get('content-disposition') || 'attachment; filename="vidia-ai-edited.mp4"',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Vidia download proxy failed:', error);
    return Response.json({ detail: 'Не удалось скачать готовое видео.' }, { status: 502 });
  }
}

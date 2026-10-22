import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  const { clientContext } = context;
  const user = clientContext && clientContext.user;
  if (!user) return new Response('Unauthorized', { status: 401 });

  try {
    const payload = await req.json();
    const store = getStore({ name: 'lyric-vault', consistency: 'strong' });
    await store.setJSON(user.sub, payload);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

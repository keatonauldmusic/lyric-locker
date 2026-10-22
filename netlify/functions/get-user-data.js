import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  const { clientContext } = context;
  const user = clientContext && clientContext.user;
  if (!user) return new Response('Unauthorized', { status: 401 });

  try {
    const store = getStore({ name: 'lyric-vault', consistency: 'strong' });
    const data = await store.get(user.sub, { type: 'json' });
    return new Response(JSON.stringify(data || { projects: [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
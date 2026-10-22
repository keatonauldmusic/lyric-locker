import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  // Verify user is logged in via the token passed from frontend
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });
  
  // Extract user context provided securely by Netlify Gateway
  const { clientContext } = context;
  const user = clientContext && clientContext.user;
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { title, lyrics } = await req.json();

  // Use Netlify Blobs (built-in free key-value storage) keyed by User ID
  const store = getStore('user-lyrics');
  await store.setJSON(user.sub, { title, lyrics });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
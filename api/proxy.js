
export default async function handler(request, response) {
  const { url } = request.query;

  if (!url) {
    return response.status(400).json({ error: 'Missing "url" query parameter' });
  }

  try {
    // Determine user agent
    const userAgent = request.headers['user-agent'] || 'Mozilla/5.0 (compatible; FeilianOpsTool/1.0)';
    
    const fetchOptions = {
      method: request.method, // Forward GET, PUT, POST, etc.
      headers: {
        'User-Agent': userAgent,
      },
    };

    // If payload exists (PUT/POST), forward the body
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      // In Vercel Serverless (Node), `request` is a stream.
      // Native fetch in Node 18+ allows passing the stream directly as body.
      fetchOptions.body = request;
      fetchOptions.duplex = 'half'; // Required for streaming bodies in Node fetch
    }

    const fetchResponse = await fetch(url, fetchOptions);

    if (!fetchResponse.ok) {
      // Return the upstream error text for debugging
      const errorText = await fetchResponse.text();
      return response.status(fetchResponse.status).send(errorText || `Failed to fetch: ${fetchResponse.statusText}`);
    }

    const text = await fetchResponse.text();
    
    // Set caching headers only for GET requests
    if (request.method === 'GET') {
      response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    }
    
    response.status(200).send(text);
  } catch (error) {
    console.error("Proxy function error:", error);
    response.status(500).json({ error: error.message });
  }
}
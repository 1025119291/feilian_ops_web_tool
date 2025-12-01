
export default async function handler(request, response) {
  const { url } = request.query;

  if (!url) {
    return response.status(400).json({ error: 'Missing "url" query parameter' });
  }

  try {
    // Determine user agent to pass through or set a default
    const userAgent = request.headers['user-agent'] || 'Mozilla/5.0 (compatible; FeilianOpsTool/1.0)';

    const fetchResponse = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
      },
    });

    if (!fetchResponse.ok) {
      return response.status(fetchResponse.status).send(`Failed to fetch: ${fetchResponse.statusText}`);
    }

    const text = await fetchResponse.text();
    
    // Set caching headers to reduce load
    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    response.status(200).send(text);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
}

export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const { model, path } = req.query;
  const hfToken = process.env.VITE_HF_TOKEN || "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";
  
  if (!model && !path) {
    return res.status(400).json({ error: 'Missing model or path in query' });
  }

  const endpoint = path 
    ? `https://router.huggingface.co/hf-inference/${path}`
    : `https://router.huggingface.co/hf-inference/models/${model}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const contentType = response.headers.get('content-type');
    if (response.ok && contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).json({ error: 'HF error', details: text });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}


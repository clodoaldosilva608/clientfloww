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

  const { model } = req.query;
  const hfToken = process.env.VITE_HF_TOKEN || "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";
  
  if (!model) {
    return res.status(400).json({ error: 'Missing model in query' });
  }

  const hfUrl = `https://router.huggingface.co/models/${model}`;
  
  try {
    const response = await fetch(hfUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('[AI Proxy Error]:', error.message);
    return res.status(500).json({ error: 'Failed to fetch from Hugging Face', details: error.message });
  }
}

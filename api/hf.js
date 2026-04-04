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

  // Lista de URLs para tentar em ordem de prioridade
  const urlsToTry = [
    `https://router.huggingface.co/models/${model}`,
    `https://router.huggingface.co/${model}`,
    `https://api-inference.huggingface.co/models/${model}`
  ];

  let lastError = null;

  for (const hfUrl of urlsToTry) {
    try {
      console.log(`[AI Proxy] Trying URL: ${hfUrl}`);
      const response = await fetch(hfUrl, {
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
        console.warn(`[AI Proxy] URL ${hfUrl} failed with status ${response.status}: ${text.substring(0, 100)}`);
        lastError = { status: response.status, message: text };
      }
    } catch (error) {
      console.error(`[AI Proxy] Fatal error on ${hfUrl}:`, error.message);
      lastError = { status: 500, message: error.message };
    }
  }

  return res.status(lastError.status).json({ 
    error: 'Failed to fetch from Hugging Face after multiple attempts', 
    details: lastError.message 
  });
}

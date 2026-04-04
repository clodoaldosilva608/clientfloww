const fetch = require('node-fetch');
async function test() {
  const model = "facebook/bart-large-mnli";
  const hfToken = "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";
  const res = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
    method: "POST",
    headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: "Eu adoro criar campanhas", parameters: { candidate_labels: ["marketing", "financeiro"] } })
  });
  console.log(await res.text());
}
test();

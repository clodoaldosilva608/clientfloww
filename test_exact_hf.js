const fetch = require('node-fetch');
async function test() {
  const payload = {
    model: "mistralai/Mistral-7B-Instruct-v0.2",
    messages: [{ role: "user", content: "olá" }],
    max_tokens: 500,
    temperature: 0.7,
  };
  const res = await fetch("https://router.huggingface.co/hf-inference/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer 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", "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
}
test();

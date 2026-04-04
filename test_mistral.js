const model = "mistralai/Mistral-7B-Instruct-v0.2";
const urlsToTry = [
  `https://router.huggingface.co/hf-inference/models/${model}`,
  `https://router.huggingface.co/models/${model}`,
  `https://router.huggingface.co/hf-inference/v1/chat/completions`,
  `https://api-inference.huggingface.co/models/${model}`
];
const hfToken = "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"; 

async function test() {
  for (const hfUrl of urlsToTry) {
    try {
      console.log(`\nurl: ${hfUrl}`);
      let body;
      if (hfUrl.includes('chat/completions')) {
        body = JSON.stringify({ model: model, messages: [{ role: "user", content: "hi" }] });
      } else {
        body = JSON.stringify({ inputs: "hi" });
      }
      const response = await fetch(hfUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: body,
      });
      const text = await response.text();
      console.log(`status: ${response.status}`);
      console.log(`text: ${text.substring(0, 200)}`);
    } catch(e) {
      console.log(`error: ${e.message}`);
    }
  }
}
test();

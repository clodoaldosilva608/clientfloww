const model = "google/flan-t5-large";
const urlsToTry = [
  `https://router.huggingface.co/${model}`,
  `https://router.huggingface.co/models/${model}`,
  `https://router.huggingface.co/hf-inference/models/${model}`,
  `https://api-inference.huggingface.co/models/${model}`
];
const hfToken = "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"; // using the one present in code

async function test() {
  for (const hfUrl of urlsToTry) {
    try {
      console.log(`\nurl: ${hfUrl}`);
      const response = await fetch(hfUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: "hi" }),
      });
      const text = await response.text();
      console.log(`status: ${response.status}`);
      console.log(`text: ${text.substring(0, 100)}`);
    } catch(e) {
      console.log(`error: ${e.message}`);
    }
  }
}
test();

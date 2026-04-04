const fetch = require('node-fetch');
async function test() {
  const res = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", {
    method: "POST"
  });
  console.log(await res.text());
}
test();

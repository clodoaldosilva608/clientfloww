const token = "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";
const model = "mistralai/Mistral-7B-Instruct-v0.2";

async function test() {
    console.log("Testing HF API directly...");
    try {
        const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: "Hello" }),
        });
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Response:", JSON.stringify(data).substring(0, 200));
    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();

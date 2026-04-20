// test-massivo.js
import https from 'https';
import fs from 'fs';
import path from 'path';

console.log('='.repeat(50));
console.log('🚀 INICIANDO TESTE MASSIVO 360° - CLIENTFLOW');
console.log('='.repeat(50));

// Carregando env config manually for the test
const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');

const envs = {};
const loadEnv = (file) => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        content.split('\n').forEach(line => {
            if (line.trim() && !line.startsWith('#') && line.includes('=')) {
                const [k, ...v] = line.split('=');
                envs[k.trim()] = v.join('=').replace(/^"|"$|^'|'$/g, '').trim();
            }
        });
        console.log(`✅ ${path.basename(file)} carregado.`);
    } else {
        console.log(`⚠️ ${path.basename(file)} não encontrado no diretório.`);
    }
}

loadEnv(envPath);
loadEnv(envLocalPath);

const { VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_HF_TOKEN } = envs;

function apiRequest(method, url, headersStr, bodyObj) {
    return new Promise((resolve, reject) => {
        const { hostname, pathname, search } = new URL(url);
        const req = https.request({
            hostname,
            path: pathname + search,
            method,
            headers: headersStr
        }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        if (bodyObj) req.write(JSON.stringify(bodyObj));
        req.end();
    });
}

async function runTests() {
    let falhas = 0;

    console.log('\n[TESTE 1] Validando Variáveis Críticas...');
    if (VITE_SUPABASE_URL && VITE_SUPABASE_PUBLISHABLE_KEY) {
        console.log('✅ Supabase Keys: APTO');
    } else {
        console.log('❌ Supabase Keys: AUSENTE');
        falhas++;
    }

    if (VITE_HF_TOKEN) {
        console.log('✅ Hugging Face Token: APTO');
    } else {
        console.log('❌ Hugging Face Token: AUSENTE');
        falhas++;
    }

    console.log('\n[TESTE 2] Conectividade com Supabase (Testando Tabela clients)...');
    try {
        const dbUrl = `${VITE_SUPABASE_URL}/rest/v1/clients?select=*&limit=1`;
        const headers = {
            'apikey': VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json'
        };
        const r = await apiRequest('GET', dbUrl, headers);
        if (r.status === 200 || r.status === 206) {
            console.log(`✅ Banco de Dados UP | Status: ${r.status}`);
        } else if (r.status === 401) {
            console.log(`❌ Banco Rejeitada: RLS (Políticas de Segurança estão barrando leitura)`);
        } else {
            console.log(`❌ Banco de Dados erro obscuro: ${r.status} ${r.data.substring(0,50)}`);
            falhas++;
        }
    } catch (e) {
        console.log(`❌ Falha TCP/HTTP Supabase: ${e.message}`);
        falhas++;
    }

    console.log('\n[TESTE 3] Saúde da Inteligência Artificial (Hugging Face API)...');
    try {
        const textToTest = "Você é um bot ClientFlow operando normalmente?";
        const hfPayload = { inputs: textToTest, parameters: { max_new_tokens: 20 } };
        const hfHeaders = {
            'Authorization': `Bearer ${VITE_HF_TOKEN}`,
            'Content-Type': 'application/json'
        };
        const hfUrl = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';
        
        const hfRes = await apiRequest('POST', hfUrl, hfHeaders, hfPayload);
        if (hfRes.status === 200) {
            console.log(`✅ IA Hugging Face UP | Resposta recebida.`);
        } else if (hfRes.status === 503) {
            console.log(`⚠️ IA Model Loading (Normalmente demora ~20s para acordar): ${hfRes.status}`);
        } else {
            console.log(`❌ Falha na IA. Status: ${hfRes.status} | Data: ${hfRes.data.substring(0, 80)}`);
            falhas++;
        }
    } catch (e) {
         console.log(`❌ Exceção na IA: ${e.message}`);
         falhas++;
    }

    console.log('\n=======================================');
    if (falhas === 0) {
        console.log('✅ DIAGNÓSTICO FINAL: 100% OPERACIONAL!');
        console.log('Sua aplicação e integrações parecem firmes como rocha.');
    } else {
        console.log(`⚠️ DIAGNÓSTICO FINAL: ${falhas} FALHA(S) ENCONTRADA(S). Risco no ambiente!`);
    }
    console.log('=======================================\n');
}

runTests();

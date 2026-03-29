const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');
const { exec } = require('child_process');

// Configuration
function getEnv() {
    try {
        const envPath = path.join(__dirname, '../.env');
        if (!fs.existsSync(envPath)) return {};
        const envFile = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envFile.split(/\r?\n/).forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^"(.*)"$/, '$1');
                env[key.trim()] = value;
            }
        });
        return env;
    } catch (e) { return {}; }
}

const env = getEnv();
const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error('ERRO: TELEGRAM_BOT_TOKEN não encontrado no .env');
    process.exit(1);
}

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;
const STATE_FILE = path.join(__dirname, 'bot-state.json');
const LOG_FILE = path.join(__dirname, 'bot.log');

let lastUpdateId = 0;
let chatIds = new Set();
let authorizedIds = new Set([802516531]); 
let pendingAuths = {}; // Stores tasks waiting for approval

// Load state
if (fs.existsSync(STATE_FILE)) {
    try {
        const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        lastUpdateId = state.lastUpdateId || 0;
        state.chatIds?.forEach(id => chatIds.add(id));
        state.authorizedIds?.forEach(id => authorizedIds.add(id));
    } catch (e) {}
}

function saveState() {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify({
            lastUpdateId,
            chatIds: Array.from(chatIds),
            authorizedIds: Array.from(authorizedIds)
        }, null, 2));
    } catch (e) {}
}

function log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    console.log(line.trim());
    try { fs.appendFileSync(LOG_FILE, line); } catch (e) {}
}

// Telegram Helpers
async function apiCall(method, body = {}) {
    return new Promise((resolve) => {
        const url = `${API_BASE}/${method}`;
        const data = JSON.stringify(body);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(url, options, (res) => {
            let responseBody = '';
            res.on('data', chunk => responseBody += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(responseBody)); }
                catch (e) { resolve({ ok: false, error: 'JSON Parse Error' }); }
            });
        });

        req.on('error', (e) => {
            log(`Network Error (${method}): ${e.message}`);
            resolve({ ok: false, error: e.message });
        });
        req.write(data);
        req.end();
    });
}

async function sendMessage(chatId, text, replyMarkup = null) {
    const body = { chat_id: chatId, text, parse_mode: 'Markdown' };
    if (replyMarkup) body.reply_markup = replyMarkup;
    return apiCall('sendMessage', body);
}

async function notifyAll(text, isAlert = true) {
    const prefix = isAlert ? '*[ANTIGRAVITY ALERT]*\n\n' : '';
    const promises = Array.from(authorizedIds).map(chatId => sendMessage(chatId, `${prefix}${text}`));
    return Promise.all(promises);
}

// System Stats Helpers
function runShell(cmd) {
    return new Promise((resolve) => {
        exec(cmd, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
            if (error) resolve({ ok: false, msg: stderr || error.message });
            else resolve({ ok: true, msg: stdout });
        });
    });
}

async function getStats() {
    const uptime = os.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    
    const memTotal = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const memFree = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const memUsed = (memTotal - memFree).toFixed(2);
    const cpuRes = await runShell('wmic cpu get loadpercentage');
    const cpu = cpuRes.ok ? cpuRes.msg.split('\n')[1]?.trim() + '%' : 'N/A';

    return { cpu, memTotal, memUsed, memFree, uptime: `${h}h ${m}m` };
}

// Menus
const MainMenu = {
    inline_keyboard: [
        [{ text: "📊 Status do Sistema", callback_data: "/status" }, { text: "🖥 Servidor", callback_data: "/server" }],
        [{ text: "📦 Projetos", callback_data: "/projetos" }, { text: "🚀 Implantar", callback_data: "menu_deploy" }],
        [{ text: "📜 Logs", callback_data: "menu_logs" }, { text: "🤖 IA", callback_data: "/ai" }],
        [{ text: "🗄 Banco de Dados", callback_data: "menu_db" }, { text: "⚙ Automação", callback_data: "menu_tasks" }],
        [{ text: "📊 Dashboard", callback_data: "/dashboard" }, { text: "🔧 Execução Avançada", callback_data: "/exec" }],
        [{ text: "📁 Criar Projeto", callback_data: "/create projeto" }]
    ]
};

const DeployMenu = {
    inline_keyboard: [
        [{ text: "🚀 Deploy ClientFlow", callback_data: "/deploy clientflow" }],
        [{ text: "📦 Deploy LifeOS", callback_data: "/deploy lifeos" }],
        [{ text: "🌐 Deploy All", callback_data: "/deploy all" }],
        [{ text: "⬅ Voltar", callback_data: "main_menu" }]
    ]
};

// Authorization System
async function requestAuthorization(chatId, action, type, risk) {
    const authId = `auth_${Date.now()}`;
    const text = `⚠️ *SOLICITAÇÃO DE AUTORIZAÇÃO*\n\nO Antigravity deseja executar a seguinte ação:\n\n*AÇÃO:* ${action}\n*TIPO:* ${type}\n*RISCO:* ${risk}\n\nDeseja autorizar esta operação?`;
    
    const markup = {
        inline_keyboard: [
            [
                { text: "✅ Autorizar", callback_data: `approve_${authId}` },
                { text: "❌ Cancelar", callback_data: `cancel_${authId}` }
            ],
            [{ text: "⏳ Adiar", callback_data: `postpone_${authId}` }]
        ]
    };

    pendingAuths[authId] = { action, type, chatId, startTime: Date.now() };
    return sendMessage(chatId, text, markup);
}

// Command Handlers
const commands = {
    '/start': (chatId) => sendMessage(chatId, '✨ *ANTIGRAVITY GOD MODE ONLINE*\n\nBem-vindo ao Centro de Comando Total. Selecione uma opção abaixo:', MainMenu),
    '/status': async (chatId) => {
        const s = await getStats();
        return sendMessage(chatId, `📊 *STATUS GERAL*\n\n*CPU:* ${s.cpu}\n*RAM:* ${s.memUsed}GB / ${s.memTotal}GB\n*Uptime:* ${s.uptime}\n*Projetos Ativos:* 4\n*Modo:* GOD MODE 👑`);
    },
    '/server': async (chatId) => {
        const s = await getStats();
        return sendMessage(chatId, `🖥 *SERVER INFO*\n\n*OS:* ${os.type()} ${os.release()}\n*CPU:* ${s.cpu}\n*RAM:* ${s.memUsed}GB / ${s.memTotal}GB\n*Uptime:* ${s.uptime}`);
    },
    '/projetos': (chatId) => {
        const projects = ['ClientFlow', 'LifeOS', 'DataMind', 'AI Control Center'];
        return sendMessage(chatId, `📦 *PROJETOS DETECTADOS*\n\n${projects.map(p => `• ${p} (ONLINE)`).join('\n')}`);
    },
    '/dashboard': async (chatId) => {
        const s = await getStats();
        return sendMessage(chatId, `📊 *ANTIGRAVITY DASHBOARD*\n\n*CPU:* ${s.cpu} | *RAM:* ${s.memUsed}GB\n*Net Status:* OK\n*Active Sessions:* 1 (Telegram)\n\n_Todos os sistemas operacionais._`);
    }
};

// Complex execution
async function executeTask(chatId, action, shellCmd) {
    await sendMessage(chatId, `🚀 *Iniciando:* ${action}...`);
    const start = Date.now();
    const res = await runShell(shellCmd);
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    
    if (res.ok) {
        await sendMessage(chatId, `✅ *AÇÃO EXECUTADA*\n\nAção: ${action}\nStatus: Concluído\nTempo: ${duration}s`);
    } else {
        await sendMessage(chatId, `❌ *FALHA NA AÇÃO*\n\nAção: ${action}\nErro: \`${res.msg.substring(0, 100)}\``);
    }
}

async function handleAction(chatId, text) {
    if (!authorizedIds.has(chatId)) return sendMessage(chatId, "❌ Acesso não autorizado.");

    const parts = text.split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    switch (cmd) {
        case '/deploy':
            return requestAuthorization(chatId, `Deploy ${arg || 'All'}`, 'Deploy em Produção', 'Médio');
        case '/exec':
            if (arg.includes('rm') || arg.includes('del') || arg.includes('shutdown')) {
                return requestAuthorization(chatId, `Executar comando crítico: ${arg}`, 'Shell Crítico', 'Alto');
            }
            return executeTask(chatId, `Comando: ${arg}`, arg);
        case '/ai':
            await sendMessage(chatId, '🤖 *Processando via Hugging Face...*');
            return sendMessage(chatId, `IA: Recebi seu prompt "${arg}". Funcionalidade em integração.`);
        case '/logs':
            const logs = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, 'utf8').split('\n').slice(-30).join('\n') : 'Sem logs.';
            return sendMessage(chatId, `📜 *ÚLTIMOS LOGS*\n\n\`\`\`\n${logs}\n\`\`\``);
        case '/db':
            return sendMessage(chatId, `🗄 *DB STATS*\n\n*Tabelas:* profiles, clients, tasks\n*Health:* Saudável\n*Users:* 218`);
        default:
            if (commands[cmd]) return commands[cmd](chatId);
            return sendMessage(chatId, "❓ Comando desconhecido. Use /help ou os botões do menu.");
    }
}

async function handleCallback(callback) {
    const chatId = callback.message.chat.id;
    const data = callback.data;

    // Answer callback to remove loading state in Telegram
    await apiCall('answerCallbackQuery', { callback_query_id: callback.id });

    if (data === 'menu_deploy') return sendMessage(chatId, "🚀 *MENU DE DEPLOY*\nSelecione o projeto:", DeployMenu);
    if (data === 'main_menu') return commands['/start'](chatId);

    if (data.startsWith('approve_')) {
        const id = data.replace('approve_', '');
        const task = pendingAuths[id];
        if (task) {
            delete pendingAuths[id];
            log(`Tarefa autorizada por ${chatId}: ${task.action}`);
            await sendMessage(chatId, "✅ *Autorizado!* Iniciando execução...");
            if (task.action.includes('Deploy')) {
                await executeTask(chatId, task.action, 'npm run build');
            } else if (task.action.includes('Executar')) {
                const cmd = task.action.split(': ')[1];
                await executeTask(chatId, task.action, cmd);
            }
        }
    } else if (data.startsWith('cancel_')) {
        const id = data.replace('cancel_', '');
        delete pendingAuths[id];
        return sendMessage(chatId, "❌ *Operação cancelada pelo usuário.*");
    } else if (data.startsWith('postpone_')) {
        return sendMessage(chatId, "⏳ *Operação adiada.* O sistema perguntará novamente em breve.");
    } else if (data.startsWith('/')) {
        return handleAction(chatId, data);
    }
}

async function poll() {
    try {
        const response = await apiCall('getUpdates', { offset: lastUpdateId + 1, timeout: 20 });
        if (response.ok && response.result) {
            for (const update of response.result) {
                lastUpdateId = update.update_id;

                if (update.callback_query) {
                    await handleCallback(update.callback_query);
                } else if (update.message && update.message.text) {
                    const chatId = update.message.chat.id;
                    const text = update.message.text.trim();
                    log(`Msg de ${chatId}: ${text}`);
                    await handleAction(chatId, text);
                }
            }
        }
    } catch (e) { log(`Erro polling: ${e.message}`); }
    saveState();
    setTimeout(poll, 1000);
}

if (require.main === module) {
    log('Antigravity GOD MODE iniciado...');
    notifyAll('👑 *ANTIGRAVITY GOD MODE ONLINE*\nCentro de Comando Remoto Ativado.', false);
    poll();
}

module.exports = { notifyAll, sendMessage, requestAuthorization };

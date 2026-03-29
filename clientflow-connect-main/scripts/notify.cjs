const { notifyAll } = require('./antigravity-bot.cjs');

const message = process.argv.slice(2).join(' ');

if (!message) {
    console.log('Uso: node scripts/notify.cjs "Sua mensagem aqui"');
    process.exit(0);
}

notifyAll(message)
    .then(() => {
        console.log('Notificação enviada com sucesso!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Erro ao enviar notificação:', err);
        process.exit(1);
    });

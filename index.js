//add dependencies
const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion, useSingleFileAuthState } = require('@adiwajshing/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const { state, saveState } = useSingleFileAuthState('./session.json');
const chalk = require('chalk')
const figlet = require("figlet");

const color = (text, color) => {
  return !color ? chalk.green(text) : chalk.keyword(color)(text);
};

//main func
async function connectToWhatsapp() {
const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`)
  console.log(
    color(
      figlet.textSync("Responder", {
        font: "Standard",
        horizontalLayout: "default",
        vertivalLayout: "default",
        whitespaceBreak: false,
      }),
      "green"
    )
  );
    //make new connection to whatsapp
  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    browser: ['Whatsapp Bot', 'Safari', '1.0.0'],
    auth: state,
    defaultQueryTimeoutMs: undefined,
  });
  //Looking for connection update
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error === Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(chalk.redBright(lastDisconnect.error + shouldReconnect));
      if (shouldReconnect) {
        connectToWhatsapp();
      }
    }
    if (connection === 'open') {
      console.log(chalk.blueBright('Koneksi Tersambung!'));
    }
  });
  sock.ev.on('creds.update', saveState);
  //Listen For New Message
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type == 'notify') {
      try {
      //get sender number and message
      const me = messages[0].key.remoteJid;
      const m = messages[0];
      const pushName = messages[0].pushName;
      const body = messages[0].message.conversation;
      const budy = body.toLowerCase();
      const isGroup = me.includes("@g.us");
        
      // Check if the message is a text message
      if (messages[0].message?.conversation) {
        const incomingMessages = messages[0].message.conversation;

        // Display sender data in terminal
        console.log(chalk.green('[ PESAN MASUK! ]\nNomor' + me + '\nPesan: ' + incomingMessages));
      } else if (messages[0].message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation) {
        // If the message is a reply to another message
        const incomingMessages = messages[0].message.extendedTextMessage.contextInfo.quotedMessage.conversation;

        // Display sender data in terminal
        console.log(chalk.green('[ PESAN MASUK! ]\nNomor' + me + '\nPesan: (Reply)'));
      } else if (messages[0].message?.stickerMessage) {
        // If the message is a sticker
        const stickerMessage = messages[0].message.stickerMessage;

        // Display sender data in terminal
        console.log('[ PESAN MASUK! ]\nNomor' + me + '\nPesan: (Sticker)');
      } else if (messages[0].message?.imageMessage) {
        // If the message is an image
        const imageMessage = messages[0].message.imageMessage;

        // Display sender data in terminal
        console.log('[ PESAN MASUK! ]\nNomor' + me + '\nPesan: (Image)');
      } else if (messages[0].message?.audioMessage) {
        // If the message is an audio
        const audioMessage = messages[0].message.audioMessage;

        // Display sender data in terminal
        console.log('[ PESAN MASUK! ]\nNomor' + me + '\nPesan: (Audio)');
      } else if (messages[0].message?.videoMessage) {
        // If the message is an video
        const videoMessage = messages[0].message.videoMessage;
        // Display sender data in terminal
        console.log('[ PESAN MASUK! ]\nNomor' + me + '\nPesan: (Video)');
        } else {
        console.log('Tipe pesan tidak didukung:', messages[0].message);
       return;
      }
        
        //autoreply
       
       if(!isGroup) {
         if(body.toLowerCase() === 'tes') {
         sock.sendMessage(me, { text: 'Ya' }, {quoted: m})
           }
         }

        //catch the error
      } catch (error) {
        console.log(error);
      }
    }
  });
}

//start functions
connectToWhatsapp().catch((err) => {
  console.log(err);
});

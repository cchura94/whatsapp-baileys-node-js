// import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys'
// import { Boom } from '@hapi/boom'
const {makeWASocket, DisconnectReason, useMultiFileAuthState, makeInMemoryStore, delay} = require('@whiskeysockets/baileys')

const store = makeInMemoryStore({ })
store.readFromFile('./baileys_store2.json')
// saves the state to a file every 10s
setInterval(() => {
store.writeToFile('./baileys_store2.json')
}, 10_000)

async function connectToWhatsApp () {

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys2')

    const sock = makeWASocket({
        auth: state,
        // can provide additional config here
        printQRInTerminal: true
    })
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            // reconnect if not logged out
            if(shouldReconnect) {
                connectToWhatsApp()
            }
        } else if(connection === 'open') {
            console.log('opened connection')
        }
    })
    
    sock.ev.on('messages.upsert', async m => {
        console.log(JSON.stringify(m, undefined, 2))
        if(!m.messages[0].key.fromMe){

            const mensaje = m.messages[0].message.conversation;
            const from = m.messages[0].key.remoteJid; 

            console.log('Respuesta a: ', m.messages[0].key.remoteJid)
            // await sock.sendMessage(from, { text: mensaje })
            enviarMensajeEscribiendo(mensaje, from);
        }

    })

    sock.ev.on ('creds.update', saveCreds)


    const enviarMensajeEscribiendo = async (msg, nro) => {
        await sock.presenceSubscribe(nro);
        await delay(3000);
        await sock.sendPresenceUpdate("composing", nro);
        await delay(10000);
        await sock.sendPresenceUpdate("paused", nro);

        return await sock.sendMessage(nro, { text: msg })
    }
}
// run in main file
connectToWhatsApp()

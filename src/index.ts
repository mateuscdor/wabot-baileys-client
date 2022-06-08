import * as dotenv from 'dotenv'
import * as fs from 'fs'

import { Boom } from '@hapi/boom'
import P from 'pino'
import makeWASocket, { AnyMessageContent, delay, DisconnectReason, makeInMemoryStore, useSingleFileAuthState } from '@adiwajshing/baileys'

import {
    checkOutBox,
    checkInbox,
} from './Modules/Messages'

dotenv.config();


const { state, saveState } = useSingleFileAuthState('./auth_info_multi.json')

async function startSock() {
    
    const sock = makeWASocket({
		logger: P({ level: 'error' }),
		printQRInTerminal: true,
		auth: state,
	})

	sock.ev.on('messages.upsert', async m => {        
		const msg = m.messages[0]
        console.log(JSON.stringify(m))
        
		if(!msg.key.fromMe && m.type === 'notify') {			
			checkInbox(sock, m)
			// await sock.sendMessage(msg.key.remoteJid, { text: 'Hello there!' })
		}
        
	})

	sock.ev.on('connection.update', (update) => {
		const { connection, lastDisconnect } = update
		if(connection === 'close') {
			// reconnect if not logged out
			if((lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
				startSock()
			} else {
				console.log('connection closed')
			}
		}
        
		console.log('connection update', update)
	})
	
	setTimeout(() => {
		checkOutBox(sock)
	}, 10000);


    sock.ev.on('creds.update', saveState)

    return sock
}

startSock().catch((err) => console.log(`encountered error: ${err}`))
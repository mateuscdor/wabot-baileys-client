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
	// can be written out to a file & read from it
	const store = makeInMemoryStore({})
	// can be read from a file
	store.readFromFile('./baileys_store.json')
	// saves the state to a file every 10s
	setInterval(() => {
		store.writeToFile('./baileys_store.json')
	}, 10_000)
    
	const sock = makeWASocket({
		logger: P({ level: 'error' }),
		printQRInTerminal: true,
		auth: state,
	})

	// will listen from this socket
	// the store can listen from a new socket once the current socket outlives its lifetime
	store.bind(sock.ev)

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

const axios = require('axios')

import {
    MessageType,
    MessageOptions,
    WA_MESSAGE_STUB_TYPES,
} from '@adiwajshing/baileys'



export async function checkInbox(conn, chat) {
    if(chat.imgUrl) {
        console.log('imgUrl of chat changed ', chat.imgUrl)
        return
    }
    // only do something when a new message is received
    if (!chat.hasNewMessage) {
        if(chat.messages) {
            console.log('updated message: ', chat.messages.first)
        }
        return
    } 
    
    const m = chat.messages.all()[0] // pull the new message from the update
    const messageStubType = WA_MESSAGE_STUB_TYPES[m.messageStubType] ||  'MESSAGE'
    console.log('got notification of type: ' + messageStubType)

    const messageContent = m.message
    // if it is not a regular text or media message
    if (!messageContent) return
    
    if (m.key.fromMe) {
        console.log('relayed my own message')
        return
    }

    let sender = m.key.remoteJid
    if (m.key.participant) {
        // participant exists if the message is in a group
        sender += ' (' + m.key.participant + ')'
    }
    const messageType = Object.keys (messageContent)[0] // message will always contain one key signifying what kind of message
    if (messageType !== MessageType.text) {
        return
    }

    const text = m.message.conversation
    console.log(sender + ' sent: ' + text)
    
    await conn.chatRead(m.key.remoteJid) 
    const options: MessageOptions = { quoted: m }
    let content
    let type: MessageType

    content = 'hello!' 
    type = MessageType.text
    
    const response = await conn.sendMessage(m.key.remoteJid, content, type, options)
    console.log("sent message with ID '" + response.key.id + "' successfully")

}
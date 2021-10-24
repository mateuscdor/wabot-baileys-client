const axios = require('axios')

// axios.defaults.headers.common['token'] = process.env.API_TOKEN;

import {
    MessageType,
    MessageOptions,
} from '@adiwajshing/baileys'

export async function getOutbox () {
    let messages=[];
    try {
        const options = {
            headers: {
                token: process.env.API_TOKEN
            }
        }

        messages = await axios.get(process.env.API_URL+'/message/outbox', options);
        
    } catch (error) {
        console.error(error);
    }

    return messages;
}

export async function updateStatus (id: number, status:number) {
    let messages=[];
    try {
        const options = {
            headers: {
                token: process.env.API_TOKEN
            }
        }
        messages = await axios.put(process.env.API_URL+'/message/status-update/'+id,{status},options);
    } catch (error) {
        console.error(error);
    }

    return messages;
}

export async function checkOutBox(conn) {
    let next:boolean = true;
    const messages:any = await getOutbox();    
    if (messages.data.status=='success'){
        for (let i = 0; i < messages.data.data.length; i++) {
            const el = messages.data.data[i];
            const sender = el.is_group === 1 ? el.sender : el.sender+'@s.whatsapp.net'
            if (el.is_group === 0) {
                const exists = await conn.isOnWhatsApp(el.sender)
                if (!exists) {
                    console.log (`${el.sender} not exists on WhatsApp`)
                    updateStatus(el.id,2)
                    next = false
                }else{
                    const sender = el.sender+'@s.whatsapp.net'
                }
            }

            if (next===true){
                if (el.type==='text'){
    
                    const options: MessageOptions = { }
                    const type = MessageType.text
                    const content =el.content 
    
                    const sent = await conn.sendMessage(sender, content, type, options)
                    console.log(`text message sent succesfully sent to ${sender}`)
                    updateStatus(el.id,2)
                }
                else if (el.type==='image'){
    
                    const options: MessageOptions = {
                        'caption': el.content
                    }
                    const type = MessageType.image
    
                    const content ={
                        url: el.media
                    } 
    
                    const sent = await conn.sendMessage(sender, content, type, options)
                    console.log(`image message sent succesfully to ${sender}`)
                    updateStatus(el.id,2)
                }
                else if (el.type==='document'){
    
                    const opt = JSON.parse(el.options)
                    const options: MessageOptions = opt
                    const type = MessageType.document
    
                    const content ={
                        url: el.media
                    }
    
                    const sent = await conn.sendMessage(sender, content, type, options)
                    console.log(`document message sent succesfully to ${sender}`)
                    updateStatus(el.id,2)
                }
            }
        }
    }else{
        console.log(`check outbox: no message found`);
    }

    setTimeout(() => checkOutBox(conn), 5000)
}
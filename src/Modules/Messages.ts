
const axios = require('axios')
import * as fs from 'fs'

import {
    MessageType,
    MessageOptions,
} from '@adiwajshing/baileys'

export async function getOutbox () {
    let messages=[];
    try {
        messages = await axios.get(process.env.API_URL+'/message/outbox');
    } catch (error) {
        console.error(error);
    }

    return messages;
}

export async function updateStatus (id: number, status:number) {
    let messages=[];
    try {
        messages = await axios.put(process.env.API_URL+'/message/status-update/'+id,{status});
    } catch (error) {
        console.error(error);
    }

    return messages;
}

export async function checkOutBox(conn) {
    const messages:any = await getOutbox();
    
    if (messages.data.status=='success'){

        for (let i = 0; i < messages.data.data.length; i++) {
            const el = messages.data.data[i];

            const sender =el.sender+'@s.whatsapp.net'
            

            if (el.type==='text'){

                const options: MessageOptions = { }
                const type = MessageType.text
                const content =el.content 

                const sent = await conn.sendMessage(sender, content, type, options)
                console.log(`text message succesfully sent to ${sender}`)
                updateStatus(el.id,2)
            }
            else if (el.type==='image'){
                const options: MessageOptions = {}
                const type = MessageType.image

                const content ={
                    url: el.media
                } 

                const sent = await conn.sendMessage(sender, content, type, options)
                console.log(`image message succesfully sent to ${sender}`)
                updateStatus(el.id,2)
            }

        }
    }else{
        console.log(`no message found`);
    }

    setTimeout(() => checkOutBox(conn), 5000);
}
const axios = require('axios')

import * as fs from 'fs'

// axios.defaults.headers.common['token'] = process.env.API_TOKEN;

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

export async function checkOutBox(sock) {
    let next:boolean = true;
    const messages:any = await getOutbox();    
    if (messages.data.status=='success'){
        for (let i = 0; i < messages.data.data.length; i++) {
            const el = messages.data.data[i];
            const sender = el.is_group === 1 ? el.sender : el.sender+'@s.whatsapp.net'
            if (el.is_group === 0) {
                const exists = await sock.onWhatsApp(el.sender)
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
                    const content =el.content 
    
                    const sent = await sock.sendMessage(sender, { text: content })
                    console.log(`text message sent succesfully sent to ${sender}`)
                    updateStatus(el.id,2)
                }
                else if (el.type==='image'){
                    
                    let image = await axios.get(el.media, { responseType: 'arraybuffer' });
                    let returnedB64 = Buffer.from(image.data).toString('base64');

                    const sent = await sock.sendMessage(sender, {
                        image: { url: el.media },
                        caption: el.content,
                        jpegThumbnail: returnedB64
                    })
                    console.log(`image message sent succesfully to ${sender}`)
                    updateStatus(el.id,2)
                }
                else if (el.type==='document'){
                    
                    const options = JSON.parse(el.options);                   
                    const sent = await sock.sendMessage(sender, {
                        document: { url: el.media },
                        fileName: options.filename,
                        mimetype: options.mimetype
                    })
                    console.log(`image message sent succesfully to ${sender}`)
                    updateStatus(el.id,2)
                }
            }
        }
    }else{
        console.log(`check outbox: no message found`);
    }

    setTimeout(() => checkOutBox(sock), 5000)
}
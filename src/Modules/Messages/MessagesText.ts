
const axios = require('axios')

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

export async function checkOutBox(conn, options, type) {
    const messages:any = await getOutbox();
    
    if (messages.data.status=='success'){

        for (let i = 0; i < messages.data.data.length; i++) {
            const el = messages.data.data[i];
            
            const sender =el.sender+'@s.whatsapp.net'
            const content =el.content 

            const sent = await conn.sendMessage(sender, content, type, options)
            console.log(`message succesfully sent to ${sender}`)

            if (sent){
                const update:any = await updateStatus(el.id,2)
                console.log(`table message with ID ${el.id} has update to 2 with status: `+update.data.status)                
            }
        }
    }else{
        console.log(`no message found`);
    }

    setTimeout(() => checkOutBox(conn, options, type), 5000);
}
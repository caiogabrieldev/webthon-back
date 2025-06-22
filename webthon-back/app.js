const express=require('express')
const cors=require('cors')
const OpenAI=require('openai')
const app=express()
const PORT=4090
require('dotenv').config()
app.use(express.json())
app.use(cors())

const openai=new OpenAI({
    apiKey: process.env.API_KEY
})

app.listen(PORT, ()=>{
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
})

app.post('/feedback',async (req,res)=>{

    const msgUser=JSON.stringify(req.body)
    
    console.log(msgUser);
    try {
        const completion= await openai.chat.completions.create({
            model:'gpt-4o-mini',
            messages:[
                {
                    role:'system',
                    content: 'Você é um assistente vitual de uma empresa de consciência digital. Como prompt, receberá um json de perguntas com suas respectivas respostas. Seu trabalho é fornecer um feedback criativo e direto; não apenas isso, como também apontar fatores de preocupação, fazer com que o usuário reflita sobre suas respostas por meio de perguntas e observações e não pedir que ele te pergunte algo. Acima de tudo, seja educado e sua resposta deve possuir 1 parágrafo.'
                },
                {
                    role:'user',
                    content:msgUser
                }
            ]
        }
    )
    console.log(completion.choices[0].message.content);
    return res.status(200).json({msg:completion.choices[0].message.content})
    } catch (e) {
        console.log(e);
        return res.status(500).json({e})
    }
})

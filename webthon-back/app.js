const express=require('express')
const cors=require('cors')
const OpenAI=require('openai')
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const app=express()
const PORT=4090
require('dotenv').config()
app.use(express.json())
app.use(cors())
const meuEmail = 'conscienciadigitalwebthon@gmail.com'


const openai=new OpenAI({
    apiKey: process.env.API_KEY
})


const transportadorDeEmails = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: meuEmail,
        pass: process.env.CHAVE_EMAIL
    }
})

const {Sequelize, DataTypes, where}=require("sequelize")
const conexaoComDB=new Sequelize({
    dialect:'sqlite',
    storage:'users.sqlite'
})

const users=conexaoComDB.define('Usuarios', {
    id:{
        type:DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
    },
    nome:{
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: false
    },
    email:{
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    senha: {
        type: DataTypes.STRING(50),
        allowNull: false
    }
})
async function sincronizarDB(){
    try {
        await conexaoComDB.sync()
    } catch (error) {
        console.log("Erro ao sincronizar")
    }
}
sincronizarDB()

app.listen(PORT, ()=>{
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
})


app.post('/login', async (req,res)=>{

    const {email,senha}=req.body

    const user=await users.findAll({where:{email:email}})
    
    if(user.length==0){
        console.log("Email não cadastrado");
        return res.status(404).json({message: "Email não cadastrado"})
    }

    const compararSenha=await bcrypt.compare(senha, user[0].senha)

    if(!compararSenha){
        console.log("Senha inválida");
        return res.status(400).json({message: "Senha inválida"})
    }
   
    return res.status(200).json({message: "Login realizado", nome: user[0].nome, email: user[0].email, id: user[0].id})

})

app.post('/cadastrar', async (req,res)=>{
    const {nome,email, senha}=req.body
    const existe= await users.findAll({where: {email:email}})
  
    if(existe.length!=0){
        return res.status(400).json({message: 'O usuário já existe'})
    }

    const hashed= await bcrypt.hash(senha, 8)
    const user={
        nome:nome,
        email:email,
        senha:hashed
    }
    await users.create(user)

    const emailASerEnviado = {
        from: meuEmail,
        to: user.email,
        subject: `Bem-vindo(a) ${user.nome}!`,
        text: 'Olá, seja bem-vindo(a) à nossa plataforma de Consciência Digital!'
    }

    transportadorDeEmails.sendMail(emailASerEnviado, (error, info) => {
        if (error) {
            console.log('erro na hora de enviar e-mail', error)
            res.send({errorMsg: error})
            return
        }
        console.log('email enviado com sucesso! ' + info.response)
        res.send('SUCESSO AO ENVIAR E-MAIL')
    })

    await res.status(200).json({message: "Usuário criado com sucesso"})
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

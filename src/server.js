require("dotenv").config()

const express = require("express")
const cors = require("cors")
const db = require("./config/database")
const jwt = require("jsonwebtoken")
const auth = require("./middleware/auth")

const bcrypt = require("bcrypt")

const app = express()

const PORT = 3001



app.use(express.json())

app.use(cors({
   origin: 'https://restaurante-front-lara.vercel.app',
  credentials: true
}));



app.post("/login", async (req,res) =>{

    const{email,senha} = req.body

    try {
        const [usuarios] = await db.query(
            "SELECT * FROM usuario WHERE email = ?",
            [email]
        )

        if(usuarios.length == 0){
            return res.status(401).json({
                mensagem: "Email ou senha invalidos"
            })
        }

        const usuario = usuarios[0]

        const senhaValida = await bcrypt.compare(
            senha,
            usuario.senha
        )

        if(!senhaValida){
            return res.status(401).json({
                mensagem: "Senha invalida"
            })
        }


        if(usuario.senha !== senha){
            return res.status(401).json({
                mensagem: "Email ou senha invalidos"
            })
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        )

        res.json({
            mensagem:"Login realizado",
            token
        })


    } catch (error) {
        console.log(error)
        res.status(500).json({
            mensagem: "Erro no login"
        })
    }
})

app.get("/",(req,res)=>{
    res.json({
        mensagem:"API funcionando"
    })
})


app.get("/produtos", auth, async (req,res)=>{
    try {
        const [produtos] = await db.query(
            "SELECT * from produto"
        )
        res.json(produtos)
    } catch (error) {
        console.log(error)
    }
})


app.post("/register", async(req,res)=>{
    try{
        const{nome,email,senha} = req.body

        if(!nome || !email || !senha){
            return res.status(400).json({
                mensagem:"Preencha todos os campos"
            })
        }

        const [usuarioExistente] = await db.query(
            "SELECT id FROM usuario WHERE email = ?",
            [email]
        )

        if(usuarioExistente.length > 0){
            return res.status(400).json({
                mensagem:"E-mail ja cadastrado"
            })
        }

        const senhaHash = await bcrypt.hash(senha,10)

        await db.query(
            "INSERT INTO usuario(nome, email,senha)VALUES (?,?,?)",
            [nome,email,senhaHash]
        )

        res.status(201).json({
            mensagem:"Usuario cadastrado com sucesso"
        })

    }catch (error){
        console.log(error)
        res.status(500).json({
            mensagem:"Erro interno"
        })
    }
})

app.post("/produtos", async (req, res) => {
    try {
        const { descricao, categoria, preco, imagem } = req.body;

        const sql = `
            INSERT INTO produto (descricao, categoria, preco, imagem)
            VALUES (?, ?, ?, ?)
        `;

        const [result] = await db.execute(sql, [
            descricao,
            categoria,
            preco,
            imagem
        ]);

        res.status(201).json({
            mensagem: "Produto cadastrado com sucesso",
            produto: {
                id: result.insertId,
                descricao,
                categoria,
                preco,
                imagem
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao cadastrar produto"
        });
    }
});


app.delete("/produtos/:id",async(req,res)=>{
    try {
        const {id} = req.params

        await db.query("DELETE FROM produto WHERE id = ?",[id])

        res.json({mensagem:"Produto deletado com sucesso"})

    } catch (error) {
        console.log(error)
        res.json({
            erro: "Erro ao deletar o produto"
        })
    }
})

app.listen(PORT, ()=>{
    console.log("Servidor rodando na porta 3001")
})
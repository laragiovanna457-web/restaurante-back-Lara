require("dotenv").config()
const express = require("express")
const cors = require("cors")
const db = require("./config/database")

const app = express()

// CORREÇÃO 1: Usar a porta dinâmica do Render ou 3001 para testes locais
const PORT = process.env.PORT || 3001

app.use(express.json())
app.use(cors({
    origin: 'https://restaurante-front-lara.vercel.app',
    credentials: true
}));

app.get("/", (req, res) => {
    res.json({
        mensagem: "API funcionando"
    })
});

app.get("/produtos", async (req, res) => {
    try {
        const [produtos] = await db.query(
            "SELECT * from produto"
        )
        res.json(produtos)
    } catch (error) {
        console.error("Erro ao buscar produtos:", error)
        // CORREÇÃO 2: Responder com erro 500 caso o banco falhe, evitando o travamento
        res.status(500).json({ erro: "Erro ao carregar produtos do banco de dados" })
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

app.delete("/produtos/:id", async (req, res) => {
    try {
        const { id } = req.params

        await db.query("DELETE FROM produto WHERE id = ?", [id])

        res.json({ mensagem: "Produto deletado com sucesso" })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            erro: "Erro ao deletar o produto"
        })
    }
})

// CORREÇÃO 3: Adicionar '0.0.0.0' para o Render aceitar conexões externas corretamente
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`)
})
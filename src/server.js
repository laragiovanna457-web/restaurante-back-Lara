require("dotenv").config()
const express = require("express")
const cors = require("cors")
const db = require("./config/database")

const app = express()

const PORT = process.env.PORT || 3001

app.use(express.json())
app.use(cors({
    origin: 'https://restaurante-front-lara.vercel.app',
    credentials: true
}));

// FUNÇÃO AUTOMÁTICA: Cria a tabela no banco assim que a API liga
async function criarTabelaAutomatica() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS produtos (
                id int primary key auto_increment,
                descricao varchar(100),
                categoria varchar(50),
                preco decimal(5,2),
                imagem text
            );
        `);
        console.log("Tabela 'produtos' verificada/criada com sucesso no Aiven!");
    } catch (error) {
        console.error("Erro ao criar tabela automaticamente:", error);
    }
}

app.get("/", (req, res) => {
    res.json({
        mensagem: "API funcionando"
    })
});

app.get("/produtos", async (req, res) => {
    try {
        const [produtos] = await db.query(
            "SELECT * from produtos"
        )
        res.json(produtos)
    } catch (error) {
        console.error("Erro ao buscar produtos:", error)
        res.status(500).json({ erro: "Erro ao carregar produtos do banco de dados", detalhe: error.message })
    }
})

app.post("/produtos", async (req, res) => {
    try {
        const { descricao, categoria, preco, imagem } = req.body;

        const sql = `
            INSERT INTO produtos (descricao, categoria, preco, imagem)
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
})

app.delete("/produtos/:id", async (req, res) => {
    try {
        const { id } = req.params

        await db.query("DELETE FROM produtos WHERE id = ?", [id])

        res.json({ mensagem: "Produto deletado com sucesso" })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            erro: "Erro ao deletar o produto"
        })
    }
})

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    await criarTabelaAutomatica(); // Executa a criação da tabela ao ligar
})
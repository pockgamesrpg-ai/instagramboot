const express = require("express");

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;
const API_VERSION = process.env.INSTAGRAM_API_VERSION || "v26.0";
const ADMIN_KEY = process.env.ADMIN_KEY;

app.get("/", (req, res) => {
  res.json({
    online: true,
    servico: "Central dos Setups Automação"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    online: true,
    instagramConfigurado: Boolean(TOKEN && INSTAGRAM_USER_ID),
    protecaoConfigurada: Boolean(ADMIN_KEY)
  });
});

app.post("/api/publicar", async (req, res) => {
  try {
    if (!ADMIN_KEY || req.headers["x-admin-key"] !== ADMIN_KEY) {
      return res.status(401).json({ erro: "Acesso não autorizado." });
    }

    if (!TOKEN || !INSTAGRAM_USER_ID) {
      return res.status(500).json({
        erro: "Instagram ainda não foi configurado no servidor."
      });
    }

    const { imagemUrl, legenda } = req.body;

    if (!imagemUrl || !legenda) {
      return res.status(400).json({
        erro: "Informe imagemUrl e legenda."
      });
    }

    const url = new URL(imagemUrl);

    if (url.protocol !== "https:") {
      return res.status(400).json({
        erro: "A imagem precisa possuir uma URL HTTPS pública."
      });
    }

    const criarContainer = await fetch(
      `https://graph.instagram.com/${API_VERSION}/${INSTAGRAM_USER_ID}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imagemUrl,
          caption: legenda,
          access_token: TOKEN
        })
      }
    );

    const container = await criarContainer.json();

    if (!criarContainer.ok || !container.id) {
      return res.status(400).json({
        erro: "Não foi possível preparar a publicação.",
        detalhes: container
      });
    }

    const publicar = await fetch(
      `https://graph.instagram.com/${API_VERSION}/${INSTAGRAM_USER_ID}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: container.id,
          access_token: TOKEN
        })
      }
    );

    const resultado = await publicar.json();

    if (!publicar.ok) {
      return res.status(400).json({
        erro: "Não foi possível publicar no Instagram.",
        detalhes: resultado
      });
    }

    res.json({
      sucesso: true,
      mensagem: "Publicação enviada ao Instagram.",
      publicacaoId: resultado.id
    });
  } catch (erro) {
    res.status(500).json({
      erro: "Erro interno na automação.",
      detalhes: erro.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});

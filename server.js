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
    servico: "Central dos Setups Automação",
    painel: "/painel"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    online: true,
    instagramConfigurado: Boolean(TOKEN && INSTAGRAM_USER_ID),
    protecaoConfigurada: Boolean(ADMIN_KEY)
  });
});

app.get("/painel", (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  res.type("html").send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Central dos Setups | Publicações</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      padding: 30px 16px;
      font-family: Arial, sans-serif;
      color: #ffffff;
      background:
        radial-gradient(circle at top, #123d28 0%, #07100c 42%, #030504 100%);
    }

    .container {
      width: 100%;
      max-width: 1050px;
      margin: auto;
    }

    h1 {
      margin: 0;
      color: #52ff8a;
    }

    .subtitulo {
      color: #aab8af;
      margin-bottom: 26px;
    }

    .painel {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 24px;
    }

    .card {
      padding: 24px;
      border: 1px solid #1d5838;
      border-radius: 18px;
      background: rgba(7, 18, 12, 0.94);
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
    }

    label {
      display: block;
      margin: 18px 0 7px;
      font-weight: bold;
    }

    input,
    textarea {
      width: 100%;
      border: 1px solid #296344;
      border-radius: 10px;
      padding: 13px;
      color: white;
      background: #0c1711;
      outline: none;
    }

    input:focus,
    textarea:focus {
      border-color: #42ff80;
      box-shadow: 0 0 0 3px rgba(66, 255, 128, 0.12);
    }

    textarea {
      min-height: 190px;
      resize: vertical;
    }

    button {
      width: 100%;
      margin-top: 20px;
      padding: 14px;
      border: 0;
      border-radius: 11px;
      color: #031107;
      background: linear-gradient(90deg, #35e875, #7dff9f);
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
    }

    button:disabled {
      opacity: 0.55;
      cursor: wait;
    }

    .aviso {
      margin-top: 14px;
      color: #ffd86b;
      font-size: 13px;
    }

    .preview {
      overflow: hidden;
      border: 1px solid #1d5838;
      border-radius: 16px;
      background: #080d0a;
    }

    .preview img {
      display: none;
      width: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
      background: #111;
    }

    .sem-imagem {
      display: grid;
      min-height: 320px;
      place-items: center;
      padding: 20px;
      color: #708078;
      text-align: center;
    }

    .legenda-preview {
      min-height: 95px;
      padding: 16px;
      color: #e8eee9;
      line-height: 1.45;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    #resultado {
      display: none;
      margin-top: 16px;
      padding: 13px;
      border-radius: 10px;
      line-height: 1.4;
    }

    #resultado.sucesso {
      display: block;
      color: #76ff9e;
      background: rgba(33, 134, 70, 0.22);
      border: 1px solid #298b4e;
    }

    #resultado.erro {
      display: block;
      color: #ff9494;
      background: rgba(151, 36, 36, 0.22);
      border: 1px solid #8d3636;
    }

    @media (max-width: 800px) {
      .painel {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>

<body>
  <main class="container">
    <h1>Central dos Setups</h1>
    <p class="subtitulo">Painel protegido para aprovar publicações</p>

    <section class="painel">
      <div class="card">
        <label for="chave">Chave administrativa</label>
        <input
          id="chave"
          type="password"
          placeholder="Digite sua ADMIN_KEY"
          autocomplete="off"
        >

        <label for="imagemUrl">URL pública da imagem</label>
        <input
          id="imagemUrl"
          type="url"
          placeholder="https://site.com/imagem.jpg"
        >

        <label for="legenda">Legenda</label>
        <textarea
          id="legenda"
          maxlength="2200"
          placeholder="Digite a legenda da promoção..."
        ></textarea>

        <button id="publicar">Revisar e publicar no Instagram</button>

        <p class="aviso">
          A publicação só será enviada depois da confirmação.
          A imagem precisa possuir uma URL HTTPS pública e direta.
        </p>

        <div id="resultado"></div>
      </div>

      <div class="card">
        <h2>Pré-visualização</h2>

        <div class="preview">
          <div id="semImagem" class="sem-imagem">
            Cole a URL de uma imagem para visualizar
          </div>

          <img id="previewImagem" alt="Pré-visualização da promoção">

          <div id="previewLegenda" class="legenda-preview">
            Sua legenda aparecerá aqui.
          </div>
        </div>
      </div>
    </section>
  </main>

  <script>
    const chave = document.getElementById("chave");
    const imagemUrl = document.getElementById("imagemUrl");
    const legenda = document.getElementById("legenda");
    const publicar = document.getElementById("publicar");
    const resultado = document.getElementById("resultado");
    const previewImagem = document.getElementById("previewImagem");
    const previewLegenda = document.getElementById("previewLegenda");
    const semImagem = document.getElementById("semImagem");

    imagemUrl.addEventListener("input", function () {
      const url = imagemUrl.value.trim();

      if (!url) {
        previewImagem.style.display = "none";
        semImagem.style.display = "grid";
        previewImagem.removeAttribute("src");
        return;
      }

      previewImagem.src = url;
      previewImagem.style.display = "block";
      semImagem.style.display = "none";
    });

    previewImagem.addEventListener("error", function () {
      previewImagem.style.display = "none";
      semImagem.style.display = "grid";
      semImagem.textContent =
        "Não foi possível carregar a imagem. Confira se o link é direto e público.";
    });

    previewImagem.addEventListener("load", function () {
      semImagem.textContent = "Cole a URL de uma imagem para visualizar";
    });

    legenda.addEventListener("input", function () {
      previewLegenda.textContent =
        legenda.value.trim() || "Sua legenda aparecerá aqui.";
    });

    publicar.addEventListener("click", async function () {
      resultado.className = "";
      resultado.style.display = "none";

      if (!chave.value.trim()) {
        mostrarErro("Digite sua chave administrativa.");
        return;
      }

      if (!imagemUrl.value.trim()) {
        mostrarErro("Informe a URL pública da imagem.");
        return;
      }

      if (!legenda.value.trim()) {
        mostrarErro("Digite a legenda da publicação.");
        return;
      }

      const confirmou = confirm(
        "Confirma a publicação desta imagem no Instagram @centraldosetups?"
      );

      if (!confirmou) {
        return;
      }

      publicar.disabled = true;
      publicar.textContent = "Publicando...";

      try {
        const resposta = await fetch("/api/publicar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": chave.value.trim()
          },
          body: JSON.stringify({
            imagemUrl: imagemUrl.value.trim(),
            legenda: legenda.value.trim()
          })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
          const mensagem =
            dados.detalhes &&
            dados.detalhes.error &&
            dados.detalhes.error.message
              ? dados.detalhes.error.message
              : dados.erro || "Não foi possível publicar.";

          throw new Error(mensagem);
        }

        resultado.className = "sucesso";
        resultado.style.display = "block";
        resultado.textContent =
          "✅ Publicação enviada com sucesso! ID: " +
          dados.publicacaoId;
      } catch (erro) {
        mostrarErro(erro.message);
      } finally {
        publicar.disabled = false;
        publicar.textContent = "Revisar e publicar no Instagram";
      }
    });

    function mostrarErro(mensagem) {
      resultado.className = "erro";
      resultado.style.display = "block";
      resultado.textContent = "❌ " + mensagem;
    }
  </script>
</body>
</html>
  `);
});

app.post("/api/publicar", async (req, res) => {
  try {
    if (!ADMIN_KEY || req.headers["x-admin-key"] !== ADMIN_KEY) {
      return res.status(401).json({
        erro: "Chave administrativa incorreta."
      });
    }

    if (!TOKEN || !INSTAGRAM_USER_ID) {
      return res.status(500).json({
        erro: "Instagram ainda não foi configurado."
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
        erro: "A imagem precisa possuir uma URL HTTPS."
      });
    }

    if (legenda.length > 2200) {
      return res.status(400).json({
        erro: "A legenda ultrapassou 2.200 caracteres."
      });
    }

    const criarContainer = await fetch(
      "https://graph.instagram.com/" +
        API_VERSION +
        "/" +
        INSTAGRAM_USER_ID +
        "/media",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
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

    const publicarInstagram = await fetch(
      "https://graph.instagram.com/" +
        API_VERSION +
        "/" +
        INSTAGRAM_USER_ID +
        "/media_publish",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          creation_id: container.id,
          access_token: TOKEN
        })
      }
    );

    const publicacao = await publicarInstagram.json();

    if (!publicarInstagram.ok) {
      return res.status(400).json({
        erro: "Não foi possível publicar no Instagram.",
        detalhes: publicacao
      });
    }

    return res.json({
      sucesso: true,
      mensagem: "Publicação enviada ao Instagram.",
      publicacaoId: publicacao.id
    });
  } catch (erro) {
    return res.status(500).json({
      erro: "Erro interno na automação.",
      detalhes: erro.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor iniciado na porta " + PORT);
});

const express = require("express");

const app = express();

app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;
const API_VERSION = process.env.INSTAGRAM_API_VERSION || "v26.0";
const ADMIN_KEY = process.env.ADMIN_KEY;
const PRODUTOS = require("./produtos.json");

/* =========================
   ROTAS BÁSICAS
========================= */

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
    protecaoConfigurada: Boolean(ADMIN_KEY),
    quantidadeProdutos: PRODUTOS.length
  });
});

app.get("/api/produtos", (req, res) => {
  res.json(PRODUTOS);
});

/* =========================
   PAINEL
========================= */

app.get("/painel", (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  res.type("html").send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

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
        radial-gradient(
          circle at top,
          #123d28 0%,
          #07100c 42%,
          #030504 100%
        );
    }

    .container {
      width: 100%;
      max-width: 1100px;
      margin: auto;
    }

    h1 {
      margin: 0;
      color: #52ff8a;
      font-size: 38px;
    }

    h2 {
      margin-top: 0;
    }

    .subtitulo {
      margin: 10px 0 26px;
      color: #aab8af;
    }

    .painel {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 390px;
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
    textarea,
    select {
      width: 100%;
      border: 1px solid #296344;
      border-radius: 10px;
      padding: 13px;
      color: #ffffff;
      background: #0c1711;
      outline: none;
      font-size: 14px;
    }

    select {
      cursor: pointer;
    }

    input:focus,
    textarea:focus,
    select:focus {
      border-color: #42ff80;
      box-shadow: 0 0 0 3px rgba(66, 255, 128, 0.12);
    }

    textarea {
      min-height: 210px;
      resize: vertical;
      line-height: 1.5;
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

    button:hover {
      filter: brightness(1.08);
    }

    button:disabled {
      opacity: 0.55;
      cursor: wait;
    }

    .produto-info {
      display: none;
      margin-top: 12px;
      padding: 12px;
      border: 1px solid #245c3d;
      border-radius: 10px;
      color: #b9c8bf;
      background: rgba(23, 82, 51, 0.2);
      font-size: 14px;
      line-height: 1.5;
    }

    .produto-info strong {
      color: #62ff94;
    }

    .aviso {
      margin: 14px 0 0;
      color: #ffd86b;
      font-size: 13px;
      line-height: 1.4;
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
      object-fit: contain;
      background: #ffffff;
    }

    .sem-imagem {
      display: grid;
      min-height: 330px;
      place-items: center;
      padding: 20px;
      color: #708078;
      text-align: center;
    }

    .legenda-preview {
      min-height: 120px;
      padding: 16px;
      color: #e8eee9;
      line-height: 1.5;
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

    @media (max-width: 850px) {
      .painel {
        grid-template-columns: 1fr;
      }

      h1 {
        font-size: 30px;
      }
    }
  </style>
</head>

<body>
  <main class="container">
    <h1>Central dos Setups</h1>

    <p class="subtitulo">
      Escolha um produto, revise a publicação e envie ao Instagram.
    </p>

    <section class="painel">
      <div class="card">

        <label for="chave">
          Chave administrativa
        </label>

        <input
          id="chave"
          type="password"
          placeholder="Digite sua ADMIN_KEY"
          autocomplete="off"
        >

        <label for="produto">
          Escolher produto
        </label>

        <select id="produto">
          <option value="">
            Carregando produtos...
          </option>
        </select>

        <div id="produtoInfo" class="produto-info"></div>

        <label for="imagemUrl">
          URL pública da imagem
        </label>

        <input
          id="imagemUrl"
          type="url"
          placeholder="https://site.com/imagem.jpg"
        >

        <label for="legenda">
          Legenda
        </label>

        <textarea
          id="legenda"
          maxlength="2200"
          placeholder="Digite a legenda da promoção..."
        ></textarea>

        <button id="publicar">
          Revisar e publicar no Instagram
        </button>

        <p class="aviso">
          A publicação só será enviada após sua confirmação.
          A imagem precisa ter uma URL HTTPS pública e direta.
        </p>

        <div id="resultado"></div>
      </div>

      <div class="card">
        <h2>Pré-visualização</h2>

        <div class="preview">
          <div id="semImagem" class="sem-imagem">
            Selecione um produto para visualizar
          </div>

          <img
            id="previewImagem"
            alt="Pré-visualização da promoção"
          >

          <div id="previewLegenda" class="legenda-preview">
            A legenda da publicação aparecerá aqui.
          </div>
        </div>
      </div>
    </section>
  </main>

  <script>
    const produto = document.getElementById("produto");
    const produtoInfo = document.getElementById("produtoInfo");
    const chave = document.getElementById("chave");
    const imagemUrl = document.getElementById("imagemUrl");
    const legenda = document.getElementById("legenda");
    const publicar = document.getElementById("publicar");
    const resultado = document.getElementById("resultado");
    const previewImagem = document.getElementById("previewImagem");
    const previewLegenda = document.getElementById("previewLegenda");
    const semImagem = document.getElementById("semImagem");

    let produtosCarregados = [];

    carregarProdutos();

    async function carregarProdutos() {
      try {
        const resposta = await fetch("/api/produtos");

        if (!resposta.ok) {
          throw new Error("Erro ao carregar catálogo.");
        }

        produtosCarregados = await resposta.json();

        produto.innerHTML =
          '<option value="">Selecione um produto...</option>';

        produtosCarregados.forEach(function (item, indice) {
          const opcao = document.createElement("option");

          opcao.value = indice;
          opcao.textContent =
            item.loja + " — " + item.nome;

          produto.appendChild(opcao);
        });
      } catch (erro) {
        produto.innerHTML =
          '<option value="">Erro ao carregar produtos</option>';

        mostrarErro(erro.message);
      }
    }

    produto.addEventListener("change", function () {
      resultado.className = "";
      resultado.style.display = "none";

      if (produto.value === "") {
        produtoInfo.style.display = "none";
        return;
      }

      const item =
        produtosCarregados[Number(produto.value)];

      imagemUrl.value = item.imagem;

      legenda.value =
        "🔥 " + item.nome + "\\n\\n" +
        "Encontramos esta oferta na " +
        item.loja +
        " para melhorar seu setup!\\n\\n" +
        "🛒 Confira o produto: " +
        item.link +
        "\\n\\n" +
        "💚 Siga @centraldosetups para acompanhar novas promoções.\\n\\n" +
        "Aviso: podemos receber comissão por compras realizadas pelos nossos links, sem custo adicional para você.\\n\\n" +
        "#setupgamer #pcgamer #promocao #tecnologia";

      produtoInfo.style.display = "block";

      produtoInfo.innerHTML =
        "<strong>Loja:</strong> " +
        escaparTexto(item.loja) +
        "<br><strong>Produto:</strong> " +
        escaparTexto(item.nome) +
        "<br><strong>Link:</strong> " +
        escaparTexto(item.link);

      atualizarImagem();
      atualizarLegenda();
    });

    imagemUrl.addEventListener("input", atualizarImagem);
    legenda.addEventListener("input", atualizarLegenda);

    function atualizarImagem() {
      const url = imagemUrl.value.trim();

      if (!url) {
        previewImagem.style.display = "none";
        semImagem.style.display = "grid";
        semImagem.textContent =
          "Selecione um produto para visualizar";

        previewImagem.removeAttribute("src");
        return;
      }

      previewImagem.src = url;
      previewImagem.style.display = "block";
      semImagem.style.display = "none";
    }

    function atualizarLegenda() {
      previewLegenda.textContent =
        legenda.value.trim() ||
        "A legenda da publicação aparecerá aqui.";
    }

    previewImagem.addEventListener("error", function () {
      previewImagem.style.display = "none";
      semImagem.style.display = "grid";
      semImagem.textContent =
        "Não foi possível carregar a imagem. Confira o endereço.";
    });

    previewImagem.addEventListener("load", function () {
      semImagem.style.display = "none";
      previewImagem.style.display = "block";
    });

    publicar.addEventListener("click", async function () {
      resultado.className = "";
      resultado.style.display = "none";

      if (!chave.value.trim()) {
        mostrarErro("Digite sua chave administrativa.");
        return;
      }

      if (!imagemUrl.value.trim()) {
        mostrarErro("Escolha um produto ou informe uma imagem.");
        return;
      }

      if (!legenda.value.trim()) {
        mostrarErro("Digite a legenda da publicação.");
        return;
      }

      const confirmou = confirm(
        "Confirma a publicação no Instagram @centraldosetups?"
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
              : dados.erro ||
                "Não foi possível publicar.";

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

        publicar.textContent =
          "Revisar e publicar no Instagram";
      }
    });

    function mostrarErro(mensagem) {
      resultado.className = "erro";
      resultado.style.display = "block";
      resultado.textContent = "❌ " + mensagem;
    }

    function escaparTexto(texto) {
      const elemento = document.createElement("div");
      elemento.textContent = texto;
      return elemento.innerHTML;
    }
  </script>
</body>
</html>
  `);
});

/* =========================
   PUBLICAÇÃO NO INSTAGRAM
========================= */

app.post("/api/publicar", async (req, res) => {
  try {
    if (
      !ADMIN_KEY ||
      req.headers["x-admin-key"] !== ADMIN_KEY
    ) {
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
    const imagemAjustada =
  "https://images.weserv.nl/?url=" +
  encodeURIComponent(imagemUrl) +
  "&w=1080&h=1080&fit=contain&bg=ffffff&output=jpg";

    if (!imagemUrl || !legenda) {
      return res.status(400).json({
        erro: "Informe imagemUrl e legenda."
      });
    }

    let url;

    try {
      url = new URL(imagemUrl);
    } catch {
      return res.status(400).json({
        erro: "A URL da imagem não é válida."
      });
    }

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
          image_url: imagemAjustada,
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

/* =========================
   INICIAR SERVIDOR
========================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor iniciado na porta " + PORT);
});

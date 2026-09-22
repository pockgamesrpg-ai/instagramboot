const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const HISTORICO_FILE = path.join(DATA_DIR, "ofertas.json");

function garantirArquivo() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(HISTORICO_FILE)) {
    fs.writeFileSync(
      HISTORICO_FILE,
      JSON.stringify([], null, 2),
      "utf8"
    );
  }
}

function lerHistorico() {
  garantirArquivo();

  try {
    return JSON.parse(
      fs.readFileSync(HISTORICO_FILE, "utf8")
    );
  } catch {
    return [];
  }
}

function salvarHistorico(historico) {
  garantirArquivo();

  fs.writeFileSync(
    HISTORICO_FILE,
    JSON.stringify(historico, null, 2),
    "utf8"
  );
}

function ofertaJaPublicada(produtoId, preco) {
  const historico = lerHistorico();

  return historico.some(
    item =>
      item.produtoId === produtoId &&
      Number(item.preco) === Number(preco)
  );
}

function registrarOferta(oferta) {
  const historico = lerHistorico();

  historico.unshift({
    ...oferta,
    registradaEm: new Date().toISOString()
  });

  const limitado = historico.slice(0, 500);

  salvarHistorico(limitado);
}

module.exports = {
  lerHistorico,
  ofertaJaPublicada,
  registrarOferta
};

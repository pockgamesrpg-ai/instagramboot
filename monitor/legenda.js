function dinheiro(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function gerarLegenda(oferta) {
  const linhas = [];

  linhas.push("🔥 OFERTA ENCONTRADA!");
  linhas.push("");

  linhas.push(`🛒 ${oferta.nome}`);
  linhas.push("");

  if (oferta.precoOriginal) {
    linhas.push(`💰 De: ${dinheiro(oferta.precoOriginal)}`);
  }

  linhas.push(`🔥 Por: ${dinheiro(oferta.preco)}`);

  if (oferta.desconto > 0) {
    linhas.push(`📉 ${oferta.desconto}% OFF`);
  }

  if (oferta.cupom) {
    linhas.push("");
    linhas.push(`🎟️ Cupom: ${oferta.cupom}`);

    if (oferta.precoComCupom) {
      linhas.push(
        `💸 Com cupom: ${dinheiro(oferta.precoComCupom)}`
      );
    }
  }

  linhas.push("");
  linhas.push(`🛍️ Comprar:`);
  linhas.push(oferta.link);

  linhas.push("");
  linhas.push(
    "⚡ Oferta sujeita a alteração ou encerramento."
  );

  linhas.push("");
  linhas.push(
    "💚 Siga @centraldosetups para mais promoções."
  );

  linhas.push("");
  linhas.push(
    "#pcgamer #hardware #promocao #oferta #tecnologia"
  );

  return linhas.join("\n");
}

module.exports = {
  gerarLegenda
};

const {
  ofertaJaPublicada,
  registrarOferta
} = require("./historico");

const {
  gerarLegenda
} = require("./legenda");

const ACCESS_TOKEN =
  process.env.MERCADOLIVRE_ACCESS_TOKEN;

const DESCONTO_MINIMO =
  Number(process.env.DESCONTO_MINIMO || 10);

function dinheiro(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

async function consultarPreco(itemId) {
  if (!ACCESS_TOKEN) {
    throw new Error(
      "MERCADOLIVRE_ACCESS_TOKEN não configurado."
    );
  }

  const resposta = await fetch(
    `https://api.mercadolibre.com/items/${encodeURIComponent(
      itemId
    )}/sale_price?context=channel_marketplace`,
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`
      }
    }
  );

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.message ||
      `Erro Mercado Livre: HTTP ${resposta.status}`
    );
  }

  return dados;
}

async function verificarProduto(produto) {
  if (!produto.itemId) {
    return {
      encontrado: false,
      ignorado: true,
      motivo: "Produto sem itemId do Mercado Livre.",
      produto
    };
  }

  try {
    const dados = await consultarPreco(
      produto.itemId
    );

    const preco = Number(dados.amount);
    const precoOriginal = Number(
      dados.regular_amount
    );

    if (
      !Number.isFinite(preco) ||
      preco <= 0
    ) {
      return {
        encontrado: false,
        produto,
        motivo: "Preço inválido retornado pela API."
      };
    }

    let desconto = 0;

    if (
      Number.isFinite(precoOriginal) &&
      precoOriginal > preco
    ) {
      desconto = Math.round(
        ((precoOriginal - preco) /
          precoOriginal) *
          100
      );
    }

    const emPromocao =
      Number.isFinite(precoOriginal) &&
      precoOriginal > preco;

    if (!emPromocao) {
      return {
        encontrado: false,
        promocao: false,
        produto,
        preco
      };
    }

    if (desconto < DESCONTO_MINIMO) {
      return {
        encontrado: false,
        promocao: true,
        abaixoDoMinimo: true,
        produto,
        preco,
        precoOriginal,
        desconto
      };
    }

    const oferta = {
      produtoId: produto.itemId,
      nome: produto.nome,
      loja: produto.loja,
      imagem: produto.imagem,
      link: produto.link,
      preco,
      precoOriginal,
      desconto,
      cupom: produto.cupom || null,
      precoComCupom: null,
      promotionId:
        dados.metadata?.promotion_id || null,
      promotionType:
        dados.metadata?.promotion_type || null
    };

    if (
      ofertaJaPublicada(
        oferta.produtoId,
        oferta.preco
      )
    ) {
      return {
        encontrado: true,
        nova: false,
        oferta
      };
    }

    oferta.legenda =
      gerarLegenda(oferta);

    registrarOferta(oferta);

    return {
      encontrado: true,
      nova: true,
      oferta
    };

  } catch (erro) {
    return {
      encontrado: false,
      erro: erro.message,
      produto
    };
  }
}

async function verificarCatalogo(produtos) {
  const resultados = [];

  for (const produto of produtos) {
    if (
      String(produto.loja).toLowerCase() !==
      "mercado livre"
    ) {
      continue;
    }

    const resultado =
      await verificarProduto(produto);

    resultados.push(resultado);

    // Pequena pausa entre consultas
    await new Promise(
      resolve => setTimeout(resolve, 300)
    );
  }

  return resultados;
}

module.exports = {
  verificarCatalogo,
  verificarProduto
};

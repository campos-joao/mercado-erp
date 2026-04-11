import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const entradas = await prisma.entradaNfe.findMany({
      include: {
        fornecedor: true,
        itens: {
          include: { produto: true },
        },
      },
      orderBy: { dataEntrada: "desc" },
    });

    return NextResponse.json(entradas);
  } catch (error) {
    console.error("Erro ao buscar entradas NF-e:", error);
    return NextResponse.json(
      { error: "Erro ao buscar entradas NF-e" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nfe, confirmar } = body;

    if (!nfe) {
      return NextResponse.json(
        { error: "Dados da NF-e não fornecidos" },
        { status: 400 }
      );
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // Buscar ou criar fornecedor pelo CNPJ
      let fornecedor = await tx.fornecedor.findUnique({
        where: { cnpj: nfe.fornecedor.cnpj },
      });

      if (!fornecedor) {
        fornecedor = await tx.fornecedor.create({
          data: {
            cnpj: nfe.fornecedor.cnpj,
            razaoSocial: nfe.fornecedor.razaoSocial,
            nomeFantasia: nfe.fornecedor.nomeFantasia || null,
            inscricaoEstadual: nfe.fornecedor.inscricaoEstadual || null,
            endereco: nfe.fornecedor.endereco || null,
            cidade: nfe.fornecedor.cidade || null,
            uf: nfe.fornecedor.uf || null,
          },
        });
      }

      // Verificar se a NF-e já foi importada
      if (nfe.chaveAcesso) {
        const existente = await tx.entradaNfe.findUnique({
          where: { chaveAcesso: nfe.chaveAcesso },
        });

        if (existente) {
          return { error: "Esta NF-e já foi importada anteriormente", existente };
        }
      }

      // Criar a entrada da NF-e
      const entradaNfe = await tx.entradaNfe.create({
        data: {
          numeroNfe: nfe.numero,
          serie: nfe.serie || null,
          chaveAcesso: nfe.chaveAcesso || null,
          fornecedorId: fornecedor.id,
          dataEmissao: nfe.dataEmissao ? new Date(nfe.dataEmissao) : null,
          valorTotal: nfe.valorTotal || 0,
          valorIcms: nfe.valorIcms || 0,
          valorIpi: nfe.valorIpi || 0,
          status: confirmar ? "processada" : "pendente",
        },
      });

      // Processar itens
      for (const item of nfe.itens) {
        // Tentar encontrar produto pelo EAN
        let produtoId: string | null = null;
        let mapeamentoStatus = "pendente";

        if (item.ean) {
          const produtoExistente = await tx.produto.findFirst({
            where: { ean: item.ean },
          });

          if (produtoExistente) {
            produtoId = produtoExistente.id;
            mapeamentoStatus = "mapeado";

            // Se confirmar, atualizar estoque e preço de custo
            if (confirmar) {
              await tx.produto.update({
                where: { id: produtoExistente.id },
                data: {
                  estoqueAtual: {
                    increment: item.quantidade,
                  },
                  precoCusto: item.valorUnitario,
                },
              });
            }
          }
        }

        // Verificar mapeamento existente
        if (!produtoId) {
          const mapeamento = await tx.mapeamentoProduto.findFirst({
            where: {
              nomeFornecedor: item.nome,
              fornecedorId: fornecedor.id,
              confirmado: true,
            },
          });

          if (mapeamento && mapeamento.produtoId) {
            produtoId = mapeamento.produtoId;
            mapeamentoStatus = "mapeado";

            if (confirmar) {
              await tx.produto.update({
                where: { id: mapeamento.produtoId },
                data: {
                  estoqueAtual: {
                    increment: item.quantidade,
                  },
                  precoCusto: item.valorUnitario,
                },
              });
            }
          }
        }

        await tx.itemNfe.create({
          data: {
            entradaNfeId: entradaNfe.id,
            produtoId,
            nomeXml: item.nome,
            codigoXml: item.codigo || null,
            eanXml: item.ean || null,
            ncmXml: item.ncm || null,
            quantidade: item.quantidade,
            unidadeXml: item.unidade || null,
            valorUnitario: item.valorUnitario || null,
            valorTotal: item.valorTotal || null,
            mapeamentoStatus,
          },
        });
      }

      const entradaCompleta = await tx.entradaNfe.findUnique({
        where: { id: entradaNfe.id },
        include: {
          fornecedor: true,
          itens: { include: { produto: true } },
        },
      });

      return entradaCompleta;
    });

    if ((resultado as any)?.error) {
      return NextResponse.json(resultado, { status: 409 });
    }

    return NextResponse.json(resultado, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao processar NF-e:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar NF-e" },
      { status: 500 }
    );
  }
}

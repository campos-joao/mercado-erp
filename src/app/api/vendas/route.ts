import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limite = parseInt(searchParams.get("limite") || "50");

    const vendas = await prisma.venda.findMany({
      include: {
        itens: {
          include: { produto: true },
        },
      },
      orderBy: { dataVenda: "desc" },
      take: limite,
    });

    return NextResponse.json(vendas);
  } catch (error) {
    console.error("Erro ao buscar vendas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar vendas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itens, formaPagamento, observacoes, valorDesconto } = body;

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json(
        { error: "A venda deve ter pelo menos um item" },
        { status: 400 }
      );
    }

    const venda = await prisma.$transaction(async (tx) => {
      let valorTotal = 0;

      const itensProcessados = [];
      for (const item of itens) {
        const produto = await tx.produto.findUnique({
          where: { id: item.produtoId },
        });

        if (!produto) {
          throw new Error(`Produto ${item.produtoId} não encontrado`);
        }

        if (Number(produto.estoqueAtual) < item.quantidade) {
          throw new Error(
            `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoqueAtual}`
          );
        }

        const subtotal =
          item.quantidade * Number(produto.precoVenda) - (item.desconto || 0);
        valorTotal += subtotal;

        itensProcessados.push({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: Number(produto.precoVenda),
          desconto: item.desconto || 0,
          subtotal,
        });

        await tx.produto.update({
          where: { id: item.produtoId },
          data: {
            estoqueAtual: {
              decrement: item.quantidade,
            },
          },
        });
      }

      const desconto = valorDesconto || 0;
      const valorFinal = valorTotal - desconto;

      const novaVenda = await tx.venda.create({
        data: {
          valorTotal,
          valorDesconto: desconto,
          valorFinal,
          formaPagamento: formaPagamento || null,
          observacoes: observacoes || null,
          itens: {
            create: itensProcessados,
          },
        },
        include: {
          itens: {
            include: { produto: true },
          },
        },
      });

      return novaVenda;
    });

    return NextResponse.json(venda, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao registrar venda:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao registrar venda" },
      { status: 500 }
    );
  }
}

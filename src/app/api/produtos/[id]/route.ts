import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { produtoSchema } from "@/lib/validators";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: params.id },
      include: { fornecedor: true },
    });

    if (!produto) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(produto);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produto" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = produtoSchema.parse(body);

    const margemLucro =
      validated.precoCusto > 0
        ? ((validated.precoVenda - validated.precoCusto) / validated.precoCusto) * 100
        : 0;

    const produto = await prisma.produto.update({
      where: { id: params.id },
      data: {
        nome: validated.nome,
        descricao: validated.descricao || null,
        codigoBarras: validated.codigoBarras || null,
        ean: validated.ean || null,
        ncm: validated.ncm || null,
        unidade: validated.unidade,
        precoCusto: validated.precoCusto,
        precoVenda: validated.precoVenda,
        margemLucro: Math.round(margemLucro * 100) / 100,
        estoqueAtual: validated.estoqueAtual,
        estoqueMinimo: validated.estoqueMinimo,
        fornecedorId: validated.fornecedorId || null,
        categoria: validated.categoria || null,
      },
    });

    return NextResponse.json(produto);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar produto" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.produto.update({
      where: { id: params.id },
      data: { ativo: false },
    });

    return NextResponse.json({ message: "Produto desativado com sucesso" });
  } catch (error) {
    console.error("Erro ao desativar produto:", error);
    return NextResponse.json(
      { error: "Erro ao desativar produto" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { produtoSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get("busca") || "";
    const estoqueBaixo = searchParams.get("estoqueBaixo") === "true";

    const where: any = { ativo: true };

    if (busca) {
      where.OR = [
        { nome: { contains: busca, mode: "insensitive" } },
        { ean: { contains: busca } },
        { codigoBarras: { contains: busca } },
        { categoria: { contains: busca, mode: "insensitive" } },
      ];
    }

    const produtos = await prisma.produto.findMany({
      where,
      include: { fornecedor: true },
      orderBy: { nome: "asc" },
    });

    const resultado = estoqueBaixo
      ? produtos.filter(
          (p) => Number(p.estoqueAtual) <= Number(p.estoqueMinimo)
        )
      : produtos;

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = produtoSchema.parse(body);

    const margemLucro =
      validated.precoCusto > 0
        ? ((validated.precoVenda - validated.precoCusto) / validated.precoCusto) * 100
        : 0;

    const produto = await prisma.produto.create({
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

    return NextResponse.json(produto, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Erro ao criar produto:", error);
    return NextResponse.json(
      { error: "Erro ao criar produto" },
      { status: 500 }
    );
  }
}

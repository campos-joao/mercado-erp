import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { produtoSchema } from "@/lib/validators";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await db.collection("produtos").doc(params.id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
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

    const data = {
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
      atualizadoEm: new Date().toISOString(),
    };

    await db.collection("produtos").doc(params.id).update(data);

    return NextResponse.json({ id: params.id, ...data });
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
    await db.collection("produtos").doc(params.id).update({
      ativo: false,
      atualizadoEm: new Date().toISOString(),
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

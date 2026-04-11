import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { produtoSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busca = (searchParams.get("busca") || "").toLowerCase();
    const estoqueBaixo = searchParams.get("estoqueBaixo") === "true";

    const snapshot = await db
      .collection("produtos")
      .where("ativo", "==", true)
      .orderBy("nome")
      .get();

    let produtos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (busca) {
      produtos = produtos.filter((p: any) => {
        const nome = (p.nome || "").toLowerCase();
        const ean = (p.ean || "").toLowerCase();
        const codigoBarras = (p.codigoBarras || "").toLowerCase();
        const categoria = (p.categoria || "").toLowerCase();
        return (
          nome.includes(busca) ||
          ean.includes(busca) ||
          codigoBarras.includes(busca) ||
          categoria.includes(busca)
        );
      });
    }

    if (estoqueBaixo) {
      produtos = produtos.filter(
        (p: any) => Number(p.estoqueAtual) <= Number(p.estoqueMinimo)
      );
    }

    return NextResponse.json(produtos);
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

    const now = new Date().toISOString();
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
      ativo: true,
      criadoEm: now,
      atualizadoEm: now,
    };

    const docRef = await db.collection("produtos").add(data);

    return NextResponse.json({ id: docRef.id, ...data }, { status: 201 });
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

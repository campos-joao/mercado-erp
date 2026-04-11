import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { fornecedorSchema } from "@/lib/validators";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await db.collection("fornecedores").doc(params.id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Fornecedor não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Erro ao buscar fornecedor:", error);
    return NextResponse.json(
      { error: "Erro ao buscar fornecedor" },
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
    const validated = fornecedorSchema.parse(body);

    const cnpjLimpo = validated.cnpj.replace(/\D/g, "");

    const data = {
      razaoSocial: validated.razaoSocial,
      nomeFantasia: validated.nomeFantasia || null,
      cnpj: cnpjLimpo,
      inscricaoEstadual: validated.inscricaoEstadual || null,
      telefone: validated.telefone || null,
      email: validated.email || null,
      endereco: validated.endereco || null,
      cidade: validated.cidade || null,
      uf: validated.uf || null,
      cep: validated.cep || null,
      atualizadoEm: new Date().toISOString(),
    };

    await db.collection("fornecedores").doc(params.id).update(data);

    return NextResponse.json({ id: params.id, ...data });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Erro ao atualizar fornecedor:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar fornecedor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.collection("fornecedores").doc(params.id).update({
      ativo: false,
      atualizadoEm: new Date().toISOString(),
    });

    return NextResponse.json({ message: "Fornecedor desativado com sucesso" });
  } catch (error) {
    console.error("Erro ao desativar fornecedor:", error);
    return NextResponse.json(
      { error: "Erro ao desativar fornecedor" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { fornecedorSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busca = (searchParams.get("busca") || "").toLowerCase();

    const snapshot = await db
      .collection("fornecedores")
      .orderBy("razaoSocial")
      .get();

    let fornecedores = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (busca) {
      fornecedores = fornecedores.filter((f: any) => {
        const razao = (f.razaoSocial || "").toLowerCase();
        const fantasia = (f.nomeFantasia || "").toLowerCase();
        const cnpj = (f.cnpj || "").toLowerCase();
        return (
          razao.includes(busca) ||
          fantasia.includes(busca) ||
          cnpj.includes(busca)
        );
      });
    }

    return NextResponse.json(fornecedores);
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    return NextResponse.json(
      { error: "Erro ao buscar fornecedores" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = fornecedorSchema.parse(body);

    const cnpjLimpo = validated.cnpj.replace(/\D/g, "");

    // Verificar duplicidade de CNPJ
    const existente = await db
      .collection("fornecedores")
      .where("cnpj", "==", cnpjLimpo)
      .limit(1)
      .get();

    if (!existente.empty) {
      return NextResponse.json(
        { error: "Já existe um fornecedor com este CNPJ" },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
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
      ativo: true,
      criadoEm: now,
      atualizadoEm: now,
    };

    const docRef = await db.collection("fornecedores").add(data);

    return NextResponse.json({ id: docRef.id, ...data }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Erro ao criar fornecedor:", error);
    return NextResponse.json(
      { error: "Erro ao criar fornecedor" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fornecedorSchema } from "@/lib/validators";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fornecedor = await prisma.fornecedor.findUnique({
      where: { id: params.id },
    });

    if (!fornecedor) {
      return NextResponse.json(
        { error: "Fornecedor não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(fornecedor);
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

    const fornecedor = await prisma.fornecedor.update({
      where: { id: params.id },
      data: {
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
      },
    });

    return NextResponse.json(fornecedor);
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
    await prisma.fornecedor.update({
      where: { id: params.id },
      data: { ativo: false },
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

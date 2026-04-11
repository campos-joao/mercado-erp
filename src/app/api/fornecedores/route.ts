import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fornecedorSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get("busca") || "";

    const where: any = {};

    if (busca) {
      where.OR = [
        { razaoSocial: { contains: busca, mode: "insensitive" } },
        { nomeFantasia: { contains: busca, mode: "insensitive" } },
        { cnpj: { contains: busca } },
      ];
    }

    const fornecedores = await prisma.fornecedor.findMany({
      where,
      orderBy: { razaoSocial: "asc" },
    });

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

    const existente = await prisma.fornecedor.findUnique({
      where: { cnpj: cnpjLimpo },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Já existe um fornecedor com este CNPJ" },
        { status: 409 }
      );
    }

    const fornecedor = await prisma.fornecedor.create({
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

    return NextResponse.json(fornecedor, { status: 201 });
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

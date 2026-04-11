import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const entrada = await tx.entradaNfe.findUnique({
        where: { id: params.id },
        include: { itens: true },
      });

      if (!entrada) {
        throw new Error("Entrada NF-e não encontrada");
      }

      if (entrada.status === "processada") {
        throw new Error("Esta NF-e já foi processada");
      }

      // Atualizar estoque dos produtos mapeados
      for (const item of entrada.itens) {
        if (item.produtoId && item.mapeamentoStatus === "mapeado") {
          await tx.produto.update({
            where: { id: item.produtoId },
            data: {
              estoqueAtual: {
                increment: Number(item.quantidade),
              },
              precoCusto: item.valorUnitario
                ? Number(item.valorUnitario)
                : undefined,
            },
          });
        }
      }

      // Marcar entrada como processada
      const entradaAtualizada = await tx.entradaNfe.update({
        where: { id: params.id },
        data: { status: "processada" },
        include: {
          fornecedor: true,
          itens: { include: { produto: true } },
        },
      });

      return entradaAtualizada;
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error("Erro ao confirmar NF-e:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao confirmar entrada" },
      { status: 500 }
    );
  }
}

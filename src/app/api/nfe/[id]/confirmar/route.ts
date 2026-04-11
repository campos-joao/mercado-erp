import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entradaRef = db.collection("entradas_nfe").doc(params.id);
    const entradaDoc = await entradaRef.get();

    if (!entradaDoc.exists) {
      return NextResponse.json(
        { error: "Entrada NF-e não encontrada" },
        { status: 404 }
      );
    }

    const entrada = entradaDoc.data()!;

    if (entrada.status === "processada") {
      return NextResponse.json(
        { error: "Esta NF-e já foi processada" },
        { status: 400 }
      );
    }

    // Atualizar estoque dos produtos mapeados
    const itens = entrada.itens || [];
    for (const item of itens) {
      if (item.produtoId && item.mapeamentoStatus === "mapeado") {
        const updateData: any = {
          estoqueAtual: FieldValue.increment(Number(item.quantidade)),
          atualizadoEm: new Date().toISOString(),
        };
        if (item.valorUnitario) {
          updateData.precoCusto = Number(item.valorUnitario);
        }
        await db.collection("produtos").doc(item.produtoId).update(updateData);
      }
    }

    // Marcar entrada como processada
    await entradaRef.update({
      status: "processada",
      atualizadoEm: new Date().toISOString(),
    });

    const atualizado = await entradaRef.get();
    return NextResponse.json({ id: atualizado.id, ...atualizado.data() });
  } catch (error: any) {
    console.error("Erro ao confirmar NF-e:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao confirmar entrada" },
      { status: 500 }
    );
  }
}

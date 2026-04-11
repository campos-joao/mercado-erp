import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limite = parseInt(searchParams.get("limite") || "50");

    const snapshot = await db
      .collection("vendas")
      .orderBy("dataVenda", "desc")
      .limit(limite)
      .get();

    const vendas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(vendas);
  } catch (error) {
    console.error("Erro ao buscar vendas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar vendas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itens, formaPagamento, observacoes, valorDesconto } = body;

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json(
        { error: "A venda deve ter pelo menos um item" },
        { status: 400 }
      );
    }

    // Usar transação do Firestore para garantir atomicidade
    const venda = await db.runTransaction(async (transaction) => {
      let valorTotal = 0;
      const itensProcessados: any[] = [];

      for (const item of itens) {
        const produtoRef = db.collection("produtos").doc(item.produtoId);
        const produtoDoc = await transaction.get(produtoRef);

        if (!produtoDoc.exists) {
          throw new Error(`Produto ${item.produtoId} não encontrado`);
        }

        const produto = produtoDoc.data()!;

        if (Number(produto.estoqueAtual) < item.quantidade) {
          throw new Error(
            `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoqueAtual}`
          );
        }

        const subtotal =
          item.quantidade * Number(produto.precoVenda) - (item.desconto || 0);
        valorTotal += subtotal;

        itensProcessados.push({
          produtoId: item.produtoId,
          produtoNome: produto.nome,
          quantidade: item.quantidade,
          precoUnitario: Number(produto.precoVenda),
          desconto: item.desconto || 0,
          subtotal,
        });

        // Decrementar estoque
        transaction.update(produtoRef, {
          estoqueAtual: FieldValue.increment(-item.quantidade),
          atualizadoEm: new Date().toISOString(),
        });
      }

      const desconto = valorDesconto || 0;
      const valorFinal = valorTotal - desconto;

      // Gerar número da venda via contador
      const contadorRef = db.collection("contadores").doc("vendas");
      const contadorDoc = await transaction.get(contadorRef);
      const numeroVenda = contadorDoc.exists
        ? (contadorDoc.data()!.atual || 0) + 1
        : 1;
      transaction.set(contadorRef, { atual: numeroVenda });

      const now = new Date().toISOString();
      const vendaData = {
        numeroVenda,
        dataVenda: now,
        valorTotal,
        valorDesconto: desconto,
        valorFinal,
        formaPagamento: formaPagamento || null,
        status: "finalizada",
        observacoes: observacoes || null,
        itens: itensProcessados,
        criadoEm: now,
      };

      const vendaRef = db.collection("vendas").doc();
      transaction.set(vendaRef, vendaData);

      return { id: vendaRef.id, ...vendaData };
    });

    return NextResponse.json(venda, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao registrar venda:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao registrar venda" },
      { status: 500 }
    );
  }
}

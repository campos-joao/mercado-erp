import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export async function GET() {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeISO = hoje.toISOString();

    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    const ontemISO = ontem.toISOString();

    // Todas as vendas finalizadas (ordenadas por data desc)
    const vendasSnap = await db
      .collection("vendas")
      .where("status", "==", "finalizada")
      .orderBy("dataVenda", "desc")
      .get();

    const todasVendas = vendasSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // Vendas de hoje
    const vendasHoje = todasVendas.filter((v) => v.dataVenda >= hojeISO);
    const totalVendasHoje = vendasHoje.reduce(
      (acc, v) => acc + Number(v.valorFinal || 0),
      0
    );

    // Vendas de ontem
    const vendasOntem = todasVendas.filter(
      (v) => v.dataVenda >= ontemISO && v.dataVenda < hojeISO
    );
    const totalVendasOntem = vendasOntem.reduce(
      (acc, v) => acc + Number(v.valorFinal || 0),
      0
    );

    // Ticket médio
    const ticketMedio =
      vendasHoje.length > 0 ? totalVendasHoje / vendasHoje.length : 0;

    // Produtos ativos
    const produtosSnap = await db
      .collection("produtos")
      .where("ativo", "==", true)
      .get();

    const totalProdutos = produtosSnap.size;

    const produtosEstoqueBaixo = produtosSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as any))
      .filter((p) => Number(p.estoqueAtual) <= Number(p.estoqueMinimo));

    // NF-e pendentes
    const nfePendentesSnap = await db
      .collection("entradas_nfe")
      .where("status", "==", "pendente")
      .get();

    // Últimas 5 vendas
    const vendasRecentes = todasVendas.slice(0, 5);

    return NextResponse.json({
      vendasHoje: totalVendasHoje,
      vendasOntem: totalVendasOntem,
      totalVendasHoje: vendasHoje.length,
      ticketMedio,
      totalProdutos,
      estoqueBaixo: produtosEstoqueBaixo.length,
      nfePendentes: nfePendentesSnap.size,
      produtosEstoqueBaixo: produtosEstoqueBaixo.slice(0, 5).map((p) => ({
        id: p.id,
        nome: p.nome,
        estoqueAtual: p.estoqueAtual,
        estoqueMinimo: p.estoqueMinimo,
      })),
      vendasRecentes: vendasRecentes.map((v) => ({
        id: v.id,
        numero: v.numeroVenda,
        valor: Number(v.valorFinal),
        hora: new Date(v.dataVenda).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        itens: (v.itens || []).length,
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    );
  }
}

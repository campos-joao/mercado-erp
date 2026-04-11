import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    // Vendas de hoje
    const vendasHoje = await prisma.venda.findMany({
      where: {
        dataVenda: { gte: hoje },
        status: "finalizada",
      },
      include: { itens: true },
    });

    const totalVendasHoje = vendasHoje.reduce(
      (acc, v) => acc + Number(v.valorFinal),
      0
    );

    // Vendas de ontem
    const vendasOntem = await prisma.venda.findMany({
      where: {
        dataVenda: { gte: ontem, lt: hoje },
        status: "finalizada",
      },
    });

    const totalVendasOntem = vendasOntem.reduce(
      (acc, v) => acc + Number(v.valorFinal),
      0
    );

    // Ticket médio
    const ticketMedio =
      vendasHoje.length > 0 ? totalVendasHoje / vendasHoje.length : 0;

    // Total de produtos ativos
    const totalProdutos = await prisma.produto.count({
      where: { ativo: true },
    });

    // Produtos com estoque baixo
    const todosOsProdutos = await prisma.produto.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        estoqueAtual: true,
        estoqueMinimo: true,
      },
    });

    const produtosEstoqueBaixo = todosOsProdutos.filter(
      (p) => Number(p.estoqueAtual) <= Number(p.estoqueMinimo)
    );

    // NF-e pendentes
    const nfePendentes = await prisma.entradaNfe.count({
      where: { status: "pendente" },
    });

    // Últimas vendas
    const vendasRecentes = await prisma.venda.findMany({
      include: {
        itens: true,
      },
      orderBy: { dataVenda: "desc" },
      take: 5,
    });

    return NextResponse.json({
      vendasHoje: totalVendasHoje,
      vendasOntem: totalVendasOntem,
      totalVendasHoje: vendasHoje.length,
      ticketMedio,
      totalProdutos,
      estoqueBaixo: produtosEstoqueBaixo.length,
      nfePendentes,
      produtosEstoqueBaixo: produtosEstoqueBaixo.slice(0, 5),
      vendasRecentes: vendasRecentes.map((v) => ({
        id: v.id,
        numero: v.numeroVenda,
        valor: Number(v.valorFinal),
        hora: new Date(v.dataVenda).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        itens: v.itens.length,
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

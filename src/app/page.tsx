"use client";

import { useState, useEffect } from "react";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  FileText,
  DollarSign,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DashboardData {
  vendasHoje: number;
  vendasOntem: number;
  totalVendasHoje: number;
  ticketMedio: number;
  totalProdutos: number;
  estoqueBaixo: number;
  nfePendentes: number;
  produtosEstoqueBaixo: {
    id: string;
    nome: string;
    estoqueAtual: number;
    estoqueMinimo: number;
  }[];
  vendasRecentes: {
    id: string;
    numero: number;
    valor: number;
    hora: string;
    itens: number;
  }[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // silently fail, show zeros
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const stats = data || {
    vendasHoje: 0,
    vendasOntem: 0,
    totalVendasHoje: 0,
    ticketMedio: 0,
    totalProdutos: 0,
    estoqueBaixo: 0,
    nfePendentes: 0,
    produtosEstoqueBaixo: [],
    vendasRecentes: [],
  };

  const variacaoVendas =
    stats.vendasOntem > 0
      ? ((stats.vendasHoje - stats.vendasOntem) / stats.vendasOntem) * 100
      : 0;
  const vendaSubiu = variacaoVendas >= 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu mercado</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.vendasHoje)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {stats.vendasOntem > 0 ? (
                <>
                  {vendaSubiu ? (
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                  )}
                  <span className={vendaSubiu ? "text-green-600" : "text-red-600"}>
                    {variacaoVendas.toFixed(1)}%
                  </span>
                  vs ontem
                </>
              ) : (
                <span>{stats.totalVendasHoje} venda(s) hoje</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.ticketMedio)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Baseado em {stats.totalVendasHoje} venda(s) hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProdutos}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.estoqueBaixo} com estoque baixo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NF-e Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nfePendentes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/nfe" className="text-primary hover:underline">
                Processar notas →
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Atalhos rápidos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/nfe">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-blue-100 p-3">
                <FileText className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="font-semibold">Entrada de NF-e</p>
                <p className="text-sm text-muted-foreground">Upload de XML</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/produtos">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-green-100 p-3">
                <Package className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="font-semibold">Inventário</p>
                <p className="text-sm text-muted-foreground">Gerenciar produtos</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/vendas">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-orange-100 p-3">
                <TrendingUp className="h-6 w-6 text-orange-700" />
              </div>
              <div>
                <p className="font-semibold">Vendas</p>
                <p className="text-sm text-muted-foreground">Histórico e relatórios</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Alertas + Vendas recentes */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Estoque Baixo
            </CardTitle>
            <CardDescription>Produtos abaixo do estoque mínimo</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.produtosEstoqueBaixo.length > 0 ? (
              <div className="space-y-3">
                {stats.produtosEstoqueBaixo.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Mín: {Number(item.estoqueMinimo)} un
                      </p>
                    </div>
                    <Badge variant="destructive">{Number(item.estoqueAtual)} un</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum produto com estoque baixo
              </p>
            )}
            <Link href="/produtos">
              <Button variant="outline" size="sm" className="mt-4 w-full">
                Ver todos os alertas
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Vendas Recentes
            </CardTitle>
            <CardDescription>Últimas vendas realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.vendasRecentes.length > 0 ? (
              <div className="space-y-3">
                {stats.vendasRecentes.map((venda) => (
                  <div key={venda.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Venda #{venda.numero}</p>
                      <p className="text-xs text-muted-foreground">
                        {venda.hora} — {venda.itens} itens
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-green-700">
                      {formatCurrency(venda.valor)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma venda registrada ainda
              </p>
            )}
            <Link href="/vendas">
              <Button variant="outline" size="sm" className="mt-4 w-full">
                Ver todas as vendas
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

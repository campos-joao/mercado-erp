"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Calendar, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Venda {
  id: string;
  numeroVenda: number;
  dataVenda: string;
  valorTotal: number;
  valorDesconto: number;
  valorFinal: number;
  formaPagamento: string | null;
  status: string;
  itens: { id: string }[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDateTime(dateStr: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVendas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendas");
      if (!res.ok) throw new Error("Erro ao buscar vendas");
      const data = await res.json();
      setVendas(data);
    } catch (error: any) {
      toast.error("Erro ao carregar vendas", { description: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendas();
  }, [fetchVendas]);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const totalHoje = vendas
    .filter((v) => new Date(v.dataVenda) >= hoje)
    .reduce((acc, v) => acc + Number(v.valorFinal), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
          <p className="text-muted-foreground">Histórico de vendas realizadas</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={fetchVendas} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Card className="px-6 py-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Total Hoje</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(totalHoje)}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Histórico de Vendas
          </CardTitle>
          <CardDescription>Todas as vendas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Nº Venda</th>
                      <th className="p-3 text-left text-sm font-medium">Data/Hora</th>
                      <th className="p-3 text-center text-sm font-medium">Itens</th>
                      <th className="p-3 text-left text-sm font-medium">Pagamento</th>
                      <th className="p-3 text-right text-sm font-medium">Valor</th>
                      <th className="p-3 text-center text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendas.map((venda) => (
                      <tr key={venda.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-sm font-medium">#{venda.numeroVenda}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {formatDateTime(venda.dataVenda)}
                        </td>
                        <td className="p-3 text-center text-sm">{venda.itens.length}</td>
                        <td className="p-3 text-sm">{venda.formaPagamento || "—"}</td>
                        <td className="p-3 text-right text-sm font-semibold">
                          {formatCurrency(Number(venda.valorFinal))}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={venda.status === "finalizada" ? "success" : "secondary"}>
                            {venda.status === "finalizada" ? "Finalizada" : venda.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {vendas.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <ShoppingCart className="mx-auto h-10 w-10 mb-2 opacity-50" />
                    <p>Nenhuma venda registrada ainda</p>
                  </div>
                )}
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                {vendas.length} vendas exibidas
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

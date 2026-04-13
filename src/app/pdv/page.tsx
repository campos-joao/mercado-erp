"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Smartphone,
  Banknote,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface Produto {
  id: string;
  nome: string;
  ean: string | null;
  codigoBarras: string | null;
  precoVenda: number;
  estoqueAtual: number;
  unidade: string;
}

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
  desconto: number;
  subtotal: number;
}

export default function PDVPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<string>("");
  const [descontoGeral, setDescontoGeral] = useState(0);
  const [observacoes, setObservacoes] = useState("");

  const buscaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    buscaRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        buscaRef.current?.focus();
        buscaRef.current?.select();
      }
      if (e.key === "F9" && carrinho.length > 0) {
        e.preventDefault();
        finalizarVenda();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        limparCarrinho();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [carrinho]);

  const buscarProdutos = useCallback(async (termo: string) => {
    if (!termo || termo.length < 2) {
      setProdutos([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/produtos?busca=${encodeURIComponent(termo)}`);
      if (!res.ok) throw new Error("Erro ao buscar produtos");
      const data = await res.json();
      setProdutos(data.slice(0, 10));
    } catch (error: any) {
      toast.error("Erro ao buscar produtos", { description: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      buscarProdutos(busca);
    }, 300);

    return () => clearTimeout(timer);
  }, [busca, buscarProdutos]);

  function adicionarAoCarrinho(produto: Produto) {
    const itemExistente = carrinho.find((item) => item.produto.id === produto.id);

    if (itemExistente) {
      setCarrinho(
        carrinho.map((item) =>
          item.produto.id === produto.id
            ? {
                ...item,
                quantidade: item.quantidade + 1,
                subtotal: (item.quantidade + 1) * Number(produto.precoVenda) - item.desconto,
              }
            : item
        )
      );
    } else {
      setCarrinho([
        ...carrinho,
        {
          produto,
          quantidade: 1,
          desconto: 0,
          subtotal: Number(produto.precoVenda),
        },
      ]);
    }

    setBusca("");
    setProdutos([]);
    buscaRef.current?.focus();
    toast.success("Produto adicionado", { description: produto.nome });
  }

  function alterarQuantidade(produtoId: string, delta: number) {
    setCarrinho(
      carrinho
        .map((item) => {
          if (item.produto.id === produtoId) {
            const novaQtd = item.quantidade + delta;
            if (novaQtd <= 0) return null;
            return {
              ...item,
              quantidade: novaQtd,
              subtotal: novaQtd * Number(item.produto.precoVenda) - item.desconto,
            };
          }
          return item;
        })
        .filter(Boolean) as ItemCarrinho[]
    );
  }

  function removerItem(produtoId: string) {
    setCarrinho(carrinho.filter((item) => item.produto.id !== produtoId));
  }

  function limparCarrinho() {
    setCarrinho([]);
    setFormaPagamento("");
    setDescontoGeral(0);
    setObservacoes("");
    setBusca("");
    setProdutos([]);
    buscaRef.current?.focus();
  }

  async function finalizarVenda() {
    if (carrinho.length === 0) {
      toast.error("Carrinho vazio", { description: "Adicione produtos antes de finalizar" });
      return;
    }

    if (!formaPagamento) {
      toast.error("Forma de pagamento obrigatória");
      return;
    }

    setFinalizando(true);

    try {
      const itens = carrinho.map((item) => ({
        produtoId: item.produto.id,
        quantidade: item.quantidade,
        desconto: item.desconto,
      }));

      const res = await fetch("/api/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens,
          formaPagamento,
          valorDesconto: descontoGeral,
          observacoes: observacoes || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao finalizar venda");
      }

      const venda = await res.json();

      toast.success("Venda finalizada!", {
        description: `Venda #${venda.numeroVenda} - ${formatCurrency(venda.valorFinal)}`,
      });

      limparCarrinho();
    } catch (error: any) {
      toast.error("Erro ao finalizar venda", { description: error.message });
    } finally {
      setFinalizando(false);
    }
  }

  const valorTotal = carrinho.reduce((acc, item) => acc + item.subtotal, 0);
  const valorFinal = valorTotal - descontoGeral;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PDV — Ponto de Venda</h1>
          <p className="text-muted-foreground">Registre vendas rapidamente</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm">
            F2 — Buscar
          </Badge>
          <Badge variant="outline" className="text-sm">
            F9 — Finalizar
          </Badge>
          <Badge variant="outline" className="text-sm">
            ESC — Limpar
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Busca e Produtos */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={buscaRef}
                  placeholder="Digite nome, EAN ou código de barras... (F2)"
                  className="pl-10 text-lg font-mono"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  autoFocus
                />
              </div>

              {loading && (
                <div className="mt-4 flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {!loading && produtos.length > 0 && (
                <div className="mt-4 space-y-2">
                  {produtos.map((produto) => (
                    <div
                      key={produto.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => adicionarAoCarrinho(produto)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{produto.nome}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          {produto.ean && <span>EAN: {produto.ean}</span>}
                          <span>Estoque: {produto.estoqueAtual} {produto.unidade}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-700">
                          {formatCurrency(Number(produto.precoVenda))}
                        </p>
                        <Button size="sm" variant="ghost" className="mt-1">
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Carrinho */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrinho ({carrinho.length} {carrinho.length === 1 ? "item" : "itens"})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {carrinho.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Carrinho vazio</p>
                  <p className="text-sm">Busque e adicione produtos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {carrinho.map((item) => (
                    <div
                      key={item.produto.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.produto.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(Number(item.produto.precoVenda))} / {item.produto.unidade}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => alterarQuantidade(item.produto.id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-bold">{item.quantidade}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => alterarQuantidade(item.produto.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="font-bold">{formatCurrency(item.subtotal)}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removerItem(item.produto.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Resumo e Finalização */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(valorTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Desconto</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={descontoGeral}
                    onChange={(e) => setDescontoGeral(Number(e.target.value) || 0)}
                    className="w-24 h-7 text-right"
                  />
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-bold text-green-700">
                    {formatCurrency(valorFinal)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Forma de Pagamento *</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dinheiro">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Dinheiro
                      </div>
                    </SelectItem>
                    <SelectItem value="Débito">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Débito
                      </div>
                    </SelectItem>
                    <SelectItem value="Crédito">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Crédito
                      </div>
                    </SelectItem>
                    <SelectItem value="PIX">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        PIX
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Input
                  placeholder="Ex: Cliente solicitou nota..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>

              <div className="space-y-2 pt-4">
                <Button
                  className="w-full h-12 text-lg"
                  size="lg"
                  onClick={finalizarVenda}
                  disabled={carrinho.length === 0 || !formaPagamento || finalizando}
                >
                  {finalizando ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Finalizar Venda (F9)
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={limparCarrinho}
                  disabled={finalizando}
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpar Carrinho (ESC)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Plus, Filter, Package, Edit, Trash2, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ProdutoFormDialog } from "@/components/produto-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Produto {
  id: string;
  nome: string;
  ean: string | null;
  codigoBarras: string | null;
  categoria: string | null;
  precoCusto: number;
  precoVenda: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  unidade: string;
  descricao: string | null;
  ncm: string | null;
  fornecedorId: string | null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroEstoque, setFiltroEstoque] = useState<"todos" | "baixo">("todos");
  const inputRef = useRef<HTMLInputElement>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [produtoDeletando, setProdutoDeletando] = useState<Produto | null>(null);

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busca) params.set("busca", busca);
      if (filtroEstoque === "baixo") params.set("estoqueBaixo", "true");

      const res = await fetch(`/api/produtos?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar produtos");
      const data = await res.json();
      setProdutos(data);
    } catch (error: any) {
      toast.error("Erro ao carregar produtos", { description: error.message });
    } finally {
      setLoading(false);
    }
  }, [busca, filtroEstoque]);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  useEffect(() => {
    inputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleEditar(produto: Produto) {
    setProdutoEditando(produto);
    setFormOpen(true);
  }

  function handleNovo() {
    setProdutoEditando(null);
    setFormOpen(true);
  }

  function handleDeletar(produto: Produto) {
    setProdutoDeletando(produto);
    setDeleteOpen(true);
  }

  async function confirmarDelete() {
    if (!produtoDeletando) return;
    try {
      const res = await fetch(`/api/produtos/${produtoDeletando.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir produto");
      toast.success("Produto excluído!", { description: produtoDeletando.nome });
      fetchProdutos();
    } catch (error: any) {
      toast.error("Erro ao excluir", { description: error.message });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie o inventário do seu mercado
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchProdutos} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={handleNovo}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Buscar por nome, EAN ou categoria... (F2)"
                className="pl-10 font-mono"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filtroEstoque === "todos" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroEstoque("todos")}
              >
                Todos
              </Button>
              <Button
                variant={filtroEstoque === "baixo" ? "destructive" : "outline"}
                size="sm"
                onClick={() => setFiltroEstoque("baixo")}
              >
                <Filter className="mr-1 h-3 w-3" />
                Estoque Baixo
              </Button>
            </div>
          </div>
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
                      <th className="p-3 text-left text-sm font-medium">Produto</th>
                      <th className="p-3 text-left text-sm font-medium">EAN</th>
                      <th className="p-3 text-left text-sm font-medium">Categoria</th>
                      <th className="p-3 text-right text-sm font-medium">Custo</th>
                      <th className="p-3 text-right text-sm font-medium">Venda</th>
                      <th className="p-3 text-right text-sm font-medium">Margem</th>
                      <th className="p-3 text-center text-sm font-medium">Estoque</th>
                      <th className="p-3 text-center text-sm font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.map((produto) => {
                      const custo = Number(produto.precoCusto);
                      const venda = Number(produto.precoVenda);
                      const margem = custo > 0 ? (((venda - custo) / custo) * 100).toFixed(1) : "0.0";
                      const estoqueAtual = Number(produto.estoqueAtual);
                      const estoqueMinimo = Number(produto.estoqueMinimo);
                      const estoqueBaixo = estoqueAtual <= estoqueMinimo;

                      return (
                        <tr key={produto.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{produto.nome}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {produto.ean || "—"}
                            </code>
                          </td>
                          <td className="p-3 text-sm">{produto.categoria || "—"}</td>
                          <td className="p-3 text-right text-sm">{formatCurrency(custo)}</td>
                          <td className="p-3 text-right text-sm font-medium">{formatCurrency(venda)}</td>
                          <td className="p-3 text-right">
                            <Badge variant="success">{margem}%</Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={estoqueBaixo ? "destructive" : "secondary"}>
                              {estoqueAtual} {produto.unidade}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditar(produto)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeletar(produto)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {produtos.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <Package className="mx-auto h-10 w-10 mb-2 opacity-50" />
                    <p>Nenhum produto encontrado</p>
                    <Button variant="link" onClick={handleNovo} className="mt-2">
                      Cadastrar primeiro produto
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                {produtos.length} produtos exibidos
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ProdutoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        produto={produtoEditando}
        onSuccess={fetchProdutos}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir Produto"
        description={`Tem certeza que deseja excluir "${produtoDeletando?.nome}"? O produto será desativado.`}
        onConfirm={confirmarDelete}
      />
    </div>
  );
}

"use client";

import { Users, Plus, Search, Edit, Trash2, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FornecedorFormDialog } from "@/components/fornecedor-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatCNPJ } from "@/lib/utils";

interface Fornecedor {
  id: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  inscricaoEstadual: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  ativo: boolean;
}

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [fornecedorEditando, setFornecedorEditando] = useState<Fornecedor | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [fornecedorDeletando, setFornecedorDeletando] = useState<Fornecedor | null>(null);

  const fetchFornecedores = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busca) params.set("busca", busca);

      const res = await fetch(`/api/fornecedores?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar fornecedores");
      const data = await res.json();
      setFornecedores(data);
    } catch (error: any) {
      toast.error("Erro ao carregar fornecedores", { description: error.message });
    } finally {
      setLoading(false);
    }
  }, [busca]);

  useEffect(() => {
    fetchFornecedores();
  }, [fetchFornecedores]);

  function handleNovo() {
    setFornecedorEditando(null);
    setFormOpen(true);
  }

  function handleEditar(fornecedor: Fornecedor) {
    setFornecedorEditando(fornecedor);
    setFormOpen(true);
  }

  function handleDeletar(fornecedor: Fornecedor) {
    setFornecedorDeletando(fornecedor);
    setDeleteOpen(true);
  }

  async function confirmarDelete() {
    if (!fornecedorDeletando) return;
    try {
      const res = await fetch(`/api/fornecedores/${fornecedorDeletando.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir fornecedor");
      toast.success("Fornecedor desativado!", { description: fornecedorDeletando.razaoSocial });
      fetchFornecedores();
    } catch (error: any) {
      toast.error("Erro ao excluir", { description: error.message });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie seus fornecedores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchFornecedores} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={handleNovo}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Fornecedor
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por razão social ou CNPJ..."
              className="pl-10"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
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
                      <th className="p-3 text-left text-sm font-medium">Razão Social</th>
                      <th className="p-3 text-left text-sm font-medium">CNPJ</th>
                      <th className="p-3 text-left text-sm font-medium">Cidade/UF</th>
                      <th className="p-3 text-left text-sm font-medium">Telefone</th>
                      <th className="p-3 text-center text-sm font-medium">Status</th>
                      <th className="p-3 text-center text-sm font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fornecedores.map((f) => (
                      <tr key={f.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{f.razaoSocial}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {formatCNPJ(f.cnpj)}
                          </code>
                        </td>
                        <td className="p-3 text-sm">
                          {f.cidade && f.uf ? `${f.cidade}/${f.uf}` : "—"}
                        </td>
                        <td className="p-3 text-sm">{f.telefone || "—"}</td>
                        <td className="p-3 text-center">
                          <Badge variant={f.ativo ? "success" : "secondary"}>
                            {f.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditar(f)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeletar(f)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {fornecedores.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="mx-auto h-10 w-10 mb-2 opacity-50" />
                    <p>Nenhum fornecedor cadastrado</p>
                    <Button variant="link" onClick={handleNovo} className="mt-2">
                      Cadastrar primeiro fornecedor
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                {fornecedores.length} fornecedores
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <FornecedorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        fornecedor={fornecedorEditando}
        onSuccess={fetchFornecedores}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Desativar Fornecedor"
        description={`Tem certeza que deseja desativar "${fornecedorDeletando?.razaoSocial}"?`}
        onConfirm={confirmarDelete}
      />
    </div>
  );
}

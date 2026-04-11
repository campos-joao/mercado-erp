"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Fornecedor {
  id: string;
  razaoSocial: string;
}

interface ProdutoData {
  id?: string;
  nome: string;
  descricao?: string | null;
  codigoBarras?: string | null;
  ean?: string | null;
  ncm?: string | null;
  unidade: string;
  precoCusto: number;
  precoVenda: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  fornecedorId?: string | null;
  categoria?: string | null;
}

interface FormState {
  nome: string;
  descricao: string;
  codigoBarras: string;
  ean: string;
  ncm: string;
  unidade: string;
  precoCusto: number;
  precoVenda: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  fornecedorId: string | null;
  categoria: string;
}

interface ProdutoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto?: ProdutoData | null;
  onSuccess: () => void;
}

const categorias = [
  "Bebidas",
  "Grãos",
  "Mercearia",
  "Laticínios",
  "Massas",
  "Limpeza",
  "Higiene",
  "Frios",
  "Hortifruti",
  "Padaria",
  "Outros",
];

export function ProdutoFormDialog({
  open,
  onOpenChange,
  produto,
  onSuccess,
}: ProdutoFormDialogProps) {
  const isEditing = !!produto?.id;
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  const [form, setForm] = useState<FormState>({
    nome: "",
    descricao: "",
    codigoBarras: "",
    ean: "",
    ncm: "",
    unidade: "UN",
    precoCusto: 0,
    precoVenda: 0,
    estoqueAtual: 0,
    estoqueMinimo: 0,
    fornecedorId: null,
    categoria: "",
  });

  useEffect(() => {
    if (open) {
      fetchFornecedores();
      if (produto) {
        setForm({
          nome: produto.nome ?? "",
          descricao: produto.descricao ?? "",
          codigoBarras: produto.codigoBarras ?? "",
          ean: produto.ean ?? "",
          ncm: produto.ncm ?? "",
          unidade: produto.unidade ?? "UN",
          precoCusto: Number(produto.precoCusto) || 0,
          precoVenda: Number(produto.precoVenda) || 0,
          estoqueAtual: Number(produto.estoqueAtual) || 0,
          estoqueMinimo: Number(produto.estoqueMinimo) || 0,
          fornecedorId: produto.fornecedorId ?? null,
          categoria: produto.categoria ?? "",
        });
      } else {
        setForm({
          nome: "",
          descricao: "",
          codigoBarras: "",
          ean: "",
          ncm: "",
          unidade: "UN",
          precoCusto: 0,
          precoVenda: 0,
          estoqueAtual: 0,
          estoqueMinimo: 0,
          fornecedorId: null,
          categoria: "",
        });
      }
    }
  }, [open, produto]);

  async function fetchFornecedores() {
    try {
      const res = await fetch("/api/fornecedores");
      if (res.ok) {
        const data = await res.json();
        setFornecedores(data);
      }
    } catch {
      // silently fail
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditing ? `/api/produtos/${produto!.id}` : "/api/produtos";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar produto");
      }

      toast.success(isEditing ? "Produto atualizado!" : "Produto criado!", {
        description: form.nome,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao salvar produto", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados do produto"
              : "Preencha os dados para cadastrar um novo produto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => updateField("nome", e.target.value)}
                placeholder="Ex: Cerveja Skol 350ml"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ean">EAN / Código de Barras</Label>
              <Input
                id="ean"
                value={form.ean}
                onChange={(e) => updateField("ean", e.target.value)}
                placeholder="7891149101009"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigoBarras">Código Interno</Label>
              <Input
                id="codigoBarras"
                value={form.codigoBarras}
                onChange={(e) => updateField("codigoBarras", e.target.value)}
                placeholder="001234"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ncm">NCM</Label>
              <Input
                id="ncm"
                value={form.ncm}
                onChange={(e) => updateField("ncm", e.target.value)}
                placeholder="22030000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Select
                value={form.unidade}
                onValueChange={(v) => updateField("unidade", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UN">UN - Unidade</SelectItem>
                  <SelectItem value="KG">KG - Quilograma</SelectItem>
                  <SelectItem value="L">L - Litro</SelectItem>
                  <SelectItem value="CX">CX - Caixa</SelectItem>
                  <SelectItem value="PC">PC - Pacote</SelectItem>
                  <SelectItem value="FD">FD - Fardo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="precoCusto">Preço de Custo (R$) *</Label>
              <Input
                id="precoCusto"
                type="number"
                step="0.01"
                min="0"
                value={form.precoCusto}
                onChange={(e) =>
                  updateField("precoCusto", parseFloat(e.target.value) || 0)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="precoVenda">Preço de Venda (R$) *</Label>
              <Input
                id="precoVenda"
                type="number"
                step="0.01"
                min="0"
                value={form.precoVenda}
                onChange={(e) =>
                  updateField("precoVenda", parseFloat(e.target.value) || 0)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estoqueAtual">Estoque Atual</Label>
              <Input
                id="estoqueAtual"
                type="number"
                step="0.001"
                min="0"
                value={form.estoqueAtual}
                onChange={(e) =>
                  updateField("estoqueAtual", parseFloat(e.target.value) || 0)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
              <Input
                id="estoqueMinimo"
                type="number"
                step="0.001"
                min="0"
                value={form.estoqueMinimo}
                onChange={(e) =>
                  updateField("estoqueMinimo", parseFloat(e.target.value) || 0)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={form.categoria || ""}
                onValueChange={(v) => updateField("categoria", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Select
                value={form.fornecedorId || ""}
                onValueChange={(v) =>
                  updateField("fornecedorId", v === "none" ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {fornecedores.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.razaoSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={form.descricao}
                onChange={(e) => updateField("descricao", e.target.value)}
                placeholder="Descrição opcional do produto"
              />
            </div>
          </div>

          {form.precoCusto > 0 && form.precoVenda > 0 && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <strong>Margem de lucro:</strong>{" "}
              {(
                ((form.precoVenda - form.precoCusto) / form.precoCusto) *
                100
              ).toFixed(1)}
              %
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar Alterações" : "Cadastrar Produto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

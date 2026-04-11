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

interface FornecedorData {
  id?: string;
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj: string;
  inscricaoEstadual?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
}

interface FormState {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
}

interface FornecedorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedor?: FornecedorData | null;
  onSuccess: () => void;
}

const ufs = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export function FornecedorFormDialog({
  open,
  onOpenChange,
  fornecedor,
  onSuccess,
}: FornecedorFormDialogProps) {
  const isEditing = !!fornecedor?.id;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormState>({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    inscricaoEstadual: "",
    telefone: "",
    email: "",
    endereco: "",
    cidade: "",
    uf: "",
    cep: "",
  });

  useEffect(() => {
    if (open) {
      if (fornecedor) {
        setForm({
          razaoSocial: fornecedor.razaoSocial ?? "",
          nomeFantasia: fornecedor.nomeFantasia ?? "",
          cnpj: fornecedor.cnpj ?? "",
          inscricaoEstadual: fornecedor.inscricaoEstadual ?? "",
          telefone: fornecedor.telefone ?? "",
          email: fornecedor.email ?? "",
          endereco: fornecedor.endereco ?? "",
          cidade: fornecedor.cidade ?? "",
          uf: fornecedor.uf ?? "",
          cep: fornecedor.cep ?? "",
        });
      } else {
        setForm({
          razaoSocial: "",
          nomeFantasia: "",
          cnpj: "",
          inscricaoEstadual: "",
          telefone: "",
          email: "",
          endereco: "",
          cidade: "",
          uf: "",
          cep: "",
        });
      }
    }
  }, [open, fornecedor]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditing
        ? `/api/fornecedores/${fornecedor!.id}`
        : "/api/fornecedores";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar fornecedor");
      }

      toast.success(
        isEditing ? "Fornecedor atualizado!" : "Fornecedor cadastrado!",
        { description: form.razaoSocial }
      );
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao salvar fornecedor", {
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
            {isEditing ? "Editar Fornecedor" : "Novo Fornecedor"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados do fornecedor"
              : "Preencha os dados para cadastrar um novo fornecedor"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="razaoSocial">Razão Social *</Label>
              <Input
                id="razaoSocial"
                value={form.razaoSocial}
                onChange={(e) => updateField("razaoSocial", e.target.value)}
                placeholder="Ex: Ambev S.A."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
              <Input
                id="nomeFantasia"
                value={form.nomeFantasia}
                onChange={(e) => updateField("nomeFantasia", e.target.value)}
                placeholder="Ex: Ambev"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={form.cnpj}
                onChange={(e) => updateField("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
                className="font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
              <Input
                id="inscricaoEstadual"
                value={form.inscricaoEstadual}
                onChange={(e) =>
                  updateField("inscricaoEstadual", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={(e) => updateField("telefone", e.target.value)}
                placeholder="(11) 9999-9999"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="contato@fornecedor.com.br"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={form.endereco}
                onChange={(e) => updateField("endereco", e.target.value)}
                placeholder="Rua, número, bairro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={form.cidade}
                onChange={(e) => updateField("cidade", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <Select
                value={form.uf || ""}
                onValueChange={(v) => updateField("uf", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {ufs.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={form.cep}
                onChange={(e) => updateField("cep", e.target.value)}
                placeholder="00000-000"
                className="font-mono"
              />
            </div>
          </div>

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
              {isEditing ? "Salvar Alterações" : "Cadastrar Fornecedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

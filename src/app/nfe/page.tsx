"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Package,
  ArrowRight,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { parseNFeXML, type NFeData } from "@/lib/nfe-parser";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function NfePage() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [nfeData, setNfeData] = useState<NFeData | null>(null);
  const [salvaComSucesso, setSalvaComSucesso] = useState(false);

  const processarXML = useCallback(async (file: File) => {
    if (!file.name.endsWith(".xml")) {
      toast.error("Arquivo inválido", {
        description: "Por favor, envie um arquivo XML de NF-e.",
      });
      return;
    }

    setLoading(true);
    setSalvaComSucesso(false);
    try {
      const text = await file.text();
      const data = parseNFeXML(text);
      setNfeData(data);
      toast.success("XML processado com sucesso!", {
        description: `NF-e ${data.numero} — ${data.itens.length} itens encontrados`,
      });
    } catch (error) {
      toast.error("Erro ao processar XML", {
        description: "Verifique se o arquivo é um XML de NF-e válido.",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processarXML(file);
    },
    [processarXML]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processarXML(file);
    },
    [processarXML]
  );

  async function confirmarEntrada() {
    if (!nfeData) return;
    setSalvando(true);

    try {
      const res = await fetch("/api/nfe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nfe: nfeData, confirmar: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar NF-e");
      }

      toast.success("Entrada confirmada!", {
        description: `NF-e ${nfeData.numero} salva com sucesso. Estoque atualizado para itens mapeados.`,
      });
      setSalvaComSucesso(true);
    } catch (error: any) {
      toast.error("Erro ao confirmar entrada", {
        description: error.message,
      });
    } finally {
      setSalvando(false);
    }
  }

  async function salvarPendente() {
    if (!nfeData) return;
    setSalvando(true);

    try {
      const res = await fetch("/api/nfe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nfe: nfeData, confirmar: false }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar NF-e");
      }

      toast.success("NF-e salva como pendente!", {
        description: `NF-e ${nfeData.numero} salva. Você pode confirmá-la depois.`,
      });
      setSalvaComSucesso(true);
    } catch (error: any) {
      toast.error("Erro ao salvar NF-e", {
        description: error.message,
      });
    } finally {
      setSalvando(false);
    }
  }

  function novaImportacao() {
    setNfeData(null);
    setSalvaComSucesso(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Entrada de NF-e</h1>
        <p className="text-muted-foreground">
          Faça upload do XML da Nota Fiscal para entrada automática no estoque
        </p>
      </div>

      {/* Área de Upload */}
      {!salvaComSucesso && (
        <Card>
          <CardContent className="pt-6">
            <div
              className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {loading ? (
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              ) : (
                <Upload className="h-12 w-12 text-muted-foreground" />
              )}
              <p className="mt-4 text-lg font-medium">
                {loading
                  ? "Processando XML..."
                  : "Arraste o arquivo XML aqui"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                ou clique para selecionar
              </p>
              <input
                type="file"
                accept=".xml"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={handleFileInput}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sucesso */}
      {salvaComSucesso && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <h2 className="text-xl font-bold text-green-700">Entrada Registrada!</h2>
            <p className="text-muted-foreground mt-1">
              A NF-e foi processada e salva no sistema.
            </p>
            <Button onClick={novaImportacao} className="mt-6">
              <RotateCcw className="mr-2 h-4 w-4" />
              Importar Outra NF-e
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Resultado do processamento */}
      {nfeData && !salvaComSucesso && (
        <>
          {/* Info da NF-e */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Nota Fiscal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">Nº {nfeData.numero}</p>
                <p className="text-sm text-muted-foreground">
                  Série {nfeData.serie}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Fornecedor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold truncate">
                  {nfeData.fornecedor.razaoSocial}
                </p>
                <p className="text-sm text-muted-foreground">
                  CNPJ: {nfeData.fornecedor.cnpj}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Valor Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(nfeData.valorTotal)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {nfeData.itens.length} itens
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de itens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens da Nota
              </CardTitle>
              <CardDescription>
                Revise os itens antes de confirmar a entrada no estoque.
                O mapeamento automático por IA será feito nesta etapa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Produto (XML)</th>
                      <th className="p-3 text-left text-sm font-medium">EAN</th>
                      <th className="p-3 text-left text-sm font-medium">NCM</th>
                      <th className="p-3 text-center text-sm font-medium">Qtd</th>
                      <th className="p-3 text-center text-sm font-medium">Unid</th>
                      <th className="p-3 text-right text-sm font-medium">Vl. Unit.</th>
                      <th className="p-3 text-right text-sm font-medium">Vl. Total</th>
                      <th className="p-3 text-center text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nfeData.itens.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div>
                            <p className="text-sm font-medium">{item.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              Cód: {item.codigo}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {item.ean || "—"}
                          </code>
                        </td>
                        <td className="p-3 text-sm">{item.ncm || "—"}</td>
                        <td className="p-3 text-center text-sm">{item.quantidade}</td>
                        <td className="p-3 text-center text-sm">{item.unidade}</td>
                        <td className="p-3 text-right text-sm">
                          {formatCurrency(item.valorUnitario)}
                        </td>
                        <td className="p-3 text-right text-sm font-medium">
                          {formatCurrency(item.valorTotal)}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="warning">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            De-para
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground max-w-md">
                  <AlertCircle className="inline mr-1 h-4 w-4 text-yellow-600" />
                  Itens com EAN serão mapeados automaticamente. Os demais ficam como
                  &quot;De-para&quot; pendente para mapeamento por IA.
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={salvarPendente}
                    disabled={salvando}
                  >
                    {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <FileText className="mr-2 h-4 w-4" />
                    Salvar Pendente
                  </Button>
                  <Button
                    size="lg"
                    onClick={confirmarEntrada}
                    disabled={salvando}
                  >
                    {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmar Entrada
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

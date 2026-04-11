import { z } from "zod";

export const produtoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  descricao: z.string().optional(),
  codigoBarras: z.string().optional(),
  ean: z.string().max(14, "EAN deve ter no máximo 14 caracteres").optional(),
  ncm: z.string().max(10, "NCM deve ter no máximo 10 caracteres").optional(),
  unidade: z.string().default("UN"),
  precoCusto: z.coerce.number().min(0, "Preço de custo deve ser positivo"),
  precoVenda: z.coerce.number().min(0, "Preço de venda deve ser positivo"),
  estoqueAtual: z.coerce.number().min(0, "Estoque não pode ser negativo"),
  estoqueMinimo: z.coerce.number().min(0, "Estoque mínimo não pode ser negativo"),
  fornecedorId: z.string().uuid().optional().nullable(),
  categoria: z.string().optional(),
});

export const fornecedorSchema = z.object({
  razaoSocial: z.string().min(2, "Razão social é obrigatória"),
  nomeFantasia: z.string().optional(),
  cnpj: z
    .string()
    .min(14, "CNPJ inválido")
    .regex(/^(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{14})$/, "CNPJ inválido"),
  inscricaoEstadual: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2).optional(),
  cep: z.string().optional(),
});

export type ProdutoFormData = z.infer<typeof produtoSchema>;
export type FornecedorFormData = z.infer<typeof fornecedorSchema>;

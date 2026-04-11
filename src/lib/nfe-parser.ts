import { XMLParser } from "fast-xml-parser";

export interface NFeItem {
  nome: string;
  codigo: string;
  ean: string;
  ncm: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
}

export interface NFeData {
  numero: string;
  serie: string;
  chaveAcesso: string;
  dataEmissao: string;
  fornecedor: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string;
    inscricaoEstadual: string;
    endereco: string;
    cidade: string;
    uf: string;
  };
  itens: NFeItem[];
  valorTotal: number;
  valorIcms: number;
  valorIpi: number;
}

export function parseNFeXML(xmlContent: string): NFeData {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
  });

  const parsed = parser.parse(xmlContent);

  const nfeProc = parsed.nfeProc || parsed;
  const nfe = nfeProc.NFe || nfeProc;
  const infNFe = nfe.infNFe || nfe;

  const ide = infNFe.ide || {};
  const emit = infNFe.emit || {};
  const enderEmit = emit.enderEmit || {};
  const total = infNFe.total?.ICMSTot || {};

  const det = infNFe.det;
  const detArray = Array.isArray(det) ? det : det ? [det] : [];

  const itens: NFeItem[] = detArray.map((item: any) => {
    const prod = item.prod || {};
    return {
      nome: prod.xProd || "",
      codigo: prod.cProd || "",
      ean: prod.cEAN || prod.cEANTrib || "",
      ncm: prod.NCM || "",
      quantidade: parseFloat(prod.qCom) || 0,
      unidade: prod.uCom || "UN",
      valorUnitario: parseFloat(prod.vUnCom) || 0,
      valorTotal: parseFloat(prod.vProd) || 0,
    };
  });

  return {
    numero: String(ide.nNF || ""),
    serie: String(ide.serie || ""),
    chaveAcesso: infNFe["@_Id"]?.replace("NFe", "") || "",
    dataEmissao: ide.dhEmi || ide.dEmi || "",
    fornecedor: {
      cnpj: emit.CNPJ || "",
      razaoSocial: emit.xNome || "",
      nomeFantasia: emit.xFant || "",
      inscricaoEstadual: emit.IE || "",
      endereco: `${enderEmit.xLgr || ""}, ${enderEmit.nro || ""}`,
      cidade: enderEmit.xMun || "",
      uf: enderEmit.UF || "",
    },
    itens,
    valorTotal: parseFloat(total.vNF) || 0,
    valorIcms: parseFloat(total.vICMS) || 0,
    valorIpi: parseFloat(total.vIPI) || 0,
  };
}

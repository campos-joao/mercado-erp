import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  try {
    const snapshot = await db
      .collection("entradas_nfe")
      .orderBy("dataEntrada", "desc")
      .get();

    const entradas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(entradas);
  } catch (error) {
    console.error("Erro ao buscar entradas NF-e:", error);
    return NextResponse.json(
      { error: "Erro ao buscar entradas NF-e" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nfe, confirmar } = body;

    if (!nfe) {
      return NextResponse.json(
        { error: "Dados da NF-e não fornecidos" },
        { status: 400 }
      );
    }

    // Verificar se a NF-e já foi importada pela chave de acesso
    if (nfe.chaveAcesso) {
      const existente = await db
        .collection("entradas_nfe")
        .where("chaveAcesso", "==", nfe.chaveAcesso)
        .limit(1)
        .get();

      if (!existente.empty) {
        const doc = existente.docs[0];
        return NextResponse.json(
          { error: "Esta NF-e já foi importada anteriormente", existente: { id: doc.id, ...doc.data() } },
          { status: 409 }
        );
      }
    }

    // Buscar ou criar fornecedor pelo CNPJ
    const cnpj = nfe.fornecedor.cnpj;
    const fornecedorSnap = await db
      .collection("fornecedores")
      .where("cnpj", "==", cnpj)
      .limit(1)
      .get();

    let fornecedorId: string;
    if (fornecedorSnap.empty) {
      const now = new Date().toISOString();
      const novoFornecedor = {
        cnpj,
        razaoSocial: nfe.fornecedor.razaoSocial,
        nomeFantasia: nfe.fornecedor.nomeFantasia || null,
        inscricaoEstadual: nfe.fornecedor.inscricaoEstadual || null,
        endereco: nfe.fornecedor.endereco || null,
        cidade: nfe.fornecedor.cidade || null,
        uf: nfe.fornecedor.uf || null,
        telefone: null,
        email: null,
        cep: null,
        ativo: true,
        criadoEm: now,
        atualizadoEm: now,
      };
      const ref = await db.collection("fornecedores").add(novoFornecedor);
      fornecedorId = ref.id;
    } else {
      fornecedorId = fornecedorSnap.docs[0].id;
    }

    // Processar itens da NF-e
    const itensProcessados: any[] = [];

    for (const item of nfe.itens) {
      let produtoId: string | null = null;
      let mapeamentoStatus = "pendente";

      // Tentar encontrar produto pelo EAN
      if (item.ean) {
        const produtoSnap = await db
          .collection("produtos")
          .where("ean", "==", item.ean)
          .where("ativo", "==", true)
          .limit(1)
          .get();

        if (!produtoSnap.empty) {
          const prodDoc = produtoSnap.docs[0];
          produtoId = prodDoc.id;
          mapeamentoStatus = "mapeado";

          if (confirmar) {
            await db.collection("produtos").doc(prodDoc.id).update({
              estoqueAtual: FieldValue.increment(item.quantidade),
              precoCusto: item.valorUnitario,
              atualizadoEm: new Date().toISOString(),
            });
          }
        }
      }

      // Verificar mapeamento existente
      if (!produtoId) {
        const mapeamentoSnap = await db
          .collection("mapeamento_produtos")
          .where("nomeFornecedor", "==", item.nome)
          .where("fornecedorId", "==", fornecedorId)
          .where("confirmado", "==", true)
          .limit(1)
          .get();

        if (!mapeamentoSnap.empty) {
          const mapeamento = mapeamentoSnap.docs[0].data();
          if (mapeamento.produtoId) {
            produtoId = mapeamento.produtoId;
            mapeamentoStatus = "mapeado";

            if (confirmar) {
              await db.collection("produtos").doc(mapeamento.produtoId).update({
                estoqueAtual: FieldValue.increment(item.quantidade),
                precoCusto: item.valorUnitario,
                atualizadoEm: new Date().toISOString(),
              });
            }
          }
        }
      }

      itensProcessados.push({
        produtoId,
        nomeXml: item.nome,
        codigoXml: item.codigo || null,
        eanXml: item.ean || null,
        ncmXml: item.ncm || null,
        quantidade: item.quantidade,
        unidadeXml: item.unidade || null,
        valorUnitario: item.valorUnitario || null,
        valorTotal: item.valorTotal || null,
        mapeamentoStatus,
      });
    }

    // Criar a entrada da NF-e com itens embutidos
    const now = new Date().toISOString();
    const entradaData = {
      numeroNfe: nfe.numero,
      serie: nfe.serie || null,
      chaveAcesso: nfe.chaveAcesso || null,
      fornecedorId,
      dataEmissao: nfe.dataEmissao || null,
      dataEntrada: now,
      valorTotal: nfe.valorTotal || 0,
      valorIcms: nfe.valorIcms || 0,
      valorIpi: nfe.valorIpi || 0,
      status: confirmar ? "processada" : "pendente",
      itens: itensProcessados,
      criadoEm: now,
      atualizadoEm: now,
    };

    const docRef = await db.collection("entradas_nfe").add(entradaData);

    return NextResponse.json({ id: docRef.id, ...entradaData }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao processar NF-e:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar NF-e" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { logContractEvent } from "@/lib/db";

/**
 * POST /api/contract
 * Recebe o formulário completo de contratação, grava no MySQL (log form_submitted)
 * e retorna o contractId para redirecionar ao pagamento.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      nome,
      cpf,
      endereco,
      whatsapp,
      email,
      locais,
      qtd_locais,
      fidelidade_anos,
      plano,
      valor_base_unitario,
      valor_mensal_total,
      resumo,
    } = body;

    if (!nome || !cpf || !email || !whatsapp || !endereco) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome, cpf, email, whatsapp, endereco" },
        { status: 400 }
      );
    }
    if (!locais || !plano || valor_mensal_total == null) {
      return NextResponse.json(
        { error: "Informe locais, plano e valor_mensal_total" },
        { status: 400 }
      );
    }

    const payload = {
      nome: String(nome).trim(),
      cpf: String(cpf).replace(/\D/g, ""),
      endereco: String(endereco).trim(),
      whatsapp: String(whatsapp).replace(/\D/g, ""),
      email: String(email).trim(),
      locais: typeof locais === "string" ? locais : Array.isArray(locais) ? locais.join(" | ") : String(locais),
      qtd_locais: Number(qtd_locais) || 0,
      fidelidade_anos: Number(fidelidade_anos) || 0,
      plano: String(plano),
      valor_base_unitario: Number(valor_base_unitario) || 0,
      valor_mensal_total: Number(valor_mensal_total) || 0,
      resumo: resumo ?? "",
      timestamp: new Date().toISOString(),
    };

    const contractId = await logContractEvent("form_submitted", payload);

    return NextResponse.json({
      contractId,
      redirectTo: `/pagamento?c=${contractId}`,
    });
  } catch (err) {
    console.error("[POST /api/contract]", err);
    const message = err instanceof Error ? err.message : "Erro ao salvar contrato";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

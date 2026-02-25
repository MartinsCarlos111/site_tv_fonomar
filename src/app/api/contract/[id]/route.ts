import { NextRequest, NextResponse } from "next/server";
import { getContractById, getContractEvents } from "@/lib/db";

/**
 * GET /api/contract/[id]
 * Retorna os dados do contrato (formulário enviado) e opcionalmente o histórico de eventos.
 * Query: ?events=1 para trazer todos os eventos do contrato.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const contractId = parseInt(id, 10);
  if (Number.isNaN(contractId) || contractId < 1) {
    return NextResponse.json({ error: "ID de contrato inválido" }, { status: 400 });
  }

  try {
    const contract = await getContractById(contractId);
    if (!contract) {
      return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    if (searchParams.get("events") === "1") {
      const events = await getContractEvents(contractId);
      return NextResponse.json({ ...contract, events });
    }

    return NextResponse.json(contract);
  } catch (err) {
    console.error("[GET /api/contract/:id]", err);
    const message = err instanceof Error ? err.message : "Erro ao buscar contrato";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

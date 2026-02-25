import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/mercado-pago";

/**
 * GET /api/orders/[id]
 * Retorna os dados de uma order do Mercado Pago.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "ID da order é obrigatório" },
      { status: 400 }
    );
  }

  try {
    const order = await getOrder(id);
    return NextResponse.json(order);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao obter order";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

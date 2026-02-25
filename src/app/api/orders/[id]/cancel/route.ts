import { NextRequest, NextResponse } from "next/server";
import { cancelOrder } from "@/lib/mercado-pago";

/**
 * POST /api/orders/[id]/cancel
 * Cancela uma order (apenas status "action_required" ou "created").
 */
export async function POST(
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
    const order = await cancelOrder(id);
    return NextResponse.json(order);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao cancelar order";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

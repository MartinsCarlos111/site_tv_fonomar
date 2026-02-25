import { NextRequest, NextResponse } from "next/server";
import { refundOrder, type MPRefundBody } from "@/lib/mercado-pago";

/**
 * POST /api/orders/[id]/refund
 * Reembolso total: body {} ou { "transactions": [] }.
 * Reembolso parcial: body { "transactions": [ { "id": "PAY_xxx", "amount": "10.00" } ] }.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "ID da order é obrigatório" },
      { status: 400 }
    );
  }

  let body: MPRefundBody = {};
  try {
    const parsed = await request.json().catch(() => ({}));
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.transactions)) {
      body = { transactions: parsed.transactions };
    }
  } catch {
    // body vazio = reembolso total
  }

  try {
    const order = await refundOrder(id, body);
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao reembolsar order";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

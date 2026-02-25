import { NextRequest, NextResponse } from "next/server";
import { captureOrder } from "@/lib/mercado-pago";

/**
 * POST /api/orders/[id]/capture
 * Captura uma order previamente autorizada (cartão de crédito).
 * Opcional: body { "idempotency_key": "..." } para idempotência customizada.
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

  let idempotencyKeyValue: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    if (body?.idempotency_key && typeof body.idempotency_key === "string") {
      idempotencyKeyValue = body.idempotency_key;
    }
  } catch {
    // body vazio é válido
  }

  try {
    const order = await captureOrder(id, idempotencyKeyValue);
    return NextResponse.json(order);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao capturar order";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

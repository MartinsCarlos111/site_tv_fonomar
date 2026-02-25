import { NextResponse } from "next/server";
import { createOrder, type MPCreateOrderBody } from "@/lib/mercado-pago";

/**
 * POST /api/checkout
 * Cria uma order no Mercado Pago (Checkout Transparente - Orders API).
 * Body: MPCreateOrderBody (type, external_reference, total_amount, payer, transactions, etc.)
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MPCreateOrderBody;

    if (!body.external_reference || !body.total_amount || !body.payer?.email) {
      return NextResponse.json(
        {
          error: "Campos obrigatórios: external_reference, total_amount, payer (com email)",
        },
        { status: 400 }
      );
    }

    if (
      !body.transactions?.payments?.length ||
      body.transactions.payments.some(
        (p) => !p.amount || !p.payment_method?.id || !p.payment_method?.type
      )
    ) {
      return NextResponse.json(
        {
          error:
            "transactions.payments deve ter ao menos um item com amount e payment_method (id, type)",
        },
        { status: 400 }
      );
    }

    const order = await createOrder(body);
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar order";
    const status =
      typeof (err as { status?: number }).status === "number"
        ? (err as { status: number }).status
        : 502;
    return NextResponse.json(
      { error: message },
      { status: status >= 400 ? status : 502 }
    );
  }
}

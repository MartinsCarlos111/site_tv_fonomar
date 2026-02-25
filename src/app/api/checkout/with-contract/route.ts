import { NextResponse } from "next/server";
import { createOrder, type MPCreateOrderBody, type MPCreateOrderPayment } from "@/lib/mercado-pago";

/**
 * POST /api/checkout/with-contract
 * Cria order no Mercado Pago com dados do formulário (sem salvar contrato no MySQL).
 * Body: { formData: { nome, cpf, email, whatsapp, ... }, payment: { method_id, type, token?, installments? } }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { formData: rawFormData, payment } = body;

    const form = (rawFormData && typeof rawFormData === "object")
      ? (rawFormData as Record<string, unknown>)
      : null;

    if (!form) {
      return NextResponse.json(
        { error: "formData é obrigatório (dados do formulário)" },
        { status: 400 }
      );
    }
    const total = Number(form.valor_mensal_total);
    if (!total || total <= 0) {
      return NextResponse.json({ error: "Valor inválido (valor_mensal_total)" }, { status: 400 });
    }

    if (!payment?.method_id || !payment?.type) {
      return NextResponse.json(
        { error: "payment.method_id e payment.type são obrigatórios" },
        { status: 400 }
      );
    }

    const nome = String(form.nome ?? "").trim();
    const parts = nome.split(/\s+/);
    const firstName = parts[0] ?? nome;
    const lastName = parts.slice(1).join(" ") || firstName;

    const payments: MPCreateOrderPayment[] = [
      {
        amount: total.toFixed(2),
        payment_method: {
          id: String(payment.method_id),
          type: payment.type,
          token: payment.token,
          installments: payment.installments ?? 1,
          statement_descriptor: "TV Fonomar",
        },
      },
    ];

    const orderBody: MPCreateOrderBody = {
      type: "online",
      external_reference: `checkout_${Date.now()}`,
      total_amount: total.toFixed(2),
      description: String(form.resumo ?? `Plano ${form.plano}`),
      payer: {
        email: String(form.email),
        entity_type: "individual",
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: form.cpf?.toString().length === 11 ? "CPF" : "CNPJ",
          number: String(form.cpf ?? "").replace(/\D/g, ""),
        },
        phone: {
          area_code: String(form.whatsapp ?? "").slice(0, 2),
          number: String(form.whatsapp ?? "").replace(/\D/g, "").slice(2),
        },
      },
      transactions: { payments },
      items: [
        {
          title: String(form.plano ?? "Plano"),
          unit_price: Number(form.valor_base_unitario)?.toFixed(2) ?? total.toFixed(2),
          quantity: Number(form.qtd_locais) || 1,
          description: String(form.resumo ?? ""),
        },
      ],
    };

    const order = await createOrder(orderBody);
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("[POST /api/checkout/with-contract]", err);
    const message = err instanceof Error ? err.message : "Erro ao criar pagamento";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

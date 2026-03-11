import { NextResponse } from "next/server";

const MP_PREFERENCES_URL = "https://api.mercadopago.com/checkout/preferences";
const MP_USERS_ME_URL = "https://api.mercadolibre.com/users/me";

/** Fallback quando a API não retorna o nome do dono da conta */
const NOME_RECEBEDOR_FALLBACK = "TV Fonomar";

/**
 * Obtém o nome do recebedor (dono da conta MP) pela API Mercado Libre.
 * Usa o mesmo Access Token; retorna first_name + last_name ou nickname.
 */
async function getNomeRecebedor(accessToken: string): Promise<string> {
  try {
    const res = await fetch(MP_USERS_ME_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await res.json().catch(() => null)) as {
      first_name?: string;
      last_name?: string;
      nickname?: string;
    } | null;
    if (!data) return NOME_RECEBEDOR_FALLBACK;
    const first = (data.first_name ?? "").trim();
    const last = (data.last_name ?? "").trim();
    if (first || last) return `${first} ${last}`.trim();
    if ((data.nickname ?? "").trim()) return (data.nickname as string).trim();
    return NOME_RECEBEDOR_FALLBACK;
  } catch {
    return NOME_RECEBEDOR_FALLBACK;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      nome,
      email,
      valor_mensal_total,
      fidelidade_anos,
      plano,
      resumo,
    } = body as {
      nome?: string;
      email?: string;
      valor_mensal_total?: number;
      fidelidade_anos?: number;
      plano?: string;
      resumo?: string;
    };

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: "MERCADOPAGO_ACCESS_TOKEN não configurado" },
        { status: 500 }
      );
    }

    if (!nome || !email) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome e email" },
        { status: 400 }
      );
    }

    const valorMensal = Number(valor_mensal_total);
    if (!valorMensal || valorMensal <= 0) {
      return NextResponse.json(
        { error: "Valor inválido (valor_mensal_total)" },
        { status: 400 }
      );
    }

    const anos = Math.max(1, Math.min(3, Math.floor(Number(fidelidade_anos) || 1)));
    const meses = anos * 12;
    const total = Math.round(valorMensal * meses * 100) / 100;

    const origin = request.headers.get("origin") ?? "";
    const baseUrl = origin || "http://localhost:3000";

    const nomeRecebedor = await getNomeRecebedor(accessToken);

    const prefRes = await fetch(MP_PREFERENCES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: `${nomeRecebedor} · ${plano ?? "Plano"} (${meses}x R$ ${valorMensal.toFixed(2)})`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: total,
            description: resumo ? `${nomeRecebedor} – ${resumo}` : `${nomeRecebedor} – ${anos} ano(s) · ${meses} parcelas de R$ ${valorMensal.toFixed(2)}`,
          },
        ],
        payer: {
          name: nome,
          email,
        },
        statement_descriptor: nomeRecebedor.slice(0, 22),
        payment_methods: {
          max_installments: 12,
        },
        back_urls: {
          success: `${baseUrl}/checkout/sucesso`,
          failure: `${baseUrl}/checkout/erro`,
          pending: `${baseUrl}/checkout/pending`,
        },
      }),
    });

    const data = await prefRes.json().catch(() => ({}));

    if (!prefRes.ok) {
      const msg =
        (data && (data.message || data.error)) ||
        `Erro ao criar preferência (${prefRes.status})`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const initPoint = data.init_point || data.sandbox_init_point;
    if (!initPoint) {
      return NextResponse.json(
        { error: "Resposta do Mercado Pago sem init_point" },
        { status: 502 }
      );
    }

    return NextResponse.json({ init_point: initPoint, preference: data });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao criar preferência de checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

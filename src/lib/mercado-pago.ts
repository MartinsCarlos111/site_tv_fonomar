/**
 * Integração servidor com a API de Orders do Mercado Pago (Checkout Transparente).
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders
 */

const MP_BASE = "https://api.mercadopago.com/v1";

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
  }
  return token;
}

function idempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Resposta de erro da API MP */
export interface MPErrorItem {
  message?: string;
  error?: string;
  cause?: Array<{ code?: string; description?: string }>;
}

export interface MPErrorResponse {
  status?: number;
  error?: string;
  message?: string;
  cause?: MPErrorItem["cause"];
  erros?: MPErrorItem[];
}

/** Payer para criação de order */
export interface MPCreateOrderPayer {
  email: string;
  entity_type?: "individual" | "association";
  first_name: string;
  last_name: string;
  identification: { type: "CPF" | "CNPJ"; number: string };
  phone?: { area_code: string; number: string };
  address?: {
    zip_code: string;
    street_name: string;
    street_number: string;
    neighborhood?: string;
    state: string;
    city?: string;
    complement?: string;
  };
}

/** Um pagamento dentro de transactions.payments */
export interface MPCreateOrderPayment {
  amount: string;
  payment_method: {
    id: string;
    type: "credit_card" | "debit_card" | "pix" | "ticket" | "bank_transfer";
    token?: string;
    installments?: number;
    statement_descriptor?: string;
  };
  expiration_time?: string;
}

/** Payload para criar order (modo automático ou manual) */
export interface MPCreateOrderBody {
  type: "online";
  external_reference: string;
  total_amount: string;
  processing_mode?: "automatic" | "manual";
  capture_mode?: "automatic_async" | "manual";
  description?: string;
  payer: MPCreateOrderPayer;
  transactions: {
    payments: MPCreateOrderPayment[];
  };
  items?: Array<{
    title: string;
    unit_price: string;
    quantity: number;
    description?: string;
    external_code?: string;
    picture_url?: string;
    category_id?: string;
  }>;
  shipment?: {
    address: {
      zip_code: string;
      street_name: string;
      street_number: string;
      neighborhood?: string;
      city: string;
      state: string;
      complement?: string;
    };
  };
  integration_data?: Record<string, unknown>;
}

/** Resposta da criação de order */
export interface MPOrderResponse {
  id: string;
  type: string;
  processing_mode?: string;
  external_reference: string;
  total_amount: string;
  total_paid_amount?: string;
  status: string;
  status_detail?: string;
  created_date?: string;
  last_updated_date?: string;
  country_code?: string;
  transactions?: {
    payments?: Array<{
      id: string;
      amount: string;
      status: string;
      status_detail?: string;
      reference_id?: string;
      payment_method?: Record<string, unknown>;
    }>;
    refunds?: Array<{
      id: string;
      transaction_id: string;
      amount: string;
      status: string;
    }>;
  };
  description?: string;
  items?: unknown[];
  [key: string]: unknown;
}

/** Cria uma order (modo automático processa na hora). */
export async function createOrder(
  body: MPCreateOrderBody,
  idempotencyKeyValue?: string
): Promise<MPOrderResponse> {
  const key = idempotencyKeyValue ?? idempotencyKey();
  const res = await fetch(`${MP_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
      "X-Idempotency-Key": key,
    },
    body: JSON.stringify({
      ...body,
      processing_mode: body.processing_mode ?? "automatic",
      capture_mode: body.capture_mode ?? "automatic_async",
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err: MPErrorResponse = data;
    throw new Error(
      err.message ?? err.error ?? `Mercado Pago: ${res.status}`
    );
  }

  return data as MPOrderResponse;
}

/** Obtém uma order pelo ID. */
export async function getOrder(orderId: string): Promise<MPOrderResponse> {
  const res = await fetch(`${MP_BASE}/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err: MPErrorResponse = data;
    throw new Error(
      err.message ?? err.error ?? `Mercado Pago: ${res.status}`
    );
  }

  return data as MPOrderResponse;
}

/** Cancela uma order (apenas status "action_required" ou "created"). */
export async function cancelOrder(orderId: string): Promise<MPOrderResponse> {
  const res = await fetch(
    `${MP_BASE}/orders/${encodeURIComponent(orderId)}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err: MPErrorResponse = data;
    throw new Error(
      err.message ?? err.error ?? `Mercado Pago: ${res.status}`
    );
  }

  return data as MPOrderResponse;
}

/** Captura uma order autorizada (cartão de crédito). */
export async function captureOrder(
  orderId: string,
  idempotencyKeyValue?: string
): Promise<MPOrderResponse> {
  const key = idempotencyKeyValue ?? idempotencyKey();
  const res = await fetch(
    `${MP_BASE}/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
        "X-Idempotency-Key": key,
      },
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err: MPErrorResponse = data;
    throw new Error(
      err.message ?? err.error ?? `Mercado Pago: ${res.status}`
    );
  }

  return data as MPOrderResponse;
}

/** Reembolso total (body vazio) ou parcial (transactions com id e amount). */
export interface MPRefundBody {
  transactions?: Array<{ id: string; amount: string }>;
}

export async function refundOrder(
  orderId: string,
  body: MPRefundBody = {},
  idempotencyKeyValue?: string
): Promise<MPOrderResponse> {
  const key = idempotencyKeyValue ?? idempotencyKey();
  const res = await fetch(
    `${MP_BASE}/orders/${encodeURIComponent(orderId)}/refund`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
        "X-Idempotency-Key": key,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err: MPErrorResponse = data;
    throw new Error(
      err.message ?? err.error ?? `Mercado Pago: ${res.status}`
    );
  }

  return data as MPOrderResponse;
}

/** Busca orders (filtros opcionais). */
export interface MPSearchOrdersParams {
  external_reference?: string;
  status?: string;
  date_created_from?: string;
  date_created_to?: string;
  limit?: number;
  offset?: number;
}

export interface MPSearchOrdersResponse {
  results?: MPOrderResponse[];
  paging?: { total: number; limit: number; offset: number };
  [key: string]: unknown;
}

export async function searchOrders(
  params: MPSearchOrdersParams = {}
): Promise<MPSearchOrdersResponse> {
  const search = new URLSearchParams();
  if (params.external_reference != null)
    search.set("external_reference", params.external_reference);
  if (params.status != null) search.set("status", params.status);
  if (params.date_created_from != null)
    search.set("date_created_from", params.date_created_from);
  if (params.date_created_to != null)
    search.set("date_created_to", params.date_created_to);
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.offset != null) search.set("offset", String(params.offset));

  const qs = search.toString();
  const url = `${MP_BASE}/orders${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err: MPErrorResponse = data;
    throw new Error(
      err.message ?? err.error ?? `Mercado Pago: ${res.status}`
    );
  }

  return data as MPSearchOrdersResponse;
}

import { NextRequest, NextResponse } from "next/server";
import { searchOrders, type MPSearchOrdersParams } from "@/lib/mercado-pago";

/**
 * GET /api/orders/search
 * Busca orders no Mercado Pago.
 * Query: external_reference, status, date_created_from, date_created_to, limit, offset
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params: MPSearchOrdersParams = {};
  const externalRef = searchParams.get("external_reference");
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("date_created_from");
  const dateTo = searchParams.get("date_created_to");
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");

  if (externalRef != null) params.external_reference = externalRef;
  if (status != null) params.status = status;
  if (dateFrom != null) params.date_created_from = dateFrom;
  if (dateTo != null) params.date_created_to = dateTo;
  if (limit != null) params.limit = parseInt(limit, 10);
  if (offset != null) params.offset = parseInt(offset, 10);

  try {
    const result = await searchOrders(params);
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao buscar orders";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

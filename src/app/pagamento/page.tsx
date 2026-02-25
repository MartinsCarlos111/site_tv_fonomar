"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "checkoutFormData";

interface FormPayload {
  nome?: string;
  email?: string;
  cpf?: string;
  whatsapp?: string;
  plano?: string;
  valor_mensal_total?: number;
  valor_base_unitario?: number;
  resumo?: string;
  locais?: string;
  qtd_locais?: number;
  fidelidade_anos?: number;
}

export default function PagamentoPage() {
  const [formData, setFormData] = useState<FormPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [orderResult, setOrderResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as FormPayload;
        setFormData(data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const handlePix = async () => {
    if (!formData) return;
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/with-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData,
          payment: { method_id: "pix", type: "pix" },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar pagamento");
        return;
      }
      setOrderResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao processar");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <p>Carregando...</p>
      </main>
    );
  }

  if (!formData) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "crimson" }}>Preencha o formulário na página inicial para acessar o checkout.</p>
        <Link href="/" style={{ display: "inline-block", marginTop: "1rem" }}>Ir ao formulário</Link>
      </main>
    );
  }

  const total = Number(formData.valor_mensal_total ?? 0);
  const totalFormatado = total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "2rem" }}>
      <h1>Checkout</h1>
      <p>Conclua o pagamento do seu plano.</p>

      <section style={{ marginTop: "1.5rem", padding: "1rem", background: "#f5f5f5", borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Resumo</h2>
        <p><strong>Nome:</strong> {formData.nome}</p>
        <p><strong>Plano:</strong> {formData.plano}</p>
        <p><strong>Locais:</strong> {formData.locais}</p>
        {formData.fidelidade_anos != null && (
          <p><strong>Fidelidade:</strong> {formData.fidelidade_anos} ano(s)</p>
        )}
        <p><strong>Valor mensal:</strong> {totalFormatado}</p>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2 style={{ marginTop: 0 }}>Forma de pagamento</h2>
        <button
          type="button"
          onClick={handlePix}
          disabled={paying}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            cursor: paying ? "not-allowed" : "pointer",
          }}
        >
          {paying ? "Criando pagamento Pix..." : "Pagar com Pix"}
        </button>
        {error && (
          <p style={{ color: "crimson", marginTop: "0.5rem" }}>{error}</p>
        )}
        {orderResult && (
          <div style={{ marginTop: "1rem", padding: "1rem", background: "#e8f5e9", borderRadius: 8 }}>
            <p><strong>Pagamento criado</strong></p>
            <p>Order ID: <code>{String(orderResult.id)}</code></p>
            <p>Status: {String(orderResult.status)}</p>
            {orderResult.transactions?.payments?.[0] && (
              <pre style={{ fontSize: "0.85rem", overflow: "auto" }}>
                {JSON.stringify((orderResult as { transactions?: { payments?: unknown[] } }).transactions?.payments?.[0], null, 2)}
              </pre>
            )}
          </div>
        )}
      </section>

      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/">Voltar ao formulário</Link>
      </p>
    </main>
  );
}

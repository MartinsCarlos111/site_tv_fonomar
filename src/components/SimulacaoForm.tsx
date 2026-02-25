"use client";

import { useCallback, useState } from "react";

const LOCAIS = [
  "Barbearia Moraes",
  "Clínica Fonomar",
  "Perrelli's Bistro",
  "Salão Jaqueline Fonseca",
  "Racer - Autos e Pick-ups",
  "Top Films - Maurinei",
] as const;

const FIDELIDADES = [1, 2, 3] as const;

const PLANOS = ["Bronze 15 seg.", "Prata 30 seg.", "Ouro 45 seg."] as const;

type Fidelidade = (typeof FIDELIDADES)[number];
type Plano = (typeof PLANOS)[number];

interface PriceRow {
  fidelidade: Fidelidade;
  precos: Record<Plano, number>;
}

const PRICE_TABLE: PriceRow[] = [
  { fidelidade: 1, precos: { "Bronze 15 seg.": 80, "Prata 30 seg.": 144, "Ouro 45 seg.": 204 } },
  { fidelidade: 2, precos: { "Bronze 15 seg.": 70, "Prata 30 seg.": 126, "Ouro 45 seg.": 176 } },
  { fidelidade: 3, precos: { "Bronze 15 seg.": 50, "Prata 30 seg.": 90, "Ouro 45 seg.": 125 } },
];

function onlyDigits(str: string): string {
  return str.replace(/\D/g, "");
}

function safeText(str: string): string {
  return str.trim().replace(/\s+/g, " ");
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function validateEmailSimple(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeText(email));
}

export default function SimulacaoForm() {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [endereco, setEndereco] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [locaisSelecionados, setLocaisSelecionados] = useState<Set<string>>(new Set());
  const [selectedFidelity, setSelectedFidelity] = useState<Fidelidade | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plano | null>(null);
  const [sendStatus, setSendStatus] = useState<{ msg: string; color: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const qtdLocais = locaisSelecionados.size;

  const getBase = useCallback((): number => {
    if (!selectedFidelity || !selectedPlan) return 0;
    const row = PRICE_TABLE.find((r) => r.fidelidade === selectedFidelity);
    return row ? row.precos[selectedPlan] : 0;
  }, [selectedFidelity, selectedPlan]);

  const calcularTotalMensal = useCallback((): number => {
    return getBase() * qtdLocais;
  }, [getBase, qtdLocais]);

  const getUnitPrice = (fidelidade: Fidelidade, plano: Plano): number => {
    const row = PRICE_TABLE.find((r) => r.fidelidade === fidelidade);
    return row ? row.precos[plano] : 0;
  };

  const getDisplayPrice = (fidelidade: Fidelidade, plano: Plano): string => {
    const base = getUnitPrice(fidelidade, plano);
    return formatBRL(base * (qtdLocais || 1));
  };

  const toggleLocal = (local: string) => {
    setLocaisSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(local)) next.delete(local);
      else next.add(local);
      return next;
    });
  };

  const handleTableCellClick = (fidelidade: Fidelidade, plano: Plano) => {
    setSelectedFidelity(fidelidade);
    setSelectedPlan(plano);
  };

  // Build summary
  const locaisArray = Array.from(locaisSelecionados);
  let summaryContent: React.ReactNode;
  if (qtdLocais === 0) {
    summaryContent = "Selecione pelo menos 1 local para iniciar.";
  } else if (!selectedFidelity || !selectedPlan) {
    summaryContent = (
      <>
        <strong>Resumo:</strong>
        <br />
        📍 Anúncios ({qtdLocais}): {locaisArray.join(", ")}
        <br />
        {!selectedFidelity ? (
          <>
            👉 Selecione a <strong>fidelidade</strong>.
            <br />
          </>
        ) : (
          <>⏳ Fidelidade: {selectedFidelity} ano(s)<br /></>
        )}
        {!selectedPlan ? (
          <>
            👉 Selecione o <strong>plano</strong>.
          </>
        ) : (
          <>⭐ Plano: {selectedPlan}</>
        )}
      </>
    );
  } else {
    const total = calcularTotalMensal();
    summaryContent = (
      <>
        <strong>Resumo:</strong>
        <br />
        📍 Anúncios ({qtdLocais}): {locaisArray.join(", ")}
        <br />
        ⏳ Fidelidade: {selectedFidelity} ano(s)
        <br />
        ⭐ Plano: {selectedPlan}
        <br />
        💰 Valor mensal: <strong>{formatBRL(total)}</strong>
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSendStatus({ msg: "Validando...", color: "black" });

    const nomeSafe = safeText(nome);
    const cpfSafe = onlyDigits(cpf);
    const enderecoSafe = safeText(endereco);
    const whatsappSafe = onlyDigits(whatsapp);
    const emailSafe = safeText(email);

    if (!nomeSafe || !cpfSafe || !enderecoSafe || !whatsappSafe || !emailSafe) {
      alert("Preencha todos os campos pessoais obrigatórios.");
      setSendStatus({ msg: "❌ Preencha todos os campos pessoais obrigatórios.", color: "red" });
      return;
    }
    if (!validateEmailSimple(emailSafe)) {
      alert("Informe um e-mail válido.");
      setSendStatus({ msg: "❌ Informe um e-mail válido.", color: "red" });
      return;
    }
    if (locaisArray.length === 0) {
      alert("Selecione pelo menos um local de anúncio.");
      setSendStatus({ msg: "❌ Selecione pelo menos um local.", color: "red" });
      return;
    }
    if (!selectedFidelity) {
      alert("Selecione uma fidelidade.");
      setSendStatus({ msg: "❌ Selecione uma fidelidade.", color: "red" });
      return;
    }
    if (!selectedPlan) {
      alert("Selecione um plano.");
      setSendStatus({ msg: "❌ Selecione um plano.", color: "red" });
      return;
    }

    const base = getBase();
    const total = calcularTotalMensal();

    const resumoText = [
      `Anúncios (${locaisArray.length}): ${locaisArray.join(", ")}`,
      `Fidelidade: ${selectedFidelity} ano(s)`,
      `Plano: ${selectedPlan}`,
      `Valor mensal: ${formatBRL(total)}`,
    ].join(" | ");

    const payload = {
      nome: nomeSafe,
      cpf: cpfSafe,
      endereco: enderecoSafe,
      whatsapp: whatsappSafe,
      email: emailSafe,
      locais: locaisArray.join(" | "),
      qtd_locais: locaisArray.length,
      fidelidade_anos: selectedFidelity,
      plano: selectedPlan,
      valor_base_unitario: base,
      valor_mensal_total: total,
      resumo: resumoText,
    };

    setSubmitting(true);
    setSendStatus({ msg: "Redirecionando ao checkout...", color: "black" });

    try {
      sessionStorage.setItem("checkoutFormData", JSON.stringify(payload));
      setSendStatus({ msg: "✅ Redirecionando ao pagamento...", color: "green" });
      window.location.href = "/pagamento";
    } catch (err) {
      console.error(err);
      setSendStatus({
        msg: "❌ Erro: " + (err instanceof Error ? err.message : "Erro desconhecido."),
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form id="adForm" noValidate onSubmit={handleSubmit}>
        <div className="form-row">
          <label>
            Nome Completo
            <input
              type="text"
              name="nome"
              required
              autoComplete="name"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </label>
          <label>
            CPF/CNPJ
            <input
              type="text"
              name="cpf"
              required
              inputMode="numeric"
              autoComplete="off"
              placeholder="Somente números"
              value={cpf}
              onChange={(e) => setCpf(onlyDigits(e.target.value))}
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Endereço
            <input
              type="text"
              name="endereco"
              required
              autoComplete="street-address"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
            />
          </label>
          <label>
            WhatsApp
            <input
              type="text"
              name="whatsapp"
              required
              inputMode="numeric"
              autoComplete="tel"
              placeholder="DDD + número (somente números)"
              value={whatsapp}
              onChange={(e) => setWhatsapp(onlyDigits(e.target.value))}
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Email
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        </div>

        <div className="checkbox-group">
          <strong>Selecione os Locais de Anúncio:</strong>
          <br />
          {LOCAIS.map((local) => (
            <label key={local}>
              <input
                type="checkbox"
                name="local"
                value={local}
                checked={locaisSelecionados.has(local)}
                onChange={() => toggleLocal(local)}
              />{" "}
              {local}
            </label>
          ))}
        </div>

        <strong>Escolha a Fidelidade:</strong>
        <div className="fidelity-buttons">
          {FIDELIDADES.map((f) => (
            <button
              key={f}
              type="button"
              data-fidelidade={f}
              className={selectedFidelity === f ? "active" : ""}
              onClick={() => setSelectedFidelity(f)}
            >
              {f} ano{f > 1 ? "s" : ""}
            </button>
          ))}
        </div>

        <strong>Escolha o Plano:</strong>
        <div className="plan-buttons">
          {PLANOS.map((p) => (
            <button
              key={p}
              type="button"
              data-plano={p}
              className={selectedPlan === p ? "active" : ""}
              onClick={() => setSelectedPlan(p)}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="table-container">
          <table id="priceTable">
            <thead>
              <tr>
                <th>Fidelidade</th>
                {PLANOS.map((p) => (
                  <th key={p}>{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRICE_TABLE.map((row) => (
                <tr
                  key={row.fidelidade}
                  data-fidelidade={row.fidelidade}
                  className={selectedFidelity === row.fidelidade ? "highlight-row" : ""}
                >
                  <td>{row.fidelidade} ano{row.fidelidade > 1 ? "s" : ""}</td>
                  {PLANOS.map((p) => (
                    <td
                      key={p}
                      data-plano={p}
                      className={
                        selectedFidelity === row.fidelidade && selectedPlan === p
                          ? "highlight-cell"
                          : ""
                      }
                      onClick={() => handleTableCellClick(row.fidelidade, p)}
                      style={{ cursor: "pointer" }}
                    >
                      {getDisplayPrice(row.fidelidade, p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="summary" id="summary">
          {summaryContent}
        </div>

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? "Enviando..." : "Enviar"}
        </button>

        {sendStatus && (
          <div id="sendStatus" className="status" style={{ color: sendStatus.color }}>
            {sendStatus.msg}
          </div>
        )}
      </form>
    </>
  );
}

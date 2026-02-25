/**
 * Conexão MySQL para logs do fluxo de contratação (intenção → formulário → pagamento).
 */

import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST ?? "localhost",
  port: parseInt(process.env.MYSQL_PORT ?? "3306", 10),
  user: process.env.MYSQL_USER ?? "root",
  password: process.env.MYSQL_PASSWORD ?? "",
  database: process.env.MYSQL_DATABASE ?? "site_tv_fonomar",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export type ContractStage =
  | "form_view"       // visualização do formulário (opcional)
  | "form_submitted"  // formulário preenchido e enviado
  | "payment_created" // order criada no Mercado Pago
  | "payment_completed"
  | "payment_failed"
  | "payment_canceled";

export interface ContractEventRow {
  id: number;
  contract_id: number | null;
  stage: string;
  payload: string;
  order_id: string | null;
  created_at: Date;
}

/** Garante que a tabela contract_events existe. */
export async function ensureContractEventsTable(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS contract_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        contract_id INT NULL,
        stage VARCHAR(64) NOT NULL,
        payload JSON NOT NULL,
        order_id VARCHAR(128) NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_contract_id (contract_id),
        INDEX idx_stage (stage),
        INDEX idx_created_at (created_at)
      )
    `);
  } finally {
    conn.release();
  }
}

/**
 * Registra um evento do fluxo de contratação.
 * @param stage - Etapa do fluxo
 * @param payload - Dados do evento (objeto será salvo como JSON)
 * @param orderId - ID da order no Mercado Pago (opcional)
 * @param contractId - ID do contrato (para eventos que referenciam o formulário enviado)
 * @returns ID da linha inserida (para form_submitted, esse id é o contractId)
 */
export async function logContractEvent(
  stage: ContractStage,
  payload: Record<string, unknown>,
  orderId?: string | null,
  contractId?: number | null
): Promise<number> {
  await ensureContractEventsTable();
  const [result] = await pool.execute<mysql.ResultSetHeader>(
    `INSERT INTO contract_events (contract_id, stage, payload, order_id, created_at)
     VALUES (?, ?, ?, ?, NOW(3))`,
    [
      contractId ?? null,
      stage,
      JSON.stringify(payload),
      orderId ?? null,
    ]
  );
  return result.insertId;
}

/**
 * Busca o evento de formulário enviado (contrato) pelo ID.
 * Retorna null se não existir ou não for form_submitted.
 */
export async function getContractById(
  id: number
): Promise<{ id: number; stage: string; payload: Record<string, unknown>; created_at: Date } | null> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    "SELECT id, stage, payload, created_at FROM contract_events WHERE id = ? AND stage = 'form_submitted'",
    [id]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  const payload =
    typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
  return {
    id: row.id,
    stage: row.stage,
    payload: payload as Record<string, unknown>,
    created_at: row.created_at,
  };
}

/**
 * Lista todos os eventos de um contrato (form_submitted + payment_created etc).
 */
export async function getContractEvents(contractId: number): Promise<ContractEventRow[]> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, contract_id, stage, payload, order_id, created_at
     FROM contract_events
     WHERE id = ? OR contract_id = ?
     ORDER BY created_at ASC`,
    [contractId, contractId]
  );
  return rows.map((r: any) => ({
    id: r.id,
    contract_id: r.contract_id,
    stage: r.stage,
    payload: r.payload,
    order_id: r.order_id,
    created_at: r.created_at,
  }));
}

export { pool };

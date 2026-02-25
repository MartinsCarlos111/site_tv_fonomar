-- Banco e tabela para logs do fluxo de contratação.
-- Execute no MySQL (crie o banco antes se não existir: CREATE DATABASE site_tv_fonomar;)

CREATE DATABASE IF NOT EXISTS site_tv_fonomar;
USE site_tv_fonomar;

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
);

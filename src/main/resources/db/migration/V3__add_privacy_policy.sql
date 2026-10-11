-- Agregar columna para auditar cuándo aceptó el paciente el aviso de privacidad
ALTER TABLE users ADD privacy_policy_accepted_at TIMESTAMP;
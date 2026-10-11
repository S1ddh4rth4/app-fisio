CREATE TABLE audit_logs (
    id VARCHAR2(255) PRIMARY KEY,
    actor_username VARCHAR2(255) NOT NULL,
    action VARCHAR2(50) NOT NULL,
    target_patient_id VARCHAR2(255) NOT NULL,
    details VARCHAR2(500),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Índice para búsquedas rápidas en auditorías
CREATE INDEX idx_audit_patient ON audit_logs(target_patient_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_username);
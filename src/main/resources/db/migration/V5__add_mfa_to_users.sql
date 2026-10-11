-- Autenticación de Dos Factores
ALTER TABLE users ADD mfa_secret VARCHAR2(64);
ALTER TABLE users ADD mfa_enabled NUMBER(1) DEFAULT 0 NOT NULL;
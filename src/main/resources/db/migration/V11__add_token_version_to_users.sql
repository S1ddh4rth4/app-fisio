-- Migración V11: Incorporación de token_version para revocación inmediata de sesiones JWT
ALTER TABLE users
    ADD token_version NUMBER(10) DEFAULT 1 NOT NULL;
-- Migración V10: Incorporación de campos de perfil para todos los roles (Admin, Fisio, Paciente, Recepción)
ALTER TABLE users
    ADD ( full_name VARCHAR2(150), phone VARCHAR2(30), professional_license VARCHAR2(50), avatar_url CLOB );
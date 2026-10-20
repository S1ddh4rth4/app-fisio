-- Migración V12: Campos de auditoría médica para edición de prescripciones
ALTER TABLE exercise_prescriptions
    ADD ( edit_reason VARCHAR2(500), edited_by VARCHAR2(100), edited_at TIMESTAMP );
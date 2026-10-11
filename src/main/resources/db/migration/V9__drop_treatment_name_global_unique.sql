-- Eliminamos la restricción de que el nombre sea único a nivel global de toda la clínica
-- En Oracle se puede deshabilitar/eliminar la restricción UNIQUE sobre la columna 'name'
ALTER TABLE treatments
    DROP UNIQUE (name);
-- Opcional: aseguramos que un mismo fisio no duplique dos veces el mismo tratamiento
-- (Oracle permite índices únicos compuestos con columnas nulas)
CREATE UNIQUE INDEX idx_treatment_physio_name
ON treatments
    (
        physiotherapist_id,
        name
    );
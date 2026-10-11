-- Añadir Notas Clínicas y Relación con Tratamientos a las Citas
ALTER TABLE appointments ADD clinical_notes VARCHAR2(2000);
ALTER TABLE appointments ADD treatment_id VARCHAR2(255);

-- Opcional pero recomendado para mantener la integridad de los datos
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_treatment FOREIGN KEY (treatment_id) REFERENCES treatments(id);
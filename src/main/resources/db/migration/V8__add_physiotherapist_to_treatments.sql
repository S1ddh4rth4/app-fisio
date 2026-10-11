ALTER TABLE treatments
    ADD physiotherapist_id VARCHAR2(255);
ALTER TABLE treatments
    ADD CONSTRAINT fk_treatments_physio FOREIGN KEY (physiotherapist_id) REFERENCES users(id);
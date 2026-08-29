package com.fisitec.appfisio.repository;

import com.fisitec.appfisio.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, String> {

    // Magia de Spring Data:
    // Solo con este nombre de método, Spring sabe que debe buscar
    // en la base de datos usando "patient.id"
    List<MedicalRecord> findByPatientIdOrderByCreatedAtDesc(String patientId);

}
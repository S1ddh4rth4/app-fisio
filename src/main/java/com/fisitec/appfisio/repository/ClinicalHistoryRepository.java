package com.fisitec.appfisio.repository;

import com.fisitec.appfisio.entity.ClinicalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClinicalHistoryRepository extends JpaRepository<ClinicalHistory, String> {

    // Obtener todas las historias de un paciente ordenadas de la más reciente a la
    // más antigua
    List<ClinicalHistory> findByPatientIdOrderByCreatedAtDesc(String patientId);
}
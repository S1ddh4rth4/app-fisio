package com.fisitec.appfisio.repository;

import com.fisitec.appfisio.entity.PatientPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientPackageRepository extends JpaRepository<PatientPackage, String> {

    // Obtener todos los paquetes de un paciente ordenados por fecha
    List<PatientPackage> findByPatientIdOrderByCreatedAtDesc(String patientId);

    // Obtener solo los paquetes activos con sesiones disponibles
    List<PatientPackage> findByPatientIdAndStatusOrderByCreatedAtAsc(String patientId, String status);
}
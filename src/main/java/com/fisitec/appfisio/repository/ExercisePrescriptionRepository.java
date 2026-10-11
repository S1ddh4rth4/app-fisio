package com.fisitec.appfisio.repository;

import com.fisitec.appfisio.entity.ExercisePrescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExercisePrescriptionRepository extends JpaRepository<ExercisePrescription, String> {

    List<ExercisePrescription> findByPatientIdOrderByCreatedAtDesc(String patientId);

    List<ExercisePrescription> findByPhysiotherapistIdOrderByCreatedAtDesc(String physiotherapistId);

    List<ExercisePrescription> findAllByOrderByCreatedAtDesc();
}
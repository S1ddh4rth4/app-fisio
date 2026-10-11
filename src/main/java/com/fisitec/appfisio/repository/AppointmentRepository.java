package com.fisitec.appfisio.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.fisitec.appfisio.entity.Appointment;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

        List<Appointment> findByPatientId(String patientId);

        // Consulta de citas exclusivas de un fisioterapeuta
        List<Appointment> findByProfessionalIdOrderByAppointmentDateDesc(String professionalId);

        List<Appointment> findByProfessionalIdAndAppointmentDateBetweenOrderByAppointmentDateAsc(
                        String professionalId,
                        LocalDateTime startOfDay,
                        LocalDateTime endOfDay);

        boolean existsByProfessionalIdAndAppointmentDateBetween(
                        String professionalId,
                        LocalDateTime startRange,
                        LocalDateTime endRange);

        boolean existsByPatientIdAndAppointmentDateBetween(
                        String patientId,
                        LocalDateTime startRange,
                        LocalDateTime endRange);

        List<Appointment> findByAppointmentDateBetweenOrderByAppointmentDateAsc(
                        LocalDateTime start, LocalDateTime end);

        @Query("SELECT DISTINCT a.patient.id FROM Appointment a WHERE a.professional.id = :professionalId")
        List<String> findDistinctPatientIdsByProfessionalId(@Param("professionalId") String professionalId);
}
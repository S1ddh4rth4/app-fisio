package com.fisitec.appfisio.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fisitec.appfisio.entity.Appointment;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // Spring deduce que debe buscar por el ID del objeto 'patient'
    List<Appointment> findByPatientId(String patientId);

    // Buscaremos en un rango de tiempo para el filtro de "hoy"
    List<Appointment> findByProfessionalIdAndAppointmentDateBetween(
            String professionalId,
            LocalDateTime startOfDay,
            LocalDateTime endOfDay);
}

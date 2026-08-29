package com.fisitec.appfisio.service;

import com.fisitec.appfisio.dto.MedicalRecordRequestDTO;
import com.fisitec.appfisio.dto.MedicalRecordResponseDTO;
import com.fisitec.appfisio.entity.Appointment;
import com.fisitec.appfisio.entity.MedicalRecord;
import com.fisitec.appfisio.entity.User;
import com.fisitec.appfisio.repository.AppointmentRepository;
import com.fisitec.appfisio.repository.MedicalRecordRepository;
import com.fisitec.appfisio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

        private final MedicalRecordRepository medicalRecordRepository;
        private final UserRepository userRepository;
        private final AppointmentRepository appointmentRepository;

        @Transactional
        public MedicalRecordResponseDTO createMedicalRecord(MedicalRecordRequestDTO request,
                        String physiotherapistUsername) {
                // 1. Buscar al Paciente por UUID o por username
                User patient = findUserByIdOrUsername(request.getPatientId());

                // 2. Buscar al Fisioterapeuta (quien está ejecutando la acción) por su username
                User physiotherapist = userRepository.findByUsername(physiotherapistUsername)
                                .orElseThrow(() -> new IllegalArgumentException("Fisioterapeuta no encontrado"));

                // 3. Buscar la Cita si se proporcionó un ID
                Appointment appointment = null;
                if (request.getAppointmentId() != null) {
                        appointment = appointmentRepository.findById(request.getAppointmentId())
                                        .orElseThrow(
                                                        () -> new IllegalArgumentException(
                                                                        "Cita no encontrada con ID: "
                                                                                        + request.getAppointmentId()));
                }

                // 4. Construir la entidad MedicalRecord
                MedicalRecord record = MedicalRecord.builder()
                                .patient(patient)
                                .physiotherapist(physiotherapist)
                                .appointment(appointment)
                                .diagnosis(request.getDiagnosis())
                                .notes(request.getNotes())
                                .build();

                MedicalRecord savedRecord = medicalRecordRepository.save(record);
                return mapToDTO(savedRecord);
        }

        @Transactional(readOnly = true)
        public List<MedicalRecordResponseDTO> getPatientMedicalRecords(String patientIdentifier) {
                // Buscar paciente por UUID o por Username
                User patient = findUserByIdOrUsername(patientIdentifier);

                return medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId())
                                .stream()
                                .map(this::mapToDTO)
                                .collect(Collectors.toList());
        }

        // Método auxiliar para buscar usuario por su UUID o por su username
        private User findUserByIdOrUsername(String identifier) {
                return userRepository.findById(identifier)
                                .or(() -> userRepository.findByUsername(identifier))
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Paciente no encontrado: " + identifier));
        }

        // Método auxiliar para mapear Entidad -> ResponseDTO
        private MedicalRecordResponseDTO mapToDTO(MedicalRecord record) {
                return MedicalRecordResponseDTO.builder()
                                .id(record.getId())
                                .patientId(record.getPatient().getId())
                                .patientName(record.getPatient().getUsername())
                                .physiotherapistId(record.getPhysiotherapist().getId())
                                .physiotherapistName(record.getPhysiotherapist().getUsername())
                                .appointmentId(record.getAppointment() != null ? record.getAppointment().getId() : null)
                                .diagnosis(record.getDiagnosis())
                                .notes(record.getNotes())
                                .createdAt(record.getCreatedAt())
                                .build();
        }
}
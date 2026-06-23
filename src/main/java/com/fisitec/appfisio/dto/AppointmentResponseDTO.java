package com.fisitec.appfisio.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AppointmentResponseDTO {

    private Long id;
    private String patientId;
    private String patientName;
    private String professionalId;
    private String professionalName;
    private LocalDateTime appointmentDate;
    private String reason;
    private String status;

}

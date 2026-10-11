package com.fisitec.appfisio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDTO {
    private long todayAppointmentsCount;
    private long totalPatientsCount;
    private long totalTreatmentsCount;
    private List<AppointmentResponseDTO> upcomingAppointments;
    private java.math.BigDecimal totalIncomeToday;
}
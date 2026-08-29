import type { AppointmentResponseDTO } from './appointment';

export interface DashboardSummaryDTO {
    todayAppointmentsCount: number;
    totalPatientsCount: number;
    totalTreatmentsCount: number;
    upcomingAppointments: AppointmentResponseDTO[];
}
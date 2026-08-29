export type AppointmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface AppointmentResponseDTO {
    id: number;
    patientId: string;
    patientName: string;
    professionalId: string;
    professionalName: string;
    appointmentDate: string; // ISO String: "YYYY-MM-DDTHH:mm:ss"
    reason: string;
    status: AppointmentStatus | string;
}

export interface AppointmentRequestDTO {
    patientId: string;
    professionalId: string;
    appointmentDate: string;
    reason: string;
}
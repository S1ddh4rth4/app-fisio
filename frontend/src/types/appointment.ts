export type AppointmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface AppointmentRequestDTO {
    patientId: string;
    professionalId: string;
    appointmentDate: string; // ISO String: "YYYY-MM-DDTHH:mm:ss"
    reason: string;
    appointmentType?: string; // Valoración Inicial, Rehabilitación o Seguimiento
}

export interface AppointmentResponseDTO {
    id: number;
    patientId: string;
    patientName: string;
    professionalId: string;
    professionalName: string;
    appointmentDate: string;
    reason: string;
    status: AppointmentStatus | string;
    paymentStatus?: 'PENDIENTE' | 'PAGADO' | 'PAQUETE' | 'CORTESIA';
    paymentAmount?: number;
    paymentMethod?: string;
    packageName?: string;
    clinicalNotes?: string;
    treatmentName?: string;
    appointmentType?: string;
}
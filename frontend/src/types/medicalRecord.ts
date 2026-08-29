export interface MedicalRecordResponseDTO {
    id: string;
    patientId: string;
    patientName: string;
    physiotherapistId: string;
    physiotherapistName: string;
    appointmentId?: number;
    diagnosis: string;
    notes: string;
    createdAt: string;
}

export interface MedicalRecordRequestDTO {
    patientId: string;
    appointmentId?: number;
    diagnosis: string;
    notes: string;
}
export interface PrescriptionItemDTO {
    exerciseName: string;
    sets: number;
    repetitions: string;
    frequency?: string;
    notes?: string;
    videoUrl?: string;
}

export interface PrescriptionRequestDTO {
    patientIdentifier: string;
    title: string;
    generalInstructions?: string;
    startDate: string;
    endDate?: string;
    items: PrescriptionItemDTO[];
}

export interface PrescriptionResponseDTO {
    id: string;
    patientId: string;
    patientName: string;
    physiotherapistId: string;
    physiotherapistName: string;
    title: string;
    generalInstructions?: string;
    startDate: string;
    endDate?: string;
    status: 'ACTIVA' | 'COMPLETADA' | 'PAUSADA' | 'CANCELADA';
    items: PrescriptionItemDTO[];
    createdAt: string;
    updatedAt: string;
}
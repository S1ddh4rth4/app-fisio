export interface TreatmentResponseDTO {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
    physiotherapistId?: string;
    physiotherapistName?: string;
}

export interface TreatmentRequestDTO {
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
}
export interface TreatmentResponseDTO {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
}

export interface TreatmentRequestDTO {
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
}
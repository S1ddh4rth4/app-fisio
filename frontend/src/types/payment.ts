export interface PatientPackageResponseDTO {
    id: string;
    patientId: string;
    patientUsername: string;
    packageName: string;
    totalSessions: number;
    usedSessions: number;
    remainingSessions: number;
    totalPrice: number;
    paymentMethod: string;
    status: 'ACTIVO' | 'AGOTADO' | 'CANCELADO';
    createdAt: string;
}

export interface PatientPackageRequestDTO {
    patientIdentifier: string;
    packageName: string;
    totalSessions: number;
    totalPrice: number;
    paymentMethod: string;
}

export interface AppointmentPaymentUpdateDTO {
    paymentStatus: 'PENDIENTE' | 'PAGADO' | 'PAQUETE' | 'CORTESIA';
    paymentMethod?: string;
    amount?: number;
    patientPackageId?: string;
}
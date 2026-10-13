export interface PatientDTO {
    id: string;
    username: string;
    email: string;
    fullName?: string;
    phone?: string;
    mfaEnabled?: boolean;
    temporaryPassword?: string;
    roles: string[];
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePatientRequest {
    username: string;
    email: string;
    password?: string;
}
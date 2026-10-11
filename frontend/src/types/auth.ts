export interface LoginRequest {
    loginIdentifier: string; // Puede ser username o email
    password: string;
    mfaCode?: string; // Fase 6: Código opcional de Google Authenticator
}

export interface AuthResponse {
    token: string;
    username: string;
    email: string;
    roles: string; // "ROLE_ADMIN,ROLE_FISIOTERAPEUTA"
    mustChangePassword?: boolean;
}

export interface UserSession {
    username: string;
    email: string;
    roles: string[];
    token: string;
    mustChangePassword?: boolean;
}

export interface StaffUserDTO {
    id: string;
    username: string;
    email: string;
    roles: string[];
    enabled: boolean;
    createdAt?: string;
}

export interface AdminUserRequestDTO {
    username: string;
    email: string;
    password: string;
    role: string;
}
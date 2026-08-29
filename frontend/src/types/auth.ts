export interface LoginRequest {
    loginIdentifier: string; // Puede ser username o email
    password: string;
}

export interface AuthResponse {
    token: string;
    username: string;
    email: string;
    roles: string; // "ROLE_ADMIN,ROLE_FISIOTERAPEUTA"
}

export interface UserSession {
    username: string;
    email: string;
    roles: string[];
    token: string;
}
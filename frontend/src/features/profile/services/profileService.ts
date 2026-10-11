import api from '../../../api/axios';

export interface UserProfileDTO {
    id: string;
    username: string;
    email: string;
    fullName?: string;
    phone?: string;
    professionalLicense?: string;
    avatarUrl?: string;
    roles: string[];
    enabled: boolean;
    mfaEnabled?: boolean;
}

export interface UserProfileUpdateRequest {
    fullName?: string;
    phone?: string;
    professionalLicense?: string;
    avatarUrl?: string;
}

export interface MfaSetupResponse {
    secret: string;
    qrCodeImage: string;
}

export const profileService = {
    // Obtener los datos del perfil actual
    getProfile: async (): Promise<UserProfileDTO> => {
        const response = await api.get<UserProfileDTO>('/v1/users/me');
        return response.data;
    },

    // Actualizar datos personales y profesionales
    updateProfile: async (data: UserProfileUpdateRequest): Promise<UserProfileDTO> => {
        const response = await api.put<UserProfileDTO>('/v1/users/profile', data);
        return response.data;
    },

    // Cambiar contraseña de acceso
    changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
        const response = await api.post<{ message: string }>('/v1/users/change-password', data);
        return response.data;
    },

    // Iniciar configuración de 2FA (obtener QR y llave secreta)
    setupMfa: async (): Promise<MfaSetupResponse> => {
        const response = await api.post<MfaSetupResponse>('/v1/users/mfa/setup');
        return response.data;
    },

    // Confirmar código de 6 dígitos y activar 2FA
    verifyMfa: async (code: string): Promise<{ message: string }> => {
        const response = await api.post<{ message: string }>('/v1/users/mfa/verify', { code });
        return response.data;
    },

    // Desactivar 2FA
    disableMfa: async (): Promise<{ message: string }> => {
        const response = await api.post<{ message: string }>('/v1/users/mfa/disable');
        return response.data;
    },
};
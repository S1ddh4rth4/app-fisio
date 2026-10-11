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
}

export interface UserProfileUpdateRequest {
    fullName?: string;
    phone?: string;
    professionalLicense?: string;
    avatarUrl?: string;
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
};
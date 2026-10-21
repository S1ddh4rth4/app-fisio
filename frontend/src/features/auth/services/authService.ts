import api from '../../../api/axios';
import type { AuthResponse, LoginRequest } from '../../../types/auth';

export const authService = {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    forgotPassword: async (identifier: string): Promise<{ message: string }> => {
        const response = await api.post<{ message: string }>('/auth/forgot-password', { identifier });
        return response.data;
    },
};
import api from '../../../api/axios';
import type { AuthResponse, LoginRequest } from '../../../types/auth';

export const authService = {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },
};
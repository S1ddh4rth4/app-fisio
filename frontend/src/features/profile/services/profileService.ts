import api from '../../../api/axios';

export const profileService = {
    changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
        const response = await api.post<{ message: string }>('/v1/users/change-password', data);
        return response.data;
    },
};
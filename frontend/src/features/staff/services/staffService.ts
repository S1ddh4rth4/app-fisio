import api from '../../../api/axios';
import type { StaffUserDTO, AdminUserRequestDTO } from '../../../types/auth';

export const staffService = {
    // Obtener todo el personal clínico (Admin only)
    getAllStaff: async (): Promise<StaffUserDTO[]> => {
        const response = await api.get<StaffUserDTO[]>('/v1/admin/users');
        return response.data;
    },

    // Registrar nuevo miembro del personal
    createStaff: async (data: AdminUserRequestDTO): Promise<StaffUserDTO> => {
        const response = await api.post<StaffUserDTO>('/v1/admin/users', data);
        return response.data;
    },

    // Suspender o reactivar cuenta del personal
    toggleStatus: async (userId: string): Promise<StaffUserDTO> => {
        const response = await api.patch<StaffUserDTO>(`/v1/admin/users/${userId}/toggle-status`);
        return response.data;
    },

    // Eliminar personal creado por error (si no tiene actividad clínica)
    deleteByMistake: async (userId: string): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>(`/v1/admin/users/${userId}`);
        return response.data;
    },
};
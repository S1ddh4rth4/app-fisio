import api from '../../../api/axios';
import type { TreatmentRequestDTO, TreatmentResponseDTO } from '../../../types/treatment';

export const treatmentService = {
    // Obtener todos los tratamientos
    getAll: async (): Promise<TreatmentResponseDTO[]> => {
        const response = await api.get<TreatmentResponseDTO[]>('/v1/treatments');
        return response.data;
    },

    // Obtener un tratamiento por su ID
    getById: async (id: string): Promise<TreatmentResponseDTO> => {
        const response = await api.get<TreatmentResponseDTO>(`/v1/treatments/${id}`);
        return response.data;
    },

    // Crear un nuevo tratamiento (Solo ADMIN)
    create: async (data: TreatmentRequestDTO): Promise<TreatmentResponseDTO> => {
        const response = await api.post<TreatmentResponseDTO>('/v1/treatments', data);
        return response.data;
    },

    // Actualizar un tratamiento (Solo ADMIN)
    update: async (id: string, data: TreatmentRequestDTO): Promise<TreatmentResponseDTO> => {
        const response = await api.put<TreatmentResponseDTO>(`/v1/treatments/${id}`, data);
        return response.data;
    },

    // Eliminar un tratamiento (Solo ADMIN)
    delete: async (id: string): Promise<void> => {
        await api.delete(`/v1/treatments/${id}`);
    },
};
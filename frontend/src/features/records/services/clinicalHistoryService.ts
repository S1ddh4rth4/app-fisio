import api from '../../../api/axios';
import type { ClinicalHistoryRequestDTO, ClinicalHistoryResponseDTO } from '../../../types/clinicalHistory';

export const clinicalHistoryService = {
    // Obtener todas las historias de un paciente
    getByPatient: async (patientId: string): Promise<ClinicalHistoryResponseDTO[]> => {
        const response = await api.get<ClinicalHistoryResponseDTO[]>(`/v1/clinical-histories/patient/${patientId}`);
        return response.data;
    },

    // Obtener una historia por ID
    getById: async (id: string): Promise<ClinicalHistoryResponseDTO> => {
        const response = await api.get<ClinicalHistoryResponseDTO>(`/v1/clinical-histories/${id}`);
        return response.data;
    },

    // Guardar o actualizar historia clínica
    save: async (data: ClinicalHistoryRequestDTO): Promise<ClinicalHistoryResponseDTO> => {
        const response = await api.post<ClinicalHistoryResponseDTO>('/v1/clinical-histories', data);
        return response.data;
    },
};
import api from '../../../api/axios';
import type { PrescriptionRequestDTO, PrescriptionResponseDTO } from '../../../types/prescription';

export const prescriptionService = {
    getAll: async (): Promise<PrescriptionResponseDTO[]> => {
        const response = await api.get<PrescriptionResponseDTO[]>('/v1/prescriptions');
        return response.data;
    },

    getByPatient: async (patientIdentifier: string): Promise<PrescriptionResponseDTO[]> => {
        const response = await api.get<PrescriptionResponseDTO[]>(`/v1/prescriptions/patient/${patientIdentifier}`);
        return response.data;
    },

    getById: async (id: string): Promise<PrescriptionResponseDTO> => {
        const response = await api.get<PrescriptionResponseDTO>(`/v1/prescriptions/${id}`);
        return response.data;
    },

    create: async (data: PrescriptionRequestDTO): Promise<PrescriptionResponseDTO> => {
        const response = await api.post<PrescriptionResponseDTO>('/v1/prescriptions', data);
        return response.data;
    },

    updateStatus: async (id: string, status: string): Promise<PrescriptionResponseDTO> => {
        const response = await api.patch<PrescriptionResponseDTO>(`/v1/prescriptions/${id}/status`, { status });
        return response.data;
    },
};
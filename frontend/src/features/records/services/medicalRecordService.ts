import api from '../../../api/axios';
import type { MedicalRecordRequestDTO, MedicalRecordResponseDTO } from '../../../types/medicalRecord';

export const medicalRecordService = {
    // Obtener el historial clínico de un paciente
    getByPatient: async (patientId: string): Promise<MedicalRecordResponseDTO[]> => {
        const response = await api.get<MedicalRecordResponseDTO[]>(`/v1/medical-records/patient/${patientId}`);
        return response.data;
    },

    // Crear una nueva nota clínica / evolución
    create: async (data: MedicalRecordRequestDTO): Promise<MedicalRecordResponseDTO> => {
        const response = await api.post<MedicalRecordResponseDTO>('/v1/medical-records', data);
        return response.data;
    },
};
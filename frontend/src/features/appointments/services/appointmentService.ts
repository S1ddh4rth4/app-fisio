import api from '../../../api/axios';
import type { AppointmentRequestDTO, AppointmentResponseDTO } from '../../../types/appointment';

export const appointmentService = {
    // Obtener todas las citas (Admin)
    getAll: async (): Promise<AppointmentResponseDTO[]> => {
        const response = await api.get<AppointmentResponseDTO[]>('/v1/appointments');
        return response.data;
    },

    // Obtener citas de un paciente específico
    getByPatient: async (patientId: string): Promise<AppointmentResponseDTO[]> => {
        const response = await api.get<AppointmentResponseDTO[]>(`/v1/appointments/patient/${patientId}`);
        return response.data;
    },

    // Crear una nueva cita
    create: async (data: AppointmentRequestDTO): Promise<AppointmentResponseDTO> => {
        const response = await api.post<AppointmentResponseDTO>('/v1/appointments', data);
        return response.data;
    },
};
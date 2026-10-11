import api from '../../../api/axios';
import type { AppointmentRequestDTO, AppointmentResponseDTO } from '../../../types/appointment';

export const appointmentService = {
    // Obtener Doctores para la lista desplegable
    getProfessionals: async (): Promise<any[]> => {
        const response = await api.get<any[]>('/v1/users/professionals');
        return response.data;
    },

    // Obtener solo el listado de horas ocupadas para respetar la privacidad
    getOccupiedHours: async (professionalId: string, date: string): Promise<string[]> => {
        const response = await api.get<string[]>(`/v1/appointments/professional/${professionalId}/occupied-hours?date=${date}`);
        return response.data;
    },

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

    // Guardar notas clínicas (Evolución)
    updateNotes: async (id: number, notes: string): Promise<AppointmentResponseDTO> => {
        const response = await api.patch<AppointmentResponseDTO>(`/v1/appointments/${id}/notes`, { notes });
        return response.data;
    },

    // ÉPICA 4: Procesar cobro rápido
    processPayment: async (id: number, treatmentId: string, paymentMethod: string): Promise<AppointmentResponseDTO> => {
        const response = await api.patch<AppointmentResponseDTO>(`/v1/appointments/${id}/pay`, { treatmentId, paymentMethod });
        return response.data;
    },
};
import api from '../client';
import type { Consultation, ApiResponse } from '../../types/common.types';
import type {
    MasterResources,
    ReschedulePayload,
    CancelPayload,
    ClinicalNotesPayload,
    ChiefComplaintsPayload,
    ConsultationBilling,
    InvoiceRecord
} from '../../types/consult.types';

export const ConsultService = {
    // ==========================================
    // Part 1: Master Resources Directory
    // ==========================================

    /**
     * Fetches the available catalog of active resources required for booking an appointment.
     * Endpoint: GET /api/v1/resource/masters
     */
    getMasterResources: async (): Promise<MasterResources> => {
        const response = await api.get('resource/masters');
        return response.data?.data ?? response.data;
    },

    // ==========================================
    // Part 2: The Consultation Core
    // ==========================================

    /**
     * Retrieves a scheduled list of appointments.
     * Endpoint: GET /api/v1/resource/consults
     */
    listConsultations: async (params?: {
        sort_order?: 'asc' | 'desc';
        limit?: number;
        page?: number;
        [key: string]: unknown;
    }): Promise<Consultation[]> => {
        const response = await api.get('resource/consults', { params: {
            sort_order: 'asc',
            limit: 10,
            page: 1,
            ...params
        }});
        const data = response.data?.data ?? response.data;
        return Array.isArray(data) ? data : data?.consults || [];
    },

    /**
     * Schedules a new appointment (Virtual, Home, or Clinic) and synchronizes with TeleConsult.
     * Endpoint: POST /api/v1/resource/consults
     */
    createConsultation: async (data: Partial<Consultation>): Promise<ApiResponse<Consultation>> => {
        const response = await api.post('resource/consults', data);
        return response.data;
    },

    /**
     * Endpoint: PATCH /api/v1/resource/consults/:id/reschedule
     */
    rescheduleConsultation: async (id: string, payload: ReschedulePayload): Promise<Consultation> => {
        const response = await api.patch(`resource/consults/${id}/reschedule`, payload);
        return response.data?.data ?? response.data;
    },

    /**
     * Endpoint: PATCH /api/v1/resource/consults/:id/cancel
     */
    cancelConsultation: async (id: string, payload?: CancelPayload): Promise<{ success: boolean; data?: unknown }> => {
        const response = await api.patch(`resource/consults/${id}/cancel`, payload || { reason: 'System termination' });
        return response.data;
    },

    // ==========================================
    // Part 2.4: Clinical Integrations
    // ==========================================

    /**
     * Binds medical notes at the termination of the consult.
     * Endpoint: POST /api/v1/resource/consults/:id/notes
     */
    addClinicalNotes: async (id: string, payload: ClinicalNotesPayload): Promise<ApiResponse<unknown>> => {
        const response = await api.post(`resource/consults/${id}/notes`, payload);
        return response.data;
    },

    /**
     * Fetches the medical notes attached to this specific visit.
     * Endpoint: GET /api/v1/resource/consults/:id/clinical-record
     */
    getVisitClinicalRecord: async (id: string): Promise<ApiResponse<unknown>> => {
        const response = await api.get(`resource/consults/${id}/clinical-record`);
        return response.data;
    },

    /**
     * Endpoint: POST /api/v1/resource/consults/:id/chief-complaints
     */
    addVisitSymptoms: async (id: string, payload: ChiefComplaintsPayload): Promise<ApiResponse<unknown>> => {
        const response = await api.post(`resource/consults/${id}/chief-complaints`, payload);
        return response.data;
    },

    // ==========================================
    // Part 2.5: Billing & Invoicing
    // ==========================================

    /**
     * Endpoint: GET /api/v1/resource/consults/:id/billing
     */
    fetchDueBilling: async (id: string): Promise<ConsultationBilling> => {
        const response = await api.get(`resource/consults/${id}/billing`);
        return response.data?.data ?? response.data;
    },

    /**
     * Triggers PDF generation and applies ChargeCodes + TaxCodes.
     * Endpoint: POST /api/v1/resource/consults/:id/invoice
     */
    generateInvoice: async (id: string): Promise<InvoiceRecord> => {
        const response = await api.post(`resource/consults/${id}/invoice`);
        return response.data?.data ?? response.data;
    },

    // ==========================================
    // Legacy / Admin Aliases
    // ==========================================

    createConsultationAdmin: async (data: Partial<Consultation>): Promise<Consultation> => {
        const response = await api.post('consultations', data);
        return response.data?.data ?? response.data;
    },

    updateConsultation: async (id: string, data: Partial<Consultation>): Promise<Consultation> => {
        const response = await api.patch(`resource/consults/${id}`, data);
        return response.data?.data ?? response.data;
    }
};

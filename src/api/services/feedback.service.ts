import api from '../client';
import type { 
    AppRatingRequest, 
    AppRatingResponse, 
    FeedbackRequest, 
    FeedbackResponse, 
    TicketHistoryResponse
} from '../../types/feedback.types';

export const FeedbackService = {
    /**
     * Submit a support ticket or general feedback
     */
    submitTicket: async (data: FeedbackRequest): Promise<FeedbackResponse> => {
        const response = await api.post('feedback', data);
        return response.data;
    },

    /**
     * Get ticket history for the authenticated user
     */
    getMyTickets: async (): Promise<TicketHistoryResponse> => {
        const response = await api.get('feedback/my');
        return response.data;
    },

    /**
     * Submit an app rating (1-5 stars) with optional message
     */
    submitRating: async (data: AppRatingRequest): Promise<AppRatingResponse> => {
        const response = await api.post('feedback/rate', data);
        return response.data;
    },
    
    /**
     * Get the latest app rating from the authenticated user
     */
    getLatestRating: async (): Promise<any> => {
        const response = await api.get('feedback/latest-rating');
        return response.data;
    },

    /**
     * [ADMIN] List all tickets across the system
     */
    listAllTickets: async (params?: { 
        status?: string; 
        category?: string; 
        page?: number; 
        limit?: number 
    }): Promise<TicketHistoryResponse> => {
        const response = await api.get('feedback', { params });
        return response.data;
    },

    /**
     * [ADMIN] Update a ticket's status or add admin notes
     */
    updateTicketStatus: async (id: string, data: { 
        status: string; 
        adminNotes?: string 
    }): Promise<FeedbackResponse> => {
        const response = await api.put(`feedback/${id}`, data);
        return response.data;
    }
};

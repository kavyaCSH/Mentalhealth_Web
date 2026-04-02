export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type FeedbackCategory = 'support' | 'bug' | 'feature_request' | 'complaint' | 'other';

export interface SupportTicket {
    _id: string;
    userId?: string;
    subject: string;
    message: string;
    category: FeedbackCategory;
    status: TicketStatus;
    adminNotes?: string;
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
}

export interface FeedbackRequest {
    subject: string;
    message: string;
    category?: FeedbackCategory;
}

export interface FeedbackResponse {
    code: number;
    message: string;
    data: SupportTicket;
}

export interface TicketHistoryResponse {
    code: number;
    message: string;
    data: SupportTicket[];
}

export interface AppRatingRequest {
    rating: number;
    message?: string;
}

export interface AppRatingResponse {
    code: number;
    message: string;
}

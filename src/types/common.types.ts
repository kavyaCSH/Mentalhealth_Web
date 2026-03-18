export interface Notification {
    id: string;
    _id?: string;
    title?: string;
    message: string;
    read: boolean;
    isRead?: boolean;
    type?: string;
    createdAt?: string;
    created_at?: string;
    patientName?: string;
}

export interface ConsultStatus {
    id: number;
    name: string;
    slug: string;
}

export interface Consultation {
    consult_id?: string | number;
    id: string;
    _id?: string;
    scheduled_at: string;
    reason: string;
    consult_type: 'virtual' | 'in_person';
    status: 'scheduled' | 'completed' | 'cancelled' | 'pending' | 'ongoing';
    consult_status?: string | ConsultStatus;
    consult_current_status?: string | ConsultStatus;
    participants: Participant[];
    totalPrice?: number | string;
    createdAt: string;
    additional_info?: {
        notes?: string;
        referred_by?: string;
    };
    started_participant_id?: number;
    patient_id?: string | number;
    patientId?: string | number;
    token?: string;
    publisher_token?: string;
    subscriber_token?: string;
    active?: boolean;
}

export interface Participant {
    participant_type: {
        id: number;
        code: string;
        name: string;
    };
    ref_number: string;
    name?: string;
    role?: string;
    token?: string;
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
    participant_info?: Record<string, unknown>;
    additional_info?: Record<string, unknown>;
    id?: string;
    _id?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    code?: number;
}

export interface Transaction extends Consultation {
    id: string;
    amount: number;
    description: string;
    type: 'income' | 'expense';
    date: string;
}

export interface TaxCode {
    id: string;
    _id?: string;
    code: string;
    name: string;
    rate: number;
    description?: string;
    is_active?: boolean;
    createdAt?: string;
}

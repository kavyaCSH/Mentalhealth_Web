export interface Notification {
    id: string;
    _id?: string;
    message: string;
    read: boolean;
    type?: string;
    createdAt?: string;
}

export interface Consultation {
    consult_id?: string | number;
    id: string;
    _id?: string;
    scheduled_at: string;
    reason: string;
    consult_type: 'virtual' | 'in_person';
    status: 'scheduled' | 'completed' | 'cancelled' | 'pending' | 'ongoing';
    participants: Participant[];
    totalPrice?: number | string;
    createdAt: string;
    additional_info?: {
        notes?: string;
        referred_by?: string;
    };
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
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
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

export interface MasterResourceProvider {
    id: string | number;
    name: string;
    specialization: string;
}

export interface MasterResourceHospital {
    id: string | number;
    name: string;
}

export interface MasterResources {
    hospitals: MasterResourceHospital[];
    providers: MasterResourceProvider[];
}

export interface ReschedulePayload {
    new_scheduled_at: string;
}

export interface CancelPayload {
    reason: string;
}

export interface ClinicalNotesPayload {
    notes: string;
    diagnostics?: string;
    outcome?: string;
}

export interface ChiefComplaintsPayload {
    complaints: string[];
    severity: string;
    duration: string;
}

export interface ConsultationBilling {
    id: string;
    status: 'pending' | 'paid' | 'overdue';
    amount_due: number;
    billing_date: string;
    consultation_id: string;
}

export interface InvoiceRecord {
    invoice_id: string;
    pdf_url: string;
    issued_at: string;
    total: number;
    patient_id: string;
    status: string;
}

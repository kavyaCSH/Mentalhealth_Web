export type AuditAction = 'WRITE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';

export type AuditResource = 
    | 'Question' 
    | 'User' 
    | 'Hospital' 
    | 'ChargeCode' 
    | 'TaxCode' 
    | 'Consultation' 
    | 'Assessment'
    | 'ChiefComplaint';

export interface AuditLog {
    _id: string;
    id?: string;
    user: {
        id: string | number;
        name: string;
        role: string;
    };
    action: AuditAction;
    resource: AuditResource;
    resourceId?: string | number;
    description: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}

export interface AuditLogsResponse {
    success: boolean;
    data: {
        logs: AuditLog[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    };
}

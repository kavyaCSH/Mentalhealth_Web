export interface SystemSetting {
    _id?: string;
    key: string;
    value: string;
    description?: string;
    category?: 'general' | 'clinical' | 'communication' | 'maintenance' | string;
    updatedAt?: string;
}

export interface ApiAccessRule {
    _id?: string;
    id?: string;
    role_code: string;
    resource: string;
    permissions: ('create' | 'read' | 'update' | 'delete')[];
    createdAt?: string;
}

export interface SystemSettingResponse {
    code: number;
    message: string;
    data: SystemSetting;
}

export interface SystemSettingsListResponse {
    success: boolean;
    data: SystemSetting[];
}

export interface ApiAccessListResponse {
    success: boolean;
    data: ApiAccessRule[];
}

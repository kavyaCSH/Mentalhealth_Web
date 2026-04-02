export interface SystemSetting {
    key: string;
    value: string;
    updatedAt: string;
}

export interface SystemSettingResponse {
    code: number;
    message: string;
    data: SystemSetting;
}

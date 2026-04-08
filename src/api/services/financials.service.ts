import api from '../client';
import type { TaxCode, ChargeCode } from '../../types/common.types';

export const FinancialsService = {
    createTaxCode: async (data: Partial<TaxCode>): Promise<TaxCode> => {
        const response = await api.post('tax-codes', data);
        return response.data?.data ?? response.data;
    },
    listTaxCodes: async (): Promise<TaxCode[]> => {
        const response = await api.get('tax-codes');
        const resData = response.data?.data ?? response.data;

        // Handle various response patterns: direct array, data.tax_codes, data.taxCodes, or data.masters
        if (Array.isArray(resData)) return resData;
        return resData?.tax_codes || resData?.taxCodes || resData?.masters || [];
    },
    updateTaxCode: async (id: string | number, data: Partial<TaxCode>): Promise<TaxCode> => {
        const response = await api.patch(`tax-codes/${id}`, data);
        return response.data?.data ?? response.data;
    },
    deleteTaxCode: async (id: string | number): Promise<{ success: boolean }> => {
        const response = await api.delete(`tax-codes/${id}`);
        return response.data;
    },

    // Charge Codes
    createChargeCode: async (data: Partial<ChargeCode>): Promise<ChargeCode> => {
        const response = await api.post('charge-codes', data);
        return response.data?.data ?? response.data;
    },
    listChargeCodes: async (specialistId?: string | number): Promise<ChargeCode[]> => {
        const params = specialistId ? { specialist_id: specialistId } : {};
        const response = await api.get('charge-codes', { params });
        const resData = response.data?.data ?? response.data;

        if (Array.isArray(resData)) return resData;
        return resData?.charge_codes || resData?.chargeCodes || resData?.masters || [];
    },
    updateChargeCode: async (id: string | number, data: Partial<ChargeCode>): Promise<ChargeCode> => {
        const response = await api.put(`charge-codes/${id}`, data);
        return response.data?.data ?? response.data;
    },
    deleteChargeCode: async (id: string | number): Promise<{ success: boolean }> => {
        const response = await api.delete(`charge-codes/${id}`);
        return response.data;
    }
};

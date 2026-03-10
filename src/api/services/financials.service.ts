import api from '../client';
import type { TaxCode } from '../../types/common.types';

export const FinancialsService = {
    createTaxCode: async (data: Partial<TaxCode>): Promise<TaxCode> => {
        const response = await api.post('/tax-codes', data);
        return response.data?.data ?? response.data;
    },
    listTaxCodes: async (): Promise<TaxCode[]> => {
        const response = await api.get('/tax-codes');
        const resData = response.data?.data ?? response.data;

        // Handle various response patterns: direct array, data.tax_codes, data.taxCodes, or data.masters
        if (Array.isArray(resData)) return resData;
        return resData?.tax_codes || resData?.taxCodes || resData?.masters || [];
    },
    updateTaxCode: async (id: string, data: Partial<TaxCode>): Promise<TaxCode> => {
        const response = await api.patch(`/tax-codes/${id}`, data);
        return response.data?.data ?? response.data;
    },
    deleteTaxCode: async (id: string): Promise<{ success: boolean }> => {
        const response = await api.delete(`/tax-codes/${id}`);
        return response.data;
    }
};

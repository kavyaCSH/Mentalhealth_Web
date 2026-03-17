import api from '../client';

export interface HelpTopic {
    id: string;
    title: string;
    slug: string;
    preview: string;
}

export interface HelpContent {
    id: string;
    title: string;
    slug: string;
    content: string;
    updatedAt?: string;
}

export const PortalService = {
    getHelpCenter: async () => {
        const response = await api.get('/portal/help-center');
        return response.data?.data ?? response.data;
    },
    getPortalContent: async (slug: string) => {
        const response = await api.get(`/portal/content/${slug}`);
        return response.data?.data ?? response.data;
    }
};

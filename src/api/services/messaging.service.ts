import api from '../client';

export const MessagingService = {
    getConversations: async () => {
        const response = await api.get('/resource/messages/conversations');
        return response.data?.data ?? response.data;
    },
    getMessagesByConversation: async (conversationId: string) => {
        const response = await api.get(`/resource/messages/${conversationId}`);
        return response.data?.data ?? response.data;
    },
    sendMessage: async (data: { recipientId: string; content: string }) => {
        const response = await api.post('/resource/messages', data);
        return response.data;
    }
};

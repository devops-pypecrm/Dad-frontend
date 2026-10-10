import { api } from './api';

export interface WhatsAppMessage {
    id: string;
    conversationId: string;
    phoneNumber: string;
    direction: 'incoming' | 'outgoing';
    messageType: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'template' | 'interactive';
    content: {
        text?: string;
        mediaUrl?: string;
        mediaType?: string;
        fileName?: string;
        caption?: string;
        latitude?: number;
        longitude?: number;
        templateName?: string;
        templateParams?: string[];
    };
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    waMessageId?: string;
    errorCode?: string;
    errorMessage?: string;
    sentAt?: string;
    deliveredAt?: string;
    readAt?: string;
    createdAt: string;
    updatedAt: string;
    agent?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    lead?: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
    };
    contact?: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string;
        phones?: string[];
    };
}

export interface WhatsAppTemplate {
    id: string;
    name: string;
    status: string;
    category: string;
    language: string;
    components: Array<Record<string, unknown>>;
}

export interface SendMessageRequest {
    to: string;
    message?: string;
    type?: 'text' | 'template';
    templateName?: string;
    languageCode?: string;
    components?: Array<Record<string, unknown>>;
}

export const sendWhatsAppMessage = async (data: SendMessageRequest) => {
    const response = await api.post('/whatsapp/send', data);
    return response.data;
};

export const getWhatsAppMessages = async (phoneNumber?: string, limit = 50, offset = 0) => {
    const response = await api.get('/whatsapp/messages', {
        params: { phoneNumber, limit, offset }
    });
    return response.data;
};

export const getWhatsAppTemplates = async () => {
    const response = await api.get('/whatsapp/templates');
    return response.data;
};

export const testWhatsAppConnection = async () => {
    const response = await api.post('/whatsapp/test');
    return response.data;
};

export const getWhatsAppCampaigns = async () => {
    const response = await api.get('/whatsapp-campaigns');
    return response.data;
};

export const getWhatsAppStatistics = async () => {
    const response = await api.get('/whatsapp/messages/statistics');
    return response.data;
};

export interface WhatsAppConnectionStatus {
    connected: boolean;
    healthy?: boolean;
    phoneNumberId?: string;
    wabaId?: string;
    phoneNumber?: string;
    verifiedName?: string;
    qualityRating?: string;
    messagingTier?: string | null;
    accountId?: string | null;
    accountsCount?: number;
    error?: string;
}

export interface CreateTemplateRequest {
    name: string;
    category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
    language: string;
    components: Array<Record<string, unknown>>;
}

export const getWhatsAppConnection = async (): Promise<WhatsAppConnectionStatus> => {
    const response = await api.get('/whatsapp/connection');
    return response.data;
};

export const createWhatsAppTemplate = async (data: CreateTemplateRequest) => {
    const response = await api.post('/whatsapp/templates', data);
    return response.data;
};

export const deleteWhatsAppTemplate = async (name: string) => {
    const response = await api.delete(`/whatsapp/templates/${encodeURIComponent(name)}`);
    return response.data;
};

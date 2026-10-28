import { api } from './api';

export interface Contact {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phones?: {
        type: string;
        number: string;
    }[];
    jobTitle?: string;
    department?: string;
    account?: {
        id: string;
        name: string;
    };
    owner?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    isBlocked?: boolean;
    blockedAt?: string | null;
    blockedReason?: string | null;
    createdAt: string;
}

export interface ContactLead {
    id: string;
    firstName: string;
    lastName?: string | null;
    phone: string;
    status: string;
    source: string;
    createdAt: string;
    isReEnquiry?: boolean;
    reEnquiryCount?: number;
    ownerFirstName?: string | null;
    ownerLastName?: string | null;
}

export interface ContactQueryParams {
    account?: string;
    owner?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface CreateContactData {
    firstName: string;
    lastName: string;
    email?: string;
    phones?: {
        type: string;
        number: string;
    }[];
    jobTitle?: string;
    department?: string;
    account?: string;
    owner?: string;
}

export type UpdateContactData = Partial<CreateContactData>;

export const getContacts = async (params?: ContactQueryParams) => {
    const response = await api.get('/contacts', { params });
    return response.data;
};

export const getContactById = async (id: string) => {
    const response = await api.get(`/contacts/${id}`);
    return response.data;
};

export const createContact = async (data: CreateContactData) => {
    try {
        const response = await api.post('/contacts', data);
        return response.data;
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown } };
        throw err.response?.data || error;
    }
};

export const updateContact = async (id: string, data: UpdateContactData) => {
    const response = await api.put(`/contacts/${id}`, data);
    return response.data;
};

export const deleteContact = async (id: string) => {
    const response = await api.delete(`/contacts/${id}`);
    return response.data;
};

export const getBlockedContacts = async (): Promise<{ contacts: Contact[] }> => {
    const response = await api.get('/contacts/blocked');
    return response.data;
};

export const blockContact = async (id: string, reason?: string) => {
    const response = await api.post(`/contacts/${id}/block`, { reason });
    return response.data;
};

export const unblockContact = async (id: string) => {
    const response = await api.post(`/contacts/${id}/unblock`);
    return response.data;
};

export const getContactLeads = async (id: string): Promise<{ leads: ContactLead[] }> => {
    const response = await api.get(`/contacts/${id}/leads`);
    return response.data;
};

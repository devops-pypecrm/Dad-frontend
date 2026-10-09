import { api } from './api';

export interface WebFormField {
    label: string;
    name: string;
    type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
    required: boolean;
    placeholder?: string;
    options?: string[];
}

export interface WebForm {
    id: string;
    name: string;
    description?: string;
    fields: WebFormField[];
    submitAction: string; // 'message', 'redirect'
    submitMessage?: string;
    redirectUrl?: string;
    status: 'active' | 'inactive';
    isActive: boolean;
    submissionsCount: number;
    createdAt: string;
}

export interface WebFormSubmission {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
    customFields?: Record<string, unknown>;
    createdAt: string;
    isReEnquiry?: boolean;
}

export interface WebFormSubmissionsResponse {
    form: { id: string; name: string; fields: WebFormField[] };
    submissions: WebFormSubmission[];
    pagination: { total: number; page: number; limit: number; pages: number };
}

export interface CreateWebFormData {
    name: string;
    description?: string;
    fields?: WebFormField[];
    status?: 'active' | 'inactive';
    submitAction?: string;
    submitMessage?: string;
    redirectUrl?: string;
}

export const getWebForms = async () => {
    const response = await api.get<WebForm[]>('/web-forms');
    return response.data;
};

export const createWebForm = async (data: CreateWebFormData) => {
    const response = await api.post<WebForm>('/web-forms', data);
    return response.data;
};

export const updateWebForm = async (id: string, data: Partial<CreateWebFormData>) => {
    const response = await api.put<WebForm>(`/web-forms/${id}`, data);
    return response.data;
};

export const deleteWebForm = async (id: string) => {
    await api.delete(`/web-forms/${id}`);
};

export const getWebFormSubmissions = async (id: string, page = 1, limit = 50) => {
    const response = await api.get<WebFormSubmissionsResponse>(`/web-forms/${id}/submissions`, {
        params: { page, limit }
    });
    return response.data;
};

export interface PublicWebForm {
    id: string;
    name: string;
    description?: string;
    fields: WebFormField[];
    submitAction: string;
    submitMessage?: string;
    redirectUrl?: string;
}

export const getPublicWebForm = async (id: string) => {
    const response = await api.get<PublicWebForm>(`/public/webforms/${id}`);
    return response.data;
};

export const submitPublicWebForm = async (id: string, data: Record<string, unknown>) => {
    const response = await api.post<{ message: string; isReEnquiry?: boolean }>(`/public/webforms/${id}/submit`, data);
    return response.data;
};

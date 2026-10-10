import { api } from './api';

/** Starts the Meta connect flow. Shared by every "Connect WhatsApp" button in the hub. */
export async function startWhatsAppConnect(returnPath: string) {
  const { data } = await api.get('/meta/auth', { params: { type: 'whatsapp', returnPath } });
  window.location.href = data.url;
}

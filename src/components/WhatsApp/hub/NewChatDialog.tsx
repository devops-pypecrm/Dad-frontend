import { useState } from 'react';
import { toast } from 'sonner';
import { Send, FileText } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WA_OUTLINE_BTN, WA_PRIMARY_BTN } from './whatsappStyles';
import TemplatePicker from '../TemplatePicker';
import { inboxApi } from '@/services/whatsAppHubService';
import { apiErrorMessage } from '@/lib/apiError';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the conversation id once a message has been sent. */
  onSent: (conversationId: string) => void;
}

/**
 * Start a conversation with any number. WhatsApp only allows a business to open a
 * conversation with an approved template; free text works for people who messaged
 * you within the last 24 hours.
 */
export function NewChatDialog({ open, onOpenChange, onSent }: Props) {
  const [phone, setPhone] = useState('+91');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [pickingTemplate, setPickingTemplate] = useState(false);

  const digits = phone.replace(/\D/g, '');
  const phoneValid = /^[1-9]\d{7,14}$/.test(digits);

  const finish = (conversationId: string) => {
    onSent(conversationId);
    onOpenChange(false);
    setText('');
  };

  const sendText = async () => {
    setSending(true);
    try {
      const r = await inboxApi.start({ phone: `+${digits}`, text });
      toast.success('Message sent');
      finish(r.conversationId);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to send message'));
    } finally {
      setSending(false);
    }
  };

  const sendTemplate = async (template: { name: string; language: string }, variables: Record<string, string>) => {
    setPickingTemplate(false);
    setSending(true);
    try {
      const values = Object.keys(variables).sort((a, b) => Number(a) - Number(b)).map(k => variables[k]);
      const r = await inboxApi.start({ phone: `+${digits}`, template: { name: template.name, language: template.language, values } });
      toast.success('Template message sent');
      finish(r.conversationId);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to send template'));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New WhatsApp message</DialogTitle>
            <DialogDescription>
              To start a new conversation, use an approved template. Free text is delivered only if they messaged you in the last 24 hours.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wa-new-phone">Phone number (with country code)</Label>
              <Input id="wa-new-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+919876543210" />
              {!phoneValid && phone.length > 3 && <p className="text-xs text-destructive">Enter a valid international number.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa-new-text">Message</Label>
              <Textarea id="wa-new-text" rows={3} value={text} onChange={e => setText(e.target.value)} placeholder="Type a message…" />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" className={WA_OUTLINE_BTN} disabled={!phoneValid || sending} onClick={() => setPickingTemplate(true)}>
              <FileText className="h-4 w-4 mr-2" /> Use template
            </Button>
            <Button className={WA_PRIMARY_BTN} disabled={!phoneValid || !text.trim() || sending} onClick={sendText}>
              <Send className="h-4 w-4 mr-2" /> {sending ? 'Sending…' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pickingTemplate && <TemplatePicker onSelect={sendTemplate} onClose={() => setPickingTemplate(false)} />}
    </>
  );
}

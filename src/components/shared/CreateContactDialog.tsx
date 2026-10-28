import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createContact, type CreateContactData } from '@/services/contactService';
import { getAccounts } from '@/services/accountService';
import { Loader2, Contact as ContactIcon } from 'lucide-react';
import { V2 } from '@/lib/uiV2';
import { toast } from 'sonner';
import DynamicCustomFields from '@/components/forms/DynamicCustomFields';

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (contactId: string) => void;
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  jobTitle: '',
  account: '',
  phones: [{ type: 'mobile', number: '' }] as { type: string; number: string }[],
};

export function CreateContactDialog({ open, onOpenChange, onSuccess }: CreateContactDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>({});
  const [formData, setFormData] = useState(EMPTY_FORM);

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => getAccounts(),
    enabled: open,
  });
  const accounts = accountsData?.accounts || [];

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (index: number, value: string) => {
    setFormData(prev => {
      const phones = [...prev.phones];
      phones[index] = { ...phones[index], number: value };
      return { ...prev, phones };
    });
  };

  const addPhone = () => {
    setFormData(prev => ({ ...prev, phones: [...prev.phones, { type: 'mobile', number: '' }] }));
  };

  const removePhone = (index: number) => {
    setFormData(prev => ({ ...prev, phones: prev.phones.filter((_, i) => i !== index) }));
  };

  const resetAndClose = () => {
    setFormData(EMPTY_FORM);
    setCustomFieldValues({});
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }

    if (!formData.phones.some(p => p.number.trim())) {
      toast.error('A mobile number is required');
      return;
    }

    setIsLoading(true);
    try {
      const payload: CreateContactData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || undefined,
        jobTitle: formData.jobTitle || undefined,
        account: formData.account || undefined,
        phones: formData.phones.filter(p => p.number.trim()),
        ...(Object.keys(customFieldValues).length > 0 ? { customFields: customFieldValues } as any : {}),
      };
      const contact = await createContact(payload);
      toast.success('Contact created successfully');
      resetAndClose();
      onSuccess(contact.id);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || 'Failed to create contact');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) resetAndClose(); else onOpenChange(next); }}>
      <DialogContent className={`sm:max-w-[500px] max-h-[90vh] overflow-y-auto ${V2.dialog}`}>
        <DialogHeader>
          <DialogTitle className={V2.dialogTitle}><span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))]"><ContactIcon strokeWidth={1.5} className="h-5 w-5" /></span>Add Contact</DialogTitle>
          <DialogDescription className="font-poppins text-sm">Create a new person record.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={V2.label} htmlFor="firstName">First Name</Label>
              <Input className={V2.input} id="firstName" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label className={V2.label} htmlFor="lastName">Last Name <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
              <Input className={V2.input} id="lastName" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className={V2.label} htmlFor="email">Email</Label>
            <Input className={V2.input} id="email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label className={V2.label} htmlFor="jobTitle">Job Title</Label>
            <Input className={V2.input} id="jobTitle" value={formData.jobTitle} onChange={(e) => handleChange('jobTitle', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label className={V2.label}>Account <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
            <Select value={formData.account || 'none'} onValueChange={(v) => handleChange('account', v === 'none' ? '' : v)}>
              <SelectTrigger className={V2.input}><SelectValue placeholder="No account" /></SelectTrigger>
              <SelectContent className="rounded-[10px]">
                <SelectItem value="none" className="rounded-[10px]">No account</SelectItem>
                {accounts.map((a: { id: string; name: string }) => (
                  <SelectItem key={a.id} value={a.id} className="rounded-[10px]">{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className={V2.label}>Mobile number(s) <span className="text-destructive">*</span></Label>
            {formData.phones.map((phone, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input className={V2.input}
                  placeholder="Number"
                  value={phone.number}
                  onChange={(e) => handlePhoneChange(index, e.target.value)}
                />
                {formData.phones.length > 1 && (
                  <Button type="button" variant="outline" size="sm" className="h-9 rounded-[10px] text-xs" onClick={() => removePhone(index)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addPhone} className="w-full h-9 rounded-[10px] text-xs border-dashed text-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5))]/5 hover:text-[hsl(var(--chart-5))]">
              + Add Phone
            </Button>
          </div>

          <DynamicCustomFields
            entityType="Contact"
            values={customFieldValues}
            onChange={(name, value) => setCustomFieldValues(prev => ({ ...prev, [name]: value }))}
          />

          <DialogFooter>
            <Button type="button" variant="outline" className={V2.btnOutline} onClick={resetAndClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading} className={V2.btnPrimary}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Contact
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

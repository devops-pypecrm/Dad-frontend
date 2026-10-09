import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageLoader } from '@/components/ui/page-loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2 } from 'lucide-react';
import {
  getPublicWebForm,
  submitPublicWebForm,
  type PublicWebForm,
} from '@/services/webFormService';

export default function WebFormView() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<PublicWebForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!id) return;
    getPublicWebForm(id)
      .then((data) => setForm(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader text="Loading form..." />;

  if (notFound || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] px-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Form not found</h1>
          <p className="text-muted-foreground mt-1">This form may be inactive or no longer exists.</p>
        </div>
      </div>
    );
  }

  const fields = form.fields || [];

  const handleChange = (name: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { customFields: {} };
      const customFields: Record<string, unknown> = {};
      fields.forEach((f) => {
        const v = values[f.name];
        if (['firstName', 'lastName', 'email', 'phone', 'company'].includes(f.name)) {
          payload[f.name] = v;
        } else {
          customFields[f.name] = v;
        }
      });
      payload.customFields = customFields;

      const result = await submitPublicWebForm(id, payload);
      if (form.submitAction === 'redirect' && form.redirectUrl) {
        window.location.href = form.redirectUrl;
        return;
      }
      setSubmitted(true);
      void result;
    } catch {
      // keep the form visible so the visitor can retry
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] px-6">
        <div className="max-w-md text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-[hsl(var(--chart-5)/0.15)] flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-[hsl(var(--chart-5))]" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            {form.submitMessage || 'Thank you! We will be in touch soon.'}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] py-10 px-4 flex justify-center font-poppins">
      <div className="w-full max-w-xl">
        <div className="rounded-[20px] bg-card shadow-sm border border-border overflow-hidden">
          <div className="h-2 bg-[hsl(var(--chart-5))]" />
          <div className="p-8">
            <h1 className="text-2xl font-bold text-foreground">{form.name}</h1>
            {form.description && (
              <p className="text-muted-foreground mt-2">{form.description}</p>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {fields.map((f) => (
                <div key={f.name} className="space-y-2">
                  <Label htmlFor={f.name}>
                    {f.label}
                    {f.required && <span className="text-destructive ml-1">*</span>}
                  </Label>

                  {f.type === 'textarea' ? (
                    <Textarea
                      id={f.name}
                      placeholder={f.placeholder}
                      required={f.required}
                      value={(values[f.name] as string) || ''}
                      onChange={(e) => handleChange(f.name, e.target.value)}
                    />
                  ) : f.type === 'select' ? (
                    <Select
                      required={f.required}
                      value={(values[f.name] as string) || ''}
                      onValueChange={(v) => handleChange(f.name, v)}
                    >
                      <SelectTrigger id={f.name}>
                        <SelectValue placeholder={f.placeholder || 'Select an option'} />
                      </SelectTrigger>
                      <SelectContent>
                        {(f.options || []).map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : f.type === 'checkbox' ? (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={f.name}
                        checked={!!values[f.name]}
                        onCheckedChange={(v) => handleChange(f.name, !!v)}
                      />
                      <Label htmlFor={f.name} className="font-normal text-sm text-muted-foreground">
                        {f.placeholder || 'Yes'}
                      </Label>
                    </div>
                  ) : (
                    <Input
                      id={f.name}
                      type={f.type === 'email' ? 'email' : f.type === 'phone' ? 'tel' : 'text'}
                      placeholder={f.placeholder}
                      required={f.required}
                      value={(values[f.name] as string) || ''}
                      onChange={(e) => handleChange(f.name, e.target.value)}
                    />
                  )}
                </div>
              ))}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5)/0.9)] text-white rounded-[10px] h-11"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </form>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">Powered by PypeCRM</p>
      </div>
    </div>
  );
}

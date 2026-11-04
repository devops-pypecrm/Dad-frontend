import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calculator, RefreshCw, Settings2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { deleteIncentiveConfig, getIncentiveConfig, recalculateIncentives, updateIncentiveConfig, type IncentiveConfig } from '@/services/commissionService';
import { apiErrorMessage } from '@/lib/apiError';

const fallback: IncentiveConfig = { enabled: false, calculationType: 'percentage', value: 5, minimumDealAmount: 0, defaultStatus: 'pending' };

export function IncentiveSettingsDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<IncentiveConfig>(fallback);
  const { data } = useQuery({ queryKey: ['incentive-config'], queryFn: getIncentiveConfig, enabled: open });
  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: updateIncentiveConfig,
    onSuccess: (config) => {
      queryClient.setQueryData(['incentive-config'], config);
      toast.success('Incentive rule saved');
      setOpen(false);
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Could not save incentive rule')),
  });
  const calculate = useMutation({
    mutationFn: recalculateIncentives,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success(`${result.created} incentive${result.created === 1 ? '' : 's'} created; ${result.skipped} skipped`);
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Could not calculate incentives')),
  });
  const remove = useMutation({
    mutationFn: deleteIncentiveConfig,
    onSuccess: ({ config }) => {
      queryClient.setQueryData(['incentive-config'], config);
      setForm(config);
      toast.success('Incentive rule deleted');
      setOpen(false);
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Could not delete incentive rule')),
  });

  const handleDelete = () => {
    if (window.confirm('Delete this incentive rule? Existing incentive payouts will not be removed.')) remove.mutate();
  };

  const valid = form.value > 0 && form.minimumDealAmount >= 0 && (form.calculationType !== 'percentage' || form.value <= 100);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" className="h-9 gap-2 rounded-[10px] text-xs sm:text-sm"><Settings2 className="h-3.5 w-3.5" />Incentive rules</Button></DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-3rem)] overflow-y-auto border-border bg-card p-0 sm:max-w-[540px] sm:rounded-xl">
        <DialogHeader className="border-b border-border px-6 py-4 pr-12">
          <div><DialogTitle className="text-lg">Incentive rule</DialogTitle><DialogDescription className="mt-1 text-sm">Create payouts automatically from closed-won deals.</DialogDescription></div>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-muted/20 px-3 py-2.5">
            <div><p className="text-sm font-medium text-foreground">Automatic calculation</p><p className="text-xs text-muted-foreground">Apply to newly won deals</p></div>
            <Switch className="data-[state=checked]:bg-[hsl(var(--chart-5))]" checked={form.enabled} onCheckedChange={(enabled) => setForm({ ...form, enabled })} aria-label="Enable automatic incentive calculation" />
          </div>

          <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Method</Label><Select value={form.calculationType} onValueChange={(calculationType: 'percentage' | 'fixed') => setForm({ ...form, calculationType })}><SelectTrigger className="h-9 bg-background" style={{ borderRadius: 6 }}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage of deal</SelectItem><SelectItem value="fixed">Fixed amount</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{form.calculationType === 'percentage' ? 'Rate (%)' : 'Amount (₹)'}</Label><Input className="h-9 bg-background" style={{ borderRadius: 6 }} type="number" min={0.01} max={form.calculationType === 'percentage' ? 100 : undefined} step="0.01" value={form.value} onChange={(event) => setForm({ ...form, value: Number(event.target.value) })} /></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Minimum deal value (₹)</Label><Input className="h-9 bg-background" style={{ borderRadius: 6 }} type="text" inputMode="decimal" value={form.minimumDealAmount} onChange={(event) => { const value = event.target.value.replace(/[^\d.]/g, ''); setForm({ ...form, minimumDealAmount: value === '' ? 0 : Number(value) }); }} /></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">New payout status</Label><Select value={form.defaultStatus} onValueChange={(defaultStatus: 'pending' | 'approved') => setForm({ ...form, defaultStatus })}><SelectTrigger className="h-9 bg-background" style={{ borderRadius: 6 }}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending review</SelectItem><SelectItem value="approved">Approved</SelectItem></SelectContent></Select></div>
          </div>

          <div className="flex items-start gap-2.5 rounded-md bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
            <Calculator className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>{form.calculationType === 'percentage' ? `Example: ₹1,00,000 deal → ₹${((100000 * form.value) / 100).toLocaleString('en-IN')} incentive.` : `Every eligible won deal → ₹${form.value.toLocaleString('en-IN')} incentive.`} Minimum eligible value: ₹{form.minimumDealAmount.toLocaleString('en-IN')}.</p>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
            <div><p className="text-xs font-medium text-foreground">Existing won deals</p><p className="mt-0.5 text-[11px] text-muted-foreground">Create only missing incentives; duplicates are skipped.</p></div>
            <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1.5 text-xs" style={{ borderRadius: 6 }} disabled={!form.enabled || calculate.isPending} onClick={() => calculate.mutate()}><RefreshCw className={`h-3.5 w-3.5 ${calculate.isPending ? 'animate-spin' : ''}`} />Calculate past</Button>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
            <div><p className="text-xs font-medium text-foreground">Delete rule</p><p className="mt-0.5 text-[11px] text-muted-foreground">Stops future automatic payouts. Existing payouts stay unchanged.</p></div>
            <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive" style={{ borderRadius: 6 }} disabled={remove.isPending} onClick={handleDelete}><Trash2 className="h-3.5 w-3.5" />{remove.isPending ? 'Deleting…' : 'Delete'}</Button>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border bg-muted/20 px-6 py-3 sm:space-x-0"><Button variant="ghost" className="h-9" style={{ borderRadius: 6 }} onClick={() => setOpen(false)}>Cancel</Button><Button className="h-9 bg-[hsl(var(--chart-5))] px-5 text-white hover:bg-[hsl(var(--chart-5))]/90" style={{ borderRadius: 6 }} disabled={!valid || save.isPending} onClick={() => save.mutate(form)}>{save.isPending ? 'Saving…' : 'Save rule'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

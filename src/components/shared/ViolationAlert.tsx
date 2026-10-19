
import { useState, useCallback } from "react";
import { AlertCircle, X, ArrowRight, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatIST } from "@/lib/dateUtils";
import { Link } from "react-router-dom";
import { isSuperAdmin } from "@/lib/utils";

interface Violation {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  violationTime: string;
  userExplanation?: string;
  managerExplanation?: string;
  previousOwner?: { firstName: string; lastName: string };
  assignedTo?: { firstName: string; lastName: string };
}

export function ViolationAlert() {
  const queryClient = useQueryClient();
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [explanation, setExplanation] = useState("");
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem("dismissedViolations");
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Don't show violations for super_admin
  const userInfoStr = localStorage.getItem("userInfo");
  let currentUser: any = null;
  try {
    if (userInfoStr) currentUser = JSON.parse(userInfoStr);
  } catch { /* ignore */ }

  // Fetch Violations
  const { data } = useQuery({
    queryKey: ['violations'],
    queryFn: async () => {
      const response = await api.get('/leads/violations');
      return response.data;
    },
    refetchInterval: 60000, // Check every minute
    enabled: !isSuperAdmin(currentUser), // Don't fetch for super_admin
  });

  const violations: Violation[] = Array.isArray(data?.violations) ? data.violations : [];

  // Filter for unresolved violations that haven't been dismissed
  const pendingViolations = violations.filter(
    v => (!v.userExplanation || !v.managerExplanation) && !dismissedIds.has(v.id)
  );

  const mutation = useMutation({
    mutationFn: async (data: { leadId: string; explanation: string; type: 'user' | 'manager' }) => {
      const response = await api.post('/leads/explanation', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      toast.success("Explanation submitted successfully");
      setSelectedViolation(null);
      setExplanation("");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to submit");
    }
  });

  const dismissOne = useCallback((id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try { sessionStorage.setItem("dismissedViolations", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const dismissAll = useCallback(() => {
    const ids = pendingViolations.map(v => v.id);
    setDismissedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      try { sessionStorage.setItem("dismissedViolations", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }, [pendingViolations]);

  if (isSuperAdmin(currentUser)) return null;
  if (pendingViolations.length === 0) return null;

  const handleSubmit = () => {
    if (!selectedViolation) return;

    let explanationType: 'user' | 'manager' = 'user';

    if (currentUser) {
      try {
        // If current user's explanation is already provided, they must be the manager
        if (selectedViolation.userExplanation && !selectedViolation.managerExplanation) {
          explanationType = 'manager';
        }
        // If neither explanation exists, check if current user was the previous owner
        else if (!selectedViolation.userExplanation) {
          const assignedToName = `${selectedViolation.assignedTo?.firstName || ''} ${selectedViolation.assignedTo?.lastName || ''}`.trim();
          const currentUserName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();

          if (assignedToName !== currentUserName) {
            explanationType = 'manager';
          }
        }
      } catch {
        // Fallback to 'user' if parse fails
      }
    }

    mutation.mutate({
      leadId: selectedViolation.id,
      explanation,
      type: explanationType
    });
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-[380px]">
        {/* Clear All + View All bar */}
        {pendingViolations.length > 1 && (
          <div className="flex items-center justify-between gap-2 px-1">
            <Link
              to="/leads/transfers"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              View all transfers <ArrowRight className="h-3 w-3" />
            </Link>
            <button
              onClick={dismissAll}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Clear all
            </button>
          </div>
        )}

        {pendingViolations.slice(0, 3).map(v => (
          <Alert
            key={v.id}
            variant="destructive"
            className="w-[350px] bg-destructive/5 dark:bg-destructive/10 border-destructive/20 text-destructive relative pr-8"
          >
            {/* Dismiss X button */}
            <button
              onClick={(e) => { e.stopPropagation(); dismissOne(v.id); }}
              className="absolute top-2 right-2 p-0.5 rounded-sm hover:bg-destructive/10 transition-colors text-destructive/60 hover:text-destructive"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lead Assignment Violation: {v.firstName} {v.lastName}</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <span className="text-xs opacity-90">
                This lead was rotated due to inactivity on {formatIST(v.violationTime, 'MMM d, yyyy')}.
                An explanation is required.
              </span>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-background hover:bg-destructive/10 border-destructive/20"
                onClick={() => setSelectedViolation(v)}
              >
                Provide Explanation
              </Button>
            </AlertDescription>
          </Alert>
        ))}

        {pendingViolations.length === 1 && (
          <div className="flex justify-end px-1">
            <Link
              to="/leads/transfers"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              View all transfers <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>

      <Dialog open={!!selectedViolation} onOpenChange={(open) => !open && setSelectedViolation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Required Explanation</DialogTitle>
            <DialogDescription>
              Lead <strong>{selectedViolation?.firstName} {selectedViolation?.lastName}</strong> was automatically rotated.
              Please explain the lack of activity.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Reason for delay..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="min-h-[100px]"
          />

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setSelectedViolation(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!explanation || mutation.isPending}
            >
              {mutation.isPending && "Submitting..."}
              {!mutation.isPending && "Submit Explanation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

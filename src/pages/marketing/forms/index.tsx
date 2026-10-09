import { copyToClipboard } from "@/lib/utils";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWebForms,
  createWebForm,
  updateWebForm,
  deleteWebForm,
  getWebFormSubmissions,
  type WebForm,
  type WebFormField,
} from "@/services/webFormService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Code,
  FormInput,
  Eye,
  GripVertical,
  ListChecks,
  ChevronDown,
  Pencil,
} from "lucide-react";
import { formatIST } from "@/lib/dateUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FIELD_TYPES: { value: WebFormField["type"]; label: string }[] = [
  { value: "text", label: "Short answer" },
  { value: "textarea", label: "Paragraph" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone number" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
];

const DEFAULT_FIELDS: WebFormField[] = [
  { name: "firstName", label: "First Name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: false },
  { name: "phone", label: "Phone", type: "phone", required: true },
];

const slugifyFieldName = (label: string) =>
  label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "field";

interface BuilderState {
  id?: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  fields: WebFormField[];
}

const emptyBuilder: BuilderState = {
  name: "",
  description: "",
  status: "active",
  fields: DEFAULT_FIELDS,
};

export default function WebFormsPage() {
  const queryClient = useQueryClient();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builder, setBuilder] = useState<BuilderState>(emptyBuilder);
  const [submissionsFormId, setSubmissionsFormId] = useState<string | null>(null);

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ["web-forms"],
    queryFn: getWebForms,
  });

  const createMutation = useMutation({
    mutationFn: createWebForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["web-forms"] });
      setIsBuilderOpen(false);
      setBuilder(emptyBuilder);
      toast.success("Form created");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || "Failed to create form");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WebForm> }) => updateWebForm(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["web-forms"] });
      setIsBuilderOpen(false);
      setBuilder(emptyBuilder);
      toast.success("Form updated");
    },
    onError: () => toast.error("Failed to update form"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWebForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["web-forms"] });
      toast.success("Form deleted");
    },
    onError: () => toast.error("Failed to delete form"),
  });

  const openCreate = () => {
    setBuilder(emptyBuilder);
    setIsBuilderOpen(true);
  };

  const openEdit = (form: WebForm) => {
    setBuilder({
      id: form.id,
      name: form.name,
      description: form.description || "",
      status: form.status,
      fields: form.fields?.length ? form.fields : DEFAULT_FIELDS,
    });
    setIsBuilderOpen(true);
  };

  const addField = () => {
    setBuilder((b) => ({
      ...b,
      fields: [
        ...b.fields,
        { name: `field_${b.fields.length + 1}`, label: "", type: "text", required: false },
      ],
    }));
  };

  const updateField = (index: number, patch: Partial<WebFormField>) => {
    setBuilder((b) => {
      const fields = [...b.fields];
      const next = { ...fields[index], ...patch };
      if (patch.label !== undefined) next.name = slugifyFieldName(patch.label);
      fields[index] = next;
      return { ...b, fields };
    });
  };

  const removeField = (index: number) => {
    setBuilder((b) => ({ ...b, fields: b.fields.filter((_, i) => i !== index) }));
  };

  const moveField = (index: number, dir: -1 | 1) => {
    setBuilder((b) => {
      const target = index + dir;
      if (target < 0 || target >= b.fields.length) return b;
      const fields = [...b.fields];
      [fields[index], fields[target]] = [fields[target], fields[index]];
      return { ...b, fields };
    });
  };

  const handleSave = () => {
    if (!builder.name.trim()) {
      toast.error("Form name is required");
      return;
    }
    if (builder.fields.some((f) => !f.label.trim())) {
      toast.error("Every field needs a label");
      return;
    }
    const payload = {
      name: builder.name,
      description: builder.description,
      status: builder.status,
      fields: builder.fields,
    };
    if (builder.id) {
      updateMutation.mutate({ id: builder.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const copyEmbedCode = (id: string) => {
    const link = `${window.location.origin}/forms/${id}`;
    const code = `<iframe src="${link}" width="100%" height="600" frameborder="0" style="border:none;"></iframe>`;
    copyToClipboard(code);
    toast.success("Embed code copied to clipboard");
  };

  const copyLink = (id: string) => {
    copyToClipboard(`${window.location.origin}/forms/${id}`);
    toast.success("Link copied to clipboard");
  };

  const totalSubmissions = forms.reduce((sum, f) => sum + (f.submissionsCount || 0), 0);
  const activeForms = forms.filter((f) => f.status === "active").length;

  return (
    <div className="space-y-6 p-6 font-poppins">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Web Forms</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Build lead-capture forms and see every response land here automatically.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5)/0.9)] text-white rounded-[10px]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>

      <div className="rounded-[10px] md:rounded-[20px] border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-border">
          <div className="p-4 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[hsl(var(--chart-5))]" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Total Forms
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">{forms.length}</p>
          </div>
          <div className="p-4 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[hsl(var(--chart-5))]" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Active
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">{activeForms}</p>
          </div>
          <div className="p-4 relative col-span-2 sm:col-span-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[hsl(var(--chart-5))]" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Total Submissions
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalSubmissions}</p>
          </div>
        </div>
      </div>

      <Card className="rounded-[10px] md:rounded-[20px] border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">Loading forms...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Form Name</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.length > 0 ? (
                  forms.map((item: WebForm) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge
                          className={
                            item.status === "active"
                              ? "bg-[hsl(var(--chart-5)/0.15)] text-[hsl(var(--chart-5))] border-0"
                              : "bg-muted text-muted-foreground border-0"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.description || "No description"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {item.fields?.length || 0} fields
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setSubmissionsFormId(item.id)}
                          className="flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--chart-5))] hover:underline"
                        >
                          <FormInput className="h-3.5 w-3.5" />
                          {item.submissionsCount}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatIST(item.createdAt, "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" title="View submissions" onClick={() => setSubmissionsFormId(item.id)}>
                            <ListChecks className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Preview form" onClick={() => window.open(`/forms/${item.id}`, "_blank")}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Copy embed code" onClick={() => copyEmbedCode(item.id)}>
                            <Code className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No forms yet. Create your first one to start capturing leads.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Builder dialog */}
      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{builder.id ? "Edit Form" : "Create Form"}</DialogTitle>
            <DialogDescription>
              Add questions like a Google Form. Each submission becomes a lead automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Form Name</Label>
              <Input
                id="name"
                placeholder="e.g. Contact Us"
                value={builder.name}
                onChange={(e) => setBuilder((b) => ({ ...b, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Shown to visitors above the fields"
                value={builder.description}
                onChange={(e) => setBuilder((b) => ({ ...b, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-[10px] border border-border px-3 py-2.5">
              <div>
                <Label className="font-medium">Active</Label>
                <p className="text-xs text-muted-foreground">Inactive forms reject new submissions</p>
              </div>
              <Switch
                checked={builder.status === "active"}
                onCheckedChange={(checked) =>
                  setBuilder((b) => ({ ...b, status: checked ? "active" : "inactive" }))
                }
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <Label className="text-sm font-semibold">Fields</Label>
              <Button type="button" variant="outline" size="sm" onClick={addField}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add field
              </Button>
            </div>

            <div className="space-y-3">
              {builder.fields.map((field, index) => (
                <div key={index} className="rounded-[10px] border border-border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    <Input
                      placeholder="Question label"
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      className="flex-1"
                    />
                    <Select
                      value={field.type}
                      onValueChange={(v) => updateField(index, { type: v as WebFormField["type"] })}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeField(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {field.type === "select" && (
                    <Input
                      placeholder="Options, comma separated (e.g. Small, Medium, Large)"
                      value={(field.options || []).join(", ")}
                      onChange={(e) =>
                        updateField(index, {
                          options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean),
                        })
                      }
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                      />
                      Required
                    </label>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => moveField(index, -1)} disabled={index === 0}>
                        <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveField(index, 1)}
                        disabled={index === builder.fields.length - 1}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {builder.fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No fields yet — add one above.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBuilderOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5)/0.9)] text-white"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : builder.id
                ? "Save Changes"
                : "Create Form"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions viewer */}
      <SubmissionsDialog
        formId={submissionsFormId}
        onClose={() => setSubmissionsFormId(null)}
        onCopyLink={copyLink}
      />
    </div>
  );
}

function SubmissionsDialog({
  formId,
  onClose,
  onCopyLink,
}: {
  formId: string | null;
  onClose: () => void;
  onCopyLink: (id: string) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["web-form-submissions", formId],
    queryFn: () => getWebFormSubmissions(formId as string),
    enabled: !!formId,
  });

  return (
    <Dialog open={!!formId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data?.form?.name || "Submissions"}</DialogTitle>
          <DialogDescription>
            Every response submitted to this form, newest first.
          </DialogDescription>
        </DialogHeader>

        {formId && (
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => onCopyLink(formId)}
          >
            <Code className="h-3.5 w-3.5 mr-1.5" /> Copy shareable link
          </Button>
        )}

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Loading submissions...</div>
        ) : !data || data.submissions.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            No submissions yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Other Answers</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.submissions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.firstName} {s.lastName}
                      {s.isReEnquiry && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          Re-enquiry
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{s.email || "—"}</TableCell>
                    <TableCell className="text-sm">{s.phone || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate">
                      {s.customFields && Object.keys(s.customFields).length > 0
                        ? Object.entries(s.customFields)
                            .filter(([k]) => k !== "webFormId")
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatIST(s.createdAt, "MMM d, h:mm a")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

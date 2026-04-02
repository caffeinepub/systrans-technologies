import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Eye,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { backendInterface as FullBackendInterface } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useFileUpload } from "../hooks/useFileUpload";
import {
  useAllContactSubmissions,
  useAllCustomMailTemplates,
  useAllJobApplications,
  useAllJobPositions,
  useAllROILeads,
  useCreateCustomMailTemplate,
  useCreateJobPosition,
  useDeleteCustomMailTemplate,
  useDeleteJobPosition,
  useMailConfig,
  useSetMailConfig,
  useUpdateCustomMailTemplate,
  useUpdateJobPosition,
} from "../hooks/useQueries";
import type {
  CustomMailTemplate,
  JobPosition,
  MailConfig,
} from "../hooks/useQueries";

function formatDate(ts: bigint): string {
  const d = new Date(Number(ts));
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const exportCSV = (headers: string[], rows: string[][], filename: string) => {
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

function formatSalary(salary: bigint): string {
  const n = Number(salary);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

function replacePlaceholders(
  template: string,
  data: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => data[key] ?? `{${key}}`);
}

const defaultJobForm = {
  title: "",
  department: "",
  location: "",
  salary: "",
  description: "",
  isActive: true,
};

function JobsTab() {
  const { data: jobs, isLoading } = useAllJobPositions();
  const createJob = useCreateJobPosition();
  const updateJob = useUpdateJobPosition();
  const deleteJob = useDeleteJobPosition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editJob, setEditJob] = useState<JobPosition | null>(null);
  const [form, setForm] = useState(defaultJobForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditJob(null);
    setForm(defaultJobForm);
    setDialogOpen(true);
  };

  const openEdit = (job: JobPosition) => {
    setEditJob(job);
    setForm({
      title: job.title,
      department: job.department,
      location: job.location,
      salary: Number(job.salary).toString(),
      description: job.description,
      isActive: job.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editJob) {
        await updateJob.mutateAsync({
          id: BigInt(editJob.id),
          position: {
            ...editJob,
            title: form.title,
            department: form.department,
            location: form.location,
            salary: BigInt(form.salary || "0"),
            description: form.description,
            isActive: form.isActive,
          },
        });
        toast.success("Job updated successfully");
      } else {
        const id = Date.now().toString();
        await createJob.mutateAsync({
          id,
          title: form.title,
          department: form.department,
          location: form.location,
          salary: BigInt(form.salary || "0"),
          description: form.description,
          isActive: form.isActive,
          createdAt: BigInt(Date.now()),
        });
        toast.success("Job created successfully");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save job");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteJob.mutateAsync(BigInt(deleteId));
      toast.success("Job deleted");
    } catch {
      toast.error("Failed to delete job");
    }
    setDeleteId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">Job Positions</h3>
        <Button
          className="btn-gradient text-white"
          onClick={openCreate}
          data-ocid="admin.jobs.add.button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Job
        </Button>
      </div>

      {isLoading ? (
        <div
          className="flex justify-center py-8"
          data-ocid="admin.jobs.loading_state"
        >
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Title</TableHead>
                <TableHead className="text-muted-foreground">
                  Department
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Location
                </TableHead>
                <TableHead className="text-muted-foreground">Salary</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!jobs || jobs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                    data-ocid="admin.jobs.empty_state"
                  >
                    No jobs yet. Add your first position.
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job, i) => (
                  <TableRow
                    key={job.id}
                    className="border-border hover:bg-muted/30"
                    data-ocid={`admin.jobs.item.${i + 1}`}
                  >
                    <TableCell className="text-foreground font-medium">
                      {job.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {job.department}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {job.location}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatSalary(job.salary)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          job.isActive
                            ? "bg-accent/20 text-accent border-accent/30"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {job.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border"
                          onClick={() => openEdit(job)}
                          data-ocid={`admin.jobs.edit.button.${i + 1}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteId(job.id)}
                          data-ocid={`admin.jobs.delete.button.${i + 1}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Job Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="bg-card border-border text-foreground max-w-md"
          data-ocid="admin.jobs.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editJob ? "Edit Job Position" : "Add Job Position"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground mb-1 block">Job Title</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="e.g. Senior React Developer"
                className="bg-input border-border text-foreground"
                data-ocid="admin.jobs.title.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground mb-1 block">Department</Label>
                <Input
                  value={form.department}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, department: e.target.value }))
                  }
                  placeholder="Engineering"
                  className="bg-input border-border text-foreground"
                  data-ocid="admin.jobs.department.input"
                />
              </div>
              <div>
                <Label className="text-foreground mb-1 block">Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, location: e.target.value }))
                  }
                  placeholder="Bangalore"
                  className="bg-input border-border text-foreground"
                  data-ocid="admin.jobs.location.input"
                />
              </div>
            </div>
            <div>
              <Label className="text-foreground mb-1 block">
                Annual Salary (₹)
              </Label>
              <Input
                type="number"
                value={form.salary}
                onChange={(e) =>
                  setForm((p) => ({ ...p, salary: e.target.value }))
                }
                placeholder="1200000"
                className="bg-input border-border text-foreground"
                data-ocid="admin.jobs.salary.input"
              />
            </div>
            <div>
              <Label className="text-foreground mb-1 block">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Job description..."
                rows={4}
                className="bg-input border-border text-foreground resize-none"
                data-ocid="admin.jobs.description.textarea"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
                data-ocid="admin.jobs.active.switch"
              />
              <Label className="text-foreground">Active</Label>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              className="border-border"
              onClick={() => setDialogOpen(false)}
              data-ocid="admin.jobs.cancel.button"
            >
              Cancel
            </Button>
            <Button
              className="btn-gradient text-white"
              onClick={handleSave}
              disabled={createJob.isPending || updateJob.isPending}
              data-ocid="admin.jobs.save.button"
            >
              {createJob.isPending || updateJob.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
      >
        <AlertDialogContent
          className="bg-card border-border text-foreground"
          data-ocid="admin.jobs.delete.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Position</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-border text-foreground"
              data-ocid="admin.jobs.delete.cancel.button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={handleDelete}
              data-ocid="admin.jobs.delete.confirm.button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ContactTab() {
  const { data: submissions, isLoading } = useAllContactSubmissions();
  const { data: mailConfig } = useMailConfig();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const sendMail = (sub: {
    name: string;
    email: string;
    phone: string;
    message: string;
  }) => {
    const template = mailConfig?.contactTemplate;
    const subject = template?.subject
      ? replacePlaceholders(template.subject, {
          name: sub.name,
          email: sub.email,
          phone: sub.phone,
        })
      : "Re: Your inquiry - SysTrans Technologies";
    const body = template?.body
      ? replacePlaceholders(template.body, {
          name: sub.name,
          email: sub.email,
          phone: sub.phone,
          message: sub.message,
        })
      : `Hi ${sub.name},\n\nThank you for reaching out to SysTrans Technologies.\n\nWe have received your message and will get back to you shortly.\n\nBest regards,\nSysTrans Technologies Team`;
    window.open(
      `mailto:${sub.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      "_blank",
    );
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Contact Submissions
      </h3>
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground flex flex-col gap-1">
            <span>From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-border rounded px-2 py-1 text-sm bg-input text-foreground"
            />
          </label>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground flex flex-col gap-1">
            <span>To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-border rounded px-2 py-1 text-sm bg-input text-foreground"
            />
          </label>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-accent/40 text-accent hover:bg-accent/10"
          onClick={() => {
            const filtered = (submissions || []).filter((s) => {
              const ms = Number(s.submittedAt) / 1_000_000;
              if (startDate && ms < new Date(startDate).getTime()) return false;
              if (endDate && ms > new Date(endDate).getTime() + 86400000)
                return false;
              return true;
            });
            exportCSV(
              ["Name", "Email", "Phone", "Message", "Submitted At"],
              filtered.map((s) => [
                s.name,
                s.email,
                s.phone,
                s.message,
                formatDate(s.submittedAt),
              ]),
              "contact-submissions.csv",
            );
          }}
          data-ocid="admin.contact.export.button"
        >
          <Download className="w-3 h-3 mr-1" />
          Export CSV
        </Button>
      </div>
      {isLoading ? (
        <div
          className="flex justify-center py-8"
          data-ocid="admin.contact.loading_state"
        >
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Phone</TableHead>
                <TableHead className="text-muted-foreground">Message</TableHead>
                <TableHead className="text-muted-foreground">
                  Submitted
                </TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!submissions || submissions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                    data-ocid="admin.contact.empty_state"
                  >
                    No contact submissions yet.
                  </TableCell>
                </TableRow>
              ) : (
                submissions
                  .filter((s) => {
                    const ms = Number(s.submittedAt) / 1_000_000;
                    if (startDate && ms < new Date(startDate).getTime())
                      return false;
                    if (endDate && ms > new Date(endDate).getTime() + 86400000)
                      return false;
                    return true;
                  })
                  .map((s, i) => (
                    <TableRow
                      key={`${s.email}-${String(s.submittedAt)}`}
                      className="border-border hover:bg-muted/30"
                      data-ocid={`admin.contact.item.${i + 1}`}
                    >
                      <TableCell className="text-foreground">
                        {s.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {s.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {s.phone}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                        {s.message}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(s.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-accent/40 text-accent hover:bg-accent/10"
                            onClick={() => sendMail(s)}
                            data-ocid={`admin.contact.send_mail.button.${i + 1}`}
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            Send Mail
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ROILeadsTab() {
  const { data: leads, isLoading } = useAllROILeads();
  const { data: mailConfig } = useMailConfig();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const sendMail = (lead: {
    name: string;
    email: string;
    phone: string;
    monthlyRevenue: string;
    staffHours: string;
    abandonedLeads: string;
    calculatedGain: string;
  }) => {
    const template = mailConfig?.roiTemplate;
    const subject = template?.subject
      ? replacePlaceholders(template.subject, {
          name: lead.name,
          email: lead.email,
        })
      : "Your ROI Audit Report - SysTrans Technologies";
    const body = template?.body
      ? replacePlaceholders(template.body, {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          monthlyRevenue: lead.monthlyRevenue,
          staffHours: lead.staffHours,
          abandonedLeads: lead.abandonedLeads,
          calculatedGain: lead.calculatedGain,
        })
      : `Hi ${lead.name},\n\nThank you for using our ROI Calculator.\n\nBased on your inputs:\n- Monthly Revenue: ₹${lead.monthlyRevenue}\n- Staff Hours on Manual Tasks: ${lead.staffHours} hrs/month\n- Abandoned Leads: ${lead.abandonedLeads}/month\n\nYour Potential Monthly Gain: ₹${lead.calculatedGain}\n\nWe'd love to help you unlock this potential. Let's schedule a call!\n\nBest regards,\nSysTrans Technologies Team`;
    window.open(
      `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      "_blank",
    );
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4">ROI Leads</h3>
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground flex flex-col gap-1">
            <span>From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-border rounded px-2 py-1 text-sm bg-input text-foreground"
            />
          </label>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground flex flex-col gap-1">
            <span>To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-border rounded px-2 py-1 text-sm bg-input text-foreground"
            />
          </label>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-accent/40 text-accent hover:bg-accent/10"
          onClick={() => {
            const filtered = (leads || []).filter((l) => {
              const ms = Number(l.submittedAt) / 1_000_000;
              if (startDate && ms < new Date(startDate).getTime()) return false;
              if (endDate && ms > new Date(endDate).getTime() + 86400000)
                return false;
              return true;
            });
            exportCSV(
              [
                "Name",
                "Email",
                "Phone",
                "Monthly Revenue",
                "Staff Hours",
                "Abandoned Leads",
                "Calculated Gain",
                "Submitted At",
              ],
              filtered.map((l) => [
                l.name,
                l.email,
                l.phone,
                l.monthlyRevenue,
                l.staffHours,
                l.abandonedLeads,
                l.calculatedGain,
                formatDate(l.submittedAt),
              ]),
              "roi-leads.csv",
            );
          }}
          data-ocid="admin.roi.export.button"
        >
          <Download className="w-3 h-3 mr-1" />
          Export CSV
        </Button>
      </div>
      {isLoading ? (
        <div
          className="flex justify-center py-8"
          data-ocid="admin.roi.loading_state"
        >
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Revenue</TableHead>
                <TableHead className="text-muted-foreground">
                  Staff Hrs
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Leads Lost
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Calc. Gain
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Submitted
                </TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!leads || leads.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                    data-ocid="admin.roi.empty_state"
                  >
                    No ROI leads yet.
                  </TableCell>
                </TableRow>
              ) : (
                leads
                  .filter((l) => {
                    const ms = Number(l.submittedAt) / 1_000_000;
                    if (startDate && ms < new Date(startDate).getTime())
                      return false;
                    if (endDate && ms > new Date(endDate).getTime() + 86400000)
                      return false;
                    return true;
                  })
                  .map((lead, i) => (
                    <TableRow
                      key={`${lead.email}-${String(lead.submittedAt)}`}
                      className="border-border hover:bg-muted/30"
                      data-ocid={`admin.roi.item.${i + 1}`}
                    >
                      <TableCell className="text-foreground">
                        {lead.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {lead.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        ₹{lead.monthlyRevenue}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {lead.staffHours}h
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {lead.abandonedLeads}
                      </TableCell>
                      <TableCell className="text-accent font-semibold text-sm">
                        ₹{lead.calculatedGain}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(lead.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-accent/40 text-accent hover:bg-accent/10"
                            onClick={() => sendMail(lead)}
                            data-ocid={`admin.roi.send_mail.button.${i + 1}`}
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            Send Mail
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function JobApplicationsTab() {
  const { data: applications, isLoading } = useAllJobApplications();
  const { getFileUrl, ready } = useFileUpload();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});

  const downloadAsPdf = async (url: string, applicantName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${applicantName.replace(/\s+/g, "_")}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      alert("Failed to download resume. Please try again.");
    }
  };

  useEffect(() => {
    if (!applications || !ready) return;
    const fetchUrls = async () => {
      const fileIds = applications
        .filter((a) => a.resumeFileId)
        .map((a) => a.resumeFileId);
      const results = await Promise.all(
        fileIds.map(async (id) => {
          try {
            const url = await getFileUrl(id);
            return [id, url] as [string, string];
          } catch {
            return null;
          }
        }),
      );
      const urlMap: Record<string, string> = {};
      for (const entry of results) {
        if (entry) urlMap[entry[0]] = entry[1];
      }
      setFileUrls(urlMap);
    };
    fetchUrls();
  }, [applications, ready, getFileUrl]);

  const sendMailToApplicant = (app: {
    applicantName: string;
    email: string;
    jobId: string;
  }) => {
    const subject = encodeURIComponent(
      "Your Application - SysTrans Technologies",
    );
    const body = encodeURIComponent(
      `Hi ${app.applicantName},\n\nThank you for applying to SysTrans Technologies.\n\nWe have received your application and our team will review it shortly. We will get back to you with an update.\n\nBest regards,\nSysTrans Technologies Team`,
    );
    window.open(
      `mailto:${app.email}?subject=${subject}&body=${body}`,
      "_blank",
    );
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Job Applications
      </h3>
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground flex flex-col gap-1">
            <span>From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-border rounded px-2 py-1 text-sm bg-input text-foreground"
            />
          </label>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground flex flex-col gap-1">
            <span>To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-border rounded px-2 py-1 text-sm bg-input text-foreground"
            />
          </label>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-accent/40 text-accent hover:bg-accent/10"
          onClick={() => {
            const filtered = (applications || []).filter((a) => {
              const ms = Number(a.appliedAt) / 1_000_000;
              if (startDate && ms < new Date(startDate).getTime()) return false;
              if (endDate && ms > new Date(endDate).getTime() + 86400000)
                return false;
              return true;
            });
            exportCSV(
              [
                "Applicant Name",
                "Job ID",
                "Email",
                "Years of Experience",
                "Current CTC",
                "Expected CTC",
                "Applied At",
              ],
              filtered.map((a) => [
                a.applicantName,
                a.jobId,
                a.email,
                a.yearsOfExperience,
                a.currentCTC || "",
                a.expectedCTC || "",
                formatDate(a.appliedAt),
              ]),
              "job-applications.csv",
            );
          }}
          data-ocid="admin.applications.export.button"
        >
          <Download className="w-3 h-3 mr-1" />
          Export CSV
        </Button>
      </div>
      {isLoading ? (
        <div
          className="flex justify-center py-8"
          data-ocid="admin.applications.loading_state"
        >
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Job ID</TableHead>
                <TableHead className="text-muted-foreground">Exp.</TableHead>
                <TableHead className="text-muted-foreground">
                  Current CTC
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Expected CTC
                </TableHead>
                <TableHead className="text-muted-foreground">Applied</TableHead>
                <TableHead className="text-muted-foreground">Resume</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!applications || applications.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground py-8"
                    data-ocid="admin.applications.empty_state"
                  >
                    No applications yet.
                  </TableCell>
                </TableRow>
              ) : (
                applications
                  .filter((a) => {
                    const ms = Number(a.appliedAt) / 1_000_000;
                    if (startDate && ms < new Date(startDate).getTime())
                      return false;
                    if (endDate && ms > new Date(endDate).getTime() + 86400000)
                      return false;
                    return true;
                  })
                  .map((app, i) => (
                    <TableRow
                      key={`${app.email}-${String(app.appliedAt)}`}
                      className="border-border hover:bg-muted/30"
                      data-ocid={`admin.applications.item.${i + 1}`}
                    >
                      <TableCell className="text-foreground">
                        {app.applicantName}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {app.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono text-xs">
                        {app.jobId.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {app.yearsOfExperience}y
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        ₹{app.currentCTC}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        ₹{app.expectedCTC}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(app.appliedAt)}
                      </TableCell>
                      <TableCell>
                        {app.resumeFileId && fileUrls[app.resumeFileId] ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs text-accent hover:underline cursor-pointer"
                            data-ocid={`admin.applications.resume.button.${i + 1}`}
                            onClick={() =>
                              downloadAsPdf(
                                fileUrls[app.resumeFileId],
                                app.applicantName,
                              )
                            }
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </button>
                        ) : app.resumeFileId ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs text-accent hover:underline cursor-pointer"
                            onClick={async () => {
                              try {
                                const url = await getFileUrl(app.resumeFileId);
                                await downloadAsPdf(url, app.applicantName);
                              } catch (_e) {
                                alert(
                                  "Failed to load resume. Please try again.",
                                );
                              }
                            }}
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            None
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-accent/40 text-accent hover:bg-accent/10"
                            onClick={() => sendMailToApplicant(app)}
                            data-ocid={`admin.applications.send_mail.button.${i + 1}`}
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            Send Mail
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function MailTemplatesTab() {
  const { data: templates, isLoading } = useAllCustomMailTemplates();
  const createTemplate = useCreateCustomMailTemplate();
  const updateTemplate = useUpdateCustomMailTemplate();
  const deleteTemplate = useDeleteCustomMailTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<CustomMailTemplate | null>(
    null,
  );
  const [form, setForm] = useState({ name: "", subject: "", body: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sendMailDialogOpen, setSendMailDialogOpen] = useState(false);
  const [sendMailTemplate, setSendMailTemplate] =
    useState<CustomMailTemplate | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");

  const openCreate = () => {
    setEditTemplate(null);
    setForm({ name: "", subject: "", body: "" });
    setDialogOpen(true);
  };

  const openEdit = (t: CustomMailTemplate) => {
    setEditTemplate(t);
    setForm({ name: t.name, subject: t.subject, body: t.body });
    setDialogOpen(true);
  };

  const openSendMail = (t: CustomMailTemplate) => {
    setSendMailTemplate(t);
    setRecipientEmail("");
    setSendMailDialogOpen(true);
  };

  const handleSendMail = () => {
    if (!sendMailTemplate || !recipientEmail) return;
    const subject = encodeURIComponent(sendMailTemplate.subject);
    const body = encodeURIComponent(sendMailTemplate.body);
    window.open(
      `mailto:${recipientEmail}?subject=${subject}&body=${body}`,
      "_blank",
    );
    setSendMailDialogOpen(false);
  };

  const handleSave = async () => {
    try {
      if (editTemplate) {
        await updateTemplate.mutateAsync({
          id: BigInt(editTemplate.id),
          template: {
            ...editTemplate,
            name: form.name,
            subject: form.subject,
            body: form.body,
          },
        });
        toast.success("Template updated");
      } else {
        await createTemplate.mutateAsync({
          id: Date.now().toString(),
          name: form.name,
          subject: form.subject,
          body: form.body,
          createdAt: BigInt(Date.now()),
        });
        toast.success("Template created");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save template");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTemplate.mutateAsync(BigInt(deleteId));
      toast.success("Template deleted");
    } catch {
      toast.error("Failed to delete template");
    }
    setDeleteId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Mail Templates
        </h3>
        <Button
          className="btn-gradient text-white"
          onClick={openCreate}
          data-ocid="admin.mail_templates.add.button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Template
        </Button>
      </div>

      <div className="text-sm text-muted-foreground bg-card border border-border rounded-lg p-4 mb-6">
        <p className="font-medium text-foreground mb-1">
          Available Placeholders
        </p>
        <p className="font-mono text-xs leading-relaxed">
          {[
            "{name}",
            "{email}",
            "{phone}",
            "{message}",
            "{monthlyRevenue}",
            "{staffHours}",
            "{abandonedLeads}",
            "{calculatedGain}",
          ].map((ph) => (
            <span
              key={ph}
              className="inline-block bg-accent/10 text-accent rounded px-1 mr-1 mb-1"
            >
              {ph}
            </span>
          ))}
        </p>
      </div>

      {isLoading ? (
        <div
          className="flex justify-center py-8"
          data-ocid="admin.mail_templates.loading_state"
        >
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Subject</TableHead>
                <TableHead className="text-muted-foreground">Body</TableHead>
                <TableHead className="text-muted-foreground">Created</TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!templates || templates.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                    data-ocid="admin.mail_templates.empty_state"
                  >
                    No templates yet. Create your first mail template.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((t, i) => (
                  <TableRow
                    key={t.id}
                    className="border-border hover:bg-muted/30"
                    data-ocid={`admin.mail_templates.item.${i + 1}`}
                  >
                    <TableCell className="text-foreground font-medium">
                      {t.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[160px] truncate">
                      {t.subject}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs">
                      <span className="line-clamp-2 font-mono text-xs">
                        {t.body}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(t.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-accent/40 text-accent hover:bg-accent/10"
                          onClick={() => openSendMail(t)}
                          data-ocid={`admin.mail_templates.send_mail.button.${i + 1}`}
                        >
                          <Mail className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border"
                          onClick={() => openEdit(t)}
                          data-ocid={`admin.mail_templates.edit.button.${i + 1}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteId(t.id)}
                          data-ocid={`admin.mail_templates.delete.button.${i + 1}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Send Mail Dialog */}
      <Dialog open={sendMailDialogOpen} onOpenChange={setSendMailDialogOpen}>
        <DialogContent
          className="bg-card border-border text-foreground max-w-sm"
          data-ocid="admin.mail_templates.send_mail.dialog"
        >
          <DialogHeader>
            <DialogTitle>Send Template: {sendMailTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the recipient's email to open your mail client with this
              template.
            </p>
            <div>
              <Label className="text-foreground mb-1 block">
                Recipient Email
              </Label>
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="bg-input border-border text-foreground"
                data-ocid="admin.mail_templates.recipient.input"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              className="border-border"
              onClick={() => setSendMailDialogOpen(false)}
              data-ocid="admin.mail_templates.send_mail.cancel.button"
            >
              Cancel
            </Button>
            <Button
              className="btn-gradient text-white"
              onClick={handleSendMail}
              disabled={!recipientEmail}
              data-ocid="admin.mail_templates.send_mail.confirm.button"
            >
              <Mail className="w-4 h-4 mr-2" />
              Open Mail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="bg-card border-border text-foreground max-w-lg"
          data-ocid="admin.mail_templates.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editTemplate ? "Edit Mail Template" : "Create Mail Template"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground mb-1 block">
                Template Name
              </Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Welcome Email, Follow-up"
                className="bg-input border-border text-foreground"
                data-ocid="admin.mail_templates.name.input"
              />
            </div>
            <div>
              <Label className="text-foreground mb-1 block">Subject</Label>
              <Input
                value={form.subject}
                onChange={(e) =>
                  setForm((p) => ({ ...p, subject: e.target.value }))
                }
                placeholder="e.g. Thank you, {name}!"
                className="bg-input border-border text-foreground"
                data-ocid="admin.mail_templates.subject.input"
              />
            </div>
            <div>
              <Label className="text-foreground mb-1 block">Body</Label>
              <Textarea
                value={form.body}
                onChange={(e) =>
                  setForm((p) => ({ ...p, body: e.target.value }))
                }
                placeholder={
                  "Hi {name},\n\nWrite your email body here...\n\nBest regards,\nSysTrans Technologies"
                }
                rows={6}
                className="bg-input border-border text-foreground resize-none font-mono text-sm"
                data-ocid="admin.mail_templates.body.textarea"
              />
            </div>
            <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Tip:</span> Use
              placeholders like <code className="text-accent">{"{name}"}</code>,{" "}
              <code className="text-accent">{"{email}"}</code>,{" "}
              <code className="text-accent">{"{message}"}</code> in subject and
              body.
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              className="border-border"
              onClick={() => setDialogOpen(false)}
              data-ocid="admin.mail_templates.cancel.button"
            >
              Cancel
            </Button>
            <Button
              className="btn-gradient text-white"
              onClick={handleSave}
              disabled={createTemplate.isPending || updateTemplate.isPending}
              data-ocid="admin.mail_templates.save.button"
            >
              {createTemplate.isPending || updateTemplate.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
      >
        <AlertDialogContent
          className="bg-card border-border text-foreground"
          data-ocid="admin.mail_templates.delete.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this template? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-border text-foreground"
              data-ocid="admin.mail_templates.delete.cancel.button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={handleDelete}
              data-ocid="admin.mail_templates.delete.confirm.button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MailConfigTab() {
  const { data: existingConfig, isLoading } = useMailConfig();
  const setMailConfig = useSetMailConfig();

  const [config, setConfig] = useState<MailConfig>({
    contactTemplate: { subject: "", body: "" },
    roiTemplate: { subject: "", body: "" },
  });

  useEffect(() => {
    if (existingConfig) setConfig(existingConfig);
  }, [existingConfig]);

  const handleSave = async () => {
    try {
      await setMailConfig.mutateAsync(config);
      toast.success("Mail configuration saved!");
    } catch {
      toast.error("Failed to save mail config");
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex justify-center py-8"
        data-ocid="admin.mail.loading_state"
      >
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold text-foreground">
        Default Mail Templates
      </h3>

      <div className="text-sm text-muted-foreground bg-card border border-border rounded-lg p-4">
        <p className="font-medium text-foreground mb-2">
          Available Placeholders
        </p>
        <p>
          Contact: <code className="text-accent">{"{{name}}"}</code>,{" "}
          <code className="text-accent">{"{{email}}"}</code>,{" "}
          <code className="text-accent">{"{{phone}}"}</code>,{" "}
          <code className="text-accent">{"{{message}}"}</code>
        </p>
        <p>
          ROI: <code className="text-accent">{"{{name}}"}</code>,{" "}
          <code className="text-accent">{"{{email}}"}</code>,{" "}
          <code className="text-accent">{"{{monthlyRevenue}}"}</code>,{" "}
          <code className="text-accent">{"{{staffHours}}"}</code>,{" "}
          <code className="text-accent">{"{{abandonedLeads}}"}</code>,{" "}
          <code className="text-accent">{"{{calculatedGain}}"}</code>
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h4 className="font-semibold text-foreground mb-4">
          Contact Form Reply Template
        </h4>
        <div className="space-y-4">
          <div>
            <Label className="text-foreground mb-1 block">Subject</Label>
            <Input
              value={config.contactTemplate.subject}
              onChange={(e) =>
                setConfig((p) => ({
                  ...p,
                  contactTemplate: {
                    ...p.contactTemplate,
                    subject: e.target.value,
                  },
                }))
              }
              placeholder="Re: Your inquiry - SysTrans Technologies"
              className="bg-input border-border text-foreground"
              data-ocid="admin.mail.contact_subject.input"
            />
          </div>
          <div>
            <Label className="text-foreground mb-1 block">Body</Label>
            <Textarea
              value={config.contactTemplate.body}
              onChange={(e) =>
                setConfig((p) => ({
                  ...p,
                  contactTemplate: {
                    ...p.contactTemplate,
                    body: e.target.value,
                  },
                }))
              }
              placeholder={"Hi {name}, Thank you for reaching out..."}
              rows={6}
              className="bg-input border-border text-foreground resize-none font-mono text-sm"
              data-ocid="admin.mail.contact_body.textarea"
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h4 className="font-semibold text-foreground mb-4">
          ROI Audit Report Reply Template
        </h4>
        <div className="space-y-4">
          <div>
            <Label className="text-foreground mb-1 block">Subject</Label>
            <Input
              value={config.roiTemplate.subject}
              onChange={(e) =>
                setConfig((p) => ({
                  ...p,
                  roiTemplate: { ...p.roiTemplate, subject: e.target.value },
                }))
              }
              placeholder="Your ROI Audit Report - SysTrans Technologies"
              className="bg-input border-border text-foreground"
              data-ocid="admin.mail.roi_subject.input"
            />
          </div>
          <div>
            <Label className="text-foreground mb-1 block">Body</Label>
            <Textarea
              value={config.roiTemplate.body}
              onChange={(e) =>
                setConfig((p) => ({
                  ...p,
                  roiTemplate: { ...p.roiTemplate, body: e.target.value },
                }))
              }
              placeholder={
                "Hi {name}, Based on your inputs, your potential gain is ₹{calculatedGain}/month..."
              }
              rows={6}
              className="bg-input border-border text-foreground resize-none font-mono text-sm"
              data-ocid="admin.mail.roi_body.textarea"
            />
          </div>
        </div>
      </div>

      <Button
        className="btn-gradient text-white"
        onClick={handleSave}
        disabled={setMailConfig.isPending}
        data-ocid="admin.mail.save.button"
      >
        {setMailConfig.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </>
        )}
      </Button>
    </div>
  );
}

function ChangePasswordTab() {
  const { actor: _cpActor } = useActor();
  const actor = _cpActor as unknown as FullBackendInterface | null;
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!actor) {
      setError("Connecting to server, please try again.");
      return;
    }
    if (newPwd.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setError("New password and confirmation do not match.");
      return;
    }
    setSaving(true);
    try {
      const valid = await actor.verifyAdminPassword(currentPwd);
      if (!valid) {
        setError("Current password is incorrect.");
        return;
      }
      await actor.setAdminPasswordHash(newPwd);
      toast.success("Password changed successfully!");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch {
      setError("Failed to change password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
          <KeyRound className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Change Password
          </h3>
          <p className="text-sm text-muted-foreground">
            Update your admin panel password
          </p>
        </div>
      </div>

      <form
        onSubmit={handleChange}
        className="bg-card border border-border rounded-xl p-6 space-y-4"
        data-ocid="admin.change_password.form"
      >
        <div>
          <Label className="text-foreground mb-1 block">Current Password</Label>
          <Input
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            placeholder="Enter current password"
            className="bg-input border-border text-foreground"
            data-ocid="admin.change_password.current.input"
            required
          />
        </div>
        <div>
          <Label className="text-foreground mb-1 block">New Password</Label>
          <Input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            placeholder="Min. 8 characters"
            className="bg-input border-border text-foreground"
            data-ocid="admin.change_password.new.input"
            required
          />
        </div>
        <div>
          <Label className="text-foreground mb-1 block">
            Confirm New Password
          </Label>
          <Input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            placeholder="Re-enter new password"
            className="bg-input border-border text-foreground"
            data-ocid="admin.change_password.confirm.input"
            required
          />
        </div>
        {error && (
          <p
            className="text-destructive text-sm"
            data-ocid="admin.change_password.error_state"
          >
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="btn-gradient text-white w-full font-semibold"
          disabled={saving || !actor}
          data-ocid="admin.change_password.submit.button"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Update Password
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

function nsToString(ns: bigint | null | undefined): string {
  if (ns === null || ns === undefined) return "-";
  return new Date(Number(ns) / 1_000_000).toLocaleString("en-IN");
}

function EmployeesTab() {
  const { actor: _empActor } = useActor();
  const actor = _empActor as unknown as FullBackendInterface | null;
  const [employees, setEmployees] = useState<import("../backend.d").Employee[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<
    import("../backend.d").Employee | null
  >(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [editPincodeLoading, setEditPincodeLoading] = useState(false);

  const emptyForm = {
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    dob: "",
    maritalStatus: "Single",
    address: "",
    pincode: "",
    city: "",
    state: "",
    panNumber: "",
    aadharNumber: "",
    dateOfJoining: "",
    role: "employee",
    position: "",
    salary: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState<
    Partial<import("../backend.d").Employee>
  >({});

  async function fetchCityState(pincode: string, isEdit = false) {
    if (pincode.length !== 6) return;
    if (isEdit) setEditPincodeLoading(true);
    else setPincodeLoading(true);
    try {
      const res = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`,
      );
      const data = await res.json();
      if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        if (isEdit) {
          setEditForm((p) => ({ ...p, city: po.District, state: po.State }));
        } else {
          setForm((p) => ({ ...p, city: po.District, state: po.State }));
        }
      }
    } catch {
      // leave fields editable
    } finally {
      if (isEdit) setEditPincodeLoading(false);
      else setPincodeLoading(false);
    }
  }

  async function load() {
    if (!actor) return;
    setLoading(true);
    try {
      setEmployees(await actor.getAllEmployees());
    } catch {
      /**/
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable within this component
  useEffect(() => {
    load();
  }, [actor]);

  async function handleCreate() {
    if (!actor) return;
    setSaving(true);
    try {
      await actor.createEmployee({
        employeeId: "",
        passwordHash: "",
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        mobile: form.mobile,
        dob: form.dob,
        maritalStatus: form.maritalStatus,
        address: form.address,
        pincode: form.pincode,
        city: form.city,
        state: form.state,
        panNumber: form.panNumber,
        aadharNumber: form.aadharNumber,
        dateOfJoining: form.dateOfJoining,
        role: form.role,
        position: form.position,
        salary: form.salary,
      });
      toast.success("Employee created!");
      setAddOpen(false);
      setForm(emptyForm);
      load();
    } catch {
      toast.error("Failed to create employee.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!actor || !viewEmployee) return;
    setSaving(true);
    try {
      await actor.updateEmployee(viewEmployee.employeeId, {
        ...viewEmployee,
        ...editForm,
      });
      toast.success("Employee updated!");
      setIsEditing(false);
      setViewEmployee(null);
      load();
    } catch {
      toast.error("Failed to update employee.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!actor) return;
    setDeleting(true);
    try {
      await actor.deleteEmployee(id);
      toast.success("Employee deleted.");
      setDeleteId(null);
      load();
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setDeleting(false);
    }
  }

  const ef = (field: string, val: string) =>
    setEditForm((p) => ({ ...p, [field]: val }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Employee Database</h2>
        <Button
          size="sm"
          className="btn-gradient text-white"
          onClick={() => {
            setForm(emptyForm);
            setAddOpen(true);
          }}
          data-ocid="admin.employees.add_button"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Employee
        </Button>
      </div>
      {loading ? (
        <div
          className="flex items-center gap-2 text-muted-foreground"
          data-ocid="admin.employees.loading_state"
        >
          <Loader2 className="h-5 w-5 animate-spin" /> Loading...
        </div>
      ) : employees.length === 0 ? (
        <p
          className="text-muted-foreground text-sm"
          data-ocid="admin.employees.empty_state"
        >
          No employees yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((e, i) => (
                <TableRow
                  key={e.employeeId}
                  data-ocid={`admin.employees.item.${i + 1}`}
                >
                  <TableCell className="font-mono text-sm">
                    {e.employeeId}
                  </TableCell>
                  <TableCell>
                    {e.firstName} {e.lastName}
                  </TableCell>
                  <TableCell className="text-sm">{e.email || "-"}</TableCell>
                  <TableCell className="text-sm">{e.mobile || "-"}</TableCell>
                  <TableCell className="capitalize">{e.role}</TableCell>
                  <TableCell>{e.position}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setViewEmployee(e);
                          setEditForm({ ...e });
                          setIsEditing(false);
                        }}
                        data-ocid={`admin.employees.edit_button.${i + 1}`}
                      >
                        <Pencil className="h-3 w-3 mr-1" /> View
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteId(e.employeeId)}
                        data-ocid={`admin.employees.delete_button.${i + 1}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          className="max-w-2xl max-h-[85vh] overflow-y-auto"
          data-ocid="admin.employees.modal"
        >
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {(
              [
                ["First Name", "firstName"],
                ["Last Name", "lastName"],
                ["Email", "email"],
                ["Mobile", "mobile"],
                ["Date of Birth", "dob", "date"],
                ["Date of Joining", "dateOfJoining", "date"],
                ["PAN Number", "panNumber"],
                ["Aadhar Number", "aadharNumber"],
                ["Position", "position"],
                ["Salary", "salary"],
              ] as [string, string, string?][]
            ).map(([label, key, type]) => (
              <div key={key}>
                <Label className="mb-1 block text-sm">{label}</Label>
                <Input
                  type={type || "text"}
                  value={(form as any)[key] || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div>
              <Label className="mb-1 block text-sm">Pincode</Label>
              <Input
                value={form.pincode}
                maxLength={6}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  setForm((p) => ({ ...p, pincode: v }));
                  if (v.length === 6) fetchCityState(v);
                }}
                data-ocid="admin.employees.pincode.input"
              />
            </div>
            <div>
              <Label className="mb-1 block text-sm">
                City{" "}
                {pincodeLoading && (
                  <span className="text-xs text-blue-500 ml-1">
                    Fetching...
                  </span>
                )}
              </Label>
              <Input
                value={form.city}
                onChange={(e) =>
                  setForm((p) => ({ ...p, city: e.target.value }))
                }
                placeholder="Auto-filled from pincode"
                data-ocid="admin.employees.city.input"
              />
            </div>
            <div>
              <Label className="mb-1 block text-sm">
                State{" "}
                {pincodeLoading && (
                  <span className="text-xs text-blue-500 ml-1">
                    Fetching...
                  </span>
                )}
              </Label>
              <Input
                value={form.state}
                onChange={(e) =>
                  setForm((p) => ({ ...p, state: e.target.value }))
                }
                placeholder="Auto-filled from pincode"
                data-ocid="admin.employees.state.input"
              />
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block text-sm">Address</Label>
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="mb-1 block text-sm">Marital Status</Label>
              <Select
                value={form.maritalStatus}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, maritalStatus: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Divorced">Divorced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-sm">Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              data-ocid="admin.employees.add_cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving}
              className="btn-gradient text-white"
              data-ocid="admin.employees.add_save.button"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {saving ? "Saving..." : "Create Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Employee Dialog */}
      <Dialog
        open={!!viewEmployee}
        onOpenChange={(o) => {
          if (!o) {
            setViewEmployee(null);
            setIsEditing(false);
          }
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[85vh] overflow-y-auto"
          data-ocid="admin.employees.view.modal"
        >
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Employee" : "Employee Details"} —{" "}
              {viewEmployee?.employeeId}
            </DialogTitle>
          </DialogHeader>
          {viewEmployee && (
            <div className="space-y-4">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  {(
                    [
                      ["First Name", "firstName"],
                      ["Last Name", "lastName"],
                      ["Email", "email"],
                      ["Mobile", "mobile"],
                      ["Date of Birth", "dob", "date"],
                      ["Date of Joining", "dateOfJoining", "date"],
                      ["PAN Number", "panNumber"],
                      ["Aadhar Number", "aadharNumber"],
                      ["Position", "position"],
                      ["Salary", "salary"],
                      ["Password", "passwordHash"],
                    ] as [string, string, string?][]
                  ).map(([label, key, type]) => (
                    <div key={key}>
                      <Label className="mb-1 block text-sm">{label}</Label>
                      <Input
                        type={type || "text"}
                        value={(editForm as any)[key] || ""}
                        onChange={(e) => ef(key, e.target.value)}
                      />
                    </div>
                  ))}
                  <div>
                    <Label className="mb-1 block text-sm">Pincode</Label>
                    <Input
                      value={(editForm as any).pincode || ""}
                      maxLength={6}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        ef("pincode", v);
                        if (v.length === 6) fetchCityState(v, true);
                      }}
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm">
                      City{" "}
                      {editPincodeLoading && (
                        <span className="text-xs text-blue-500 ml-1">
                          Fetching...
                        </span>
                      )}
                    </Label>
                    <Input
                      value={(editForm as any).city || ""}
                      onChange={(e) => ef("city", e.target.value)}
                      placeholder="Auto-filled from pincode"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm">
                      State{" "}
                      {editPincodeLoading && (
                        <span className="text-xs text-blue-500 ml-1">
                          Fetching...
                        </span>
                      )}
                    </Label>
                    <Input
                      value={(editForm as any).state || ""}
                      onChange={(e) => ef("state", e.target.value)}
                      placeholder="Auto-filled from pincode"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="mb-1 block text-sm">Address</Label>
                    <Input
                      value={(editForm as any).address || ""}
                      onChange={(e) => ef("address", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm">Marital Status</Label>
                    <Select
                      value={(editForm as any).maritalStatus || "Single"}
                      onValueChange={(v) => ef("maritalStatus", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm">Role</Label>
                    <Select
                      value={(editForm as any).role || "employee"}
                      onValueChange={(v) => ef("role", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {(
                    [
                      ["Employee ID", viewEmployee.employeeId],
                      ["First Name", viewEmployee.firstName],
                      ["Last Name", viewEmployee.lastName],
                      ["Email", viewEmployee.email],
                      ["Mobile", viewEmployee.mobile],
                      ["Date of Birth", viewEmployee.dob],
                      ["Marital Status", viewEmployee.maritalStatus],
                      ["Address", viewEmployee.address],
                      ["Pincode", viewEmployee.pincode],
                      ["City", viewEmployee.city],
                      ["State", viewEmployee.state],
                      ["PAN Number", viewEmployee.panNumber],
                      ["Aadhar Number", viewEmployee.aadharNumber],
                      ["Date of Joining", viewEmployee.dateOfJoining],
                      ["Role", viewEmployee.role],
                      ["Position", viewEmployee.position],
                      [
                        "Salary",
                        viewEmployee.salary
                          ? `\u20b9${viewEmployee.salary}`
                          : "-",
                      ],
                    ] as [string, string][]
                  ).map(([label, value]) => (
                    <div key={label}>
                      <span className="text-muted-foreground">{label}:</span>
                      <span className="ml-1 font-medium">{value || "-"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  data-ocid="admin.employees.edit_cancel.button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="btn-gradient text-white"
                  data-ocid="admin.employees.save_button"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setViewEmployee(null)}
                  data-ocid="admin.employees.close_button"
                >
                  Close
                </Button>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="btn-gradient text-white"
                  data-ocid="admin.employees.edit.button"
                >
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the employee record and cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin.employees.delete_cancel.button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={deleting}
              data-ocid="admin.employees.delete_confirm.button"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}{" "}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function calcHours(checkIn?: bigint, checkOut?: bigint): string {
  if (!checkIn || !checkOut) return "-";
  const diffMs = (Number(checkOut) - Number(checkIn)) / 1_000_000;
  if (diffMs <= 0) return "-";
  const totalMins = Math.floor(diffMs / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h}h ${m}m`;
}

function TimesheetsTab() {
  const { actor: _tsActor } = useActor();
  const actor = _tsActor as unknown as FullBackendInterface | null;
  const [employees, setEmployees] = useState<import("../backend.d").Employee[]>(
    [],
  );
  const [timesheets, setTimesheets] = useState<
    import("../backend.d").TimesheetEntry[]
  >([]);
  const [selectedEmp, setSelectedEmp] = useState<string>("all");
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    String(now.getMonth() + 1).padStart(2, "0"),
  );
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  useEffect(() => {
    if (!actor) return;
    Promise.all([actor.getAllEmployees(), actor.getAllTimesheets()])
      .then(([emps, sheets]) => {
        setEmployees(emps);
        setTimesheets(sheets);
      })
      .catch(() => {});
  }, [actor]);

  const filtered = timesheets.filter((t) => {
    const matchEmp = selectedEmp === "all" || t.employeeId === selectedEmp;
    const matchMonth = t.date.startsWith(`${selectedYear}-${selectedMonth}`);
    return matchEmp && matchMonth;
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Timesheets</h2>
      <div className="flex flex-wrap gap-3">
        <div>
          <Label className="text-xs mb-1 block">Employee</Label>
          <Select value={selectedEmp} onValueChange={setSelectedEmp}>
            <SelectTrigger
              className="w-52"
              data-ocid="admin.timesheets.employee.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.employeeId} value={e.employeeId}>
                  {e.employeeId} — {e.firstName} {e.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Month</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger
              className="w-36"
              data-ocid="admin.timesheets.month.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const m = String(i + 1).padStart(2, "0");
                const label = new Date(2000, i).toLocaleString("en-IN", {
                  month: "long",
                });
                return (
                  <SelectItem key={m} value={m}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Year</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger
              className="w-28"
              data-ocid="admin.timesheets.year.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["2024", "2025", "2026", "2027"].map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {filtered.length === 0 ? (
        <p
          className="text-muted-foreground text-sm"
          data-ocid="admin.timesheets.empty_state"
        >
          No timesheet entries for the selected filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Check-In</TableHead>
                <TableHead>Check-Out</TableHead>
                <TableHead>Total Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t, i) => (
                <TableRow
                  key={t.id}
                  data-ocid={`admin.timesheets.item.${i + 1}`}
                >
                  <TableCell className="font-mono text-sm">
                    {t.employeeId}
                  </TableCell>
                  <TableCell>{t.date}</TableCell>
                  <TableCell>{nsToString(t.checkInTime)}</TableCell>
                  <TableCell>{nsToString(t.checkOutTime)}</TableCell>
                  <TableCell className="font-medium text-sm">
                    {calcHours(
                      t.checkInTime ?? undefined,
                      t.checkOutTime ?? undefined,
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function AdminTicketsTab() {
  const { actor: _tkActor } = useActor();
  const actor = _tkActor as unknown as FullBackendInterface | null;
  const [tickets, setTickets] = useState<import("../backend.d").Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewTicket, setViewTicket] = useState<
    import("../backend.d").Ticket | null
  >(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function load() {
    if (!actor) return;
    setLoading(true);
    try {
      const all = await actor.getAllTickets();
      setTickets(all);
    } catch {
      /**/
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable within this component
  useEffect(() => {
    load();
  }, [actor]);

  const filteredTickets = tickets.filter((t) => {
    if (!startDate && !endDate) return true;
    const created = new Date(Number(t.createdAt) / 1_000_000);
    if (startDate && created < new Date(startDate)) return false;
    if (endDate && created > new Date(`${endDate}T23:59:59`)) return false;
    return true;
  });

  function handleExport() {
    const headers = [
      "Ticket #",
      "Raised By",
      "Category",
      "Description",
      "Status",
      "Created",
      "Resolved At",
      "Notes",
    ];
    const rows = filteredTickets.map((t) => [
      t.ticketNumber,
      t.raisedBy,
      t.category,
      t.description,
      t.status,
      nsToString(t.createdAt),
      t.resolvedAt ? nsToString(t.resolvedAt) : "-",
      t.notes || "",
    ]);
    exportCSV(
      headers,
      rows,
      `tickets_${startDate || "all"}_${endDate || "all"}.csv`,
    );
  }

  function statusColor(status: string): string {
    if (status === "resolved") return "bg-green-100 text-green-800";
    if (status === "in-progress") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Support Tickets</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={load}
          disabled={loading}
          data-ocid="admin.tickets.refresh"
        >
          {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}{" "}
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3 p-3 bg-gray-50 rounded-lg border">
        <div>
          <Label className="text-xs mb-1 block">From Date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40 text-sm"
            data-ocid="admin.tickets.start_date.input"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">To Date</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40 text-sm"
            data-ocid="admin.tickets.end_date.input"
          />
        </div>
        <Button
          size="sm"
          onClick={handleExport}
          disabled={filteredTickets.length === 0}
          className="btn-gradient text-white"
          data-ocid="admin.tickets.export.button"
        >
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      {loading ? (
        <div
          className="flex items-center gap-2 text-muted-foreground"
          data-ocid="admin.tickets.loading_state"
        >
          <Loader2 className="h-5 w-5 animate-spin" /> Loading...
        </div>
      ) : filteredTickets.length === 0 ? (
        <p
          className="text-muted-foreground text-sm"
          data-ocid="admin.tickets.empty_state"
        >
          No tickets found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket #</TableHead>
                <TableHead>Raised By</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((t, i) => (
                <TableRow
                  key={t.ticketNumber}
                  data-ocid={`admin.tickets.item.${i + 1}`}
                >
                  <TableCell className="font-mono text-sm">
                    {t.ticketNumber}
                  </TableCell>
                  <TableCell>{t.raisedBy}</TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm">
                    {t.description}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(t.status)}`}
                    >
                      {t.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {nsToString(t.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewTicket(t)}
                      data-ocid={`admin.tickets.view.button.${i + 1}`}
                    >
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={!!viewTicket}
        onOpenChange={(o) => !o && setViewTicket(null)}
      >
        <DialogContent
          className="max-w-lg"
          data-ocid="admin.tickets.view.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              Ticket Details — {viewTicket?.ticketNumber}
            </DialogTitle>
          </DialogHeader>
          {viewTicket && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">Ticket #:</span>
                  <span className="ml-1 font-medium">
                    {viewTicket.ticketNumber}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Raised By:</span>
                  <span className="ml-1 font-medium">
                    {viewTicket.raisedBy}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <span className="ml-1 font-medium">
                    {viewTicket.category}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(viewTicket.status)}`}
                  >
                    {viewTicket.status}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <span className="ml-1 font-medium">
                    {nsToString(viewTicket.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Resolved At:</span>
                  <span className="ml-1 font-medium">
                    {viewTicket.resolvedAt
                      ? nsToString(viewTicket.resolvedAt)
                      : "-"}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Description:</p>
                <p className="bg-gray-50 rounded p-3">
                  {viewTicket.description}
                </p>
              </div>
              {viewTicket.notes && (
                <div>
                  <p className="text-muted-foreground mb-1">Notes:</p>
                  <p className="bg-gray-50 rounded p-3">{viewTicket.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewTicket(null)}
              data-ocid="admin.tickets.view.close_button"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type BackendWithLeave = FullBackendInterface;
type LeaveRequest = import("../backend").LeaveRequest;

function AdminLeaveTab() {
  const { actor: _actor } = useActor();
  const actor = _actor as BackendWithLeave | null;
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Record<string, string>>({});
  const [employeeList, setEmployeeList] = useState<
    { id: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  async function loadData() {
    if (!actor) return;
    setLoading(true);
    try {
      const [leavesData, empsData] = await Promise.all([
        actor.getAllLeaveRequests(),
        actor.getAllEmployees(),
      ]);
      setLeaves(leavesData);
      const empMap: Record<string, string> = {};
      const empList: { id: string; name: string }[] = [];
      for (const e of empsData) {
        empMap[e.employeeId] = `${e.firstName} ${e.lastName}`;
        empList.push({
          id: e.employeeId,
          name: `${e.firstName} ${e.lastName} (${e.employeeId})`,
        });
      }
      setEmployees(empMap);
      setEmployeeList(empList);
    } catch {
      toast.error("Failed to load leave requests.");
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadData captured
  useEffect(() => {
    if (!actor) return;
    loadData();
  }, [actor]); // eslint-disable-line

  async function handleAction(leaveId: string, status: string) {
    if (!actor) return;
    setActionLoading(`${leaveId}${status}`);
    try {
      await actor.approveLeaveRequest(leaveId, status);
      toast.success(`Leave ${status} successfully.`);
      loadData();
    } catch {
      toast.error(`Failed to ${status} leave.`);
    } finally {
      setActionLoading(null);
    }
  }

  const statusBadge = (status: string) => {
    const cls =
      status === "approved"
        ? "bg-green-100 text-green-800"
        : status === "rejected"
          ? "bg-red-100 text-red-800"
          : status === "lop"
            ? "bg-orange-100 text-orange-800"
            : "bg-yellow-100 text-yellow-800";
    const label =
      status === "lop"
        ? "LOP"
        : status.charAt(0).toUpperCase() + status.slice(1);
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
        {label}
      </span>
    );
  };

  // Filter leaves by selected employee and selected month
  const filteredLeaves = leaves.filter((lr) => {
    const empMatch =
      selectedEmployee === "all" || lr.employeeId === selectedEmployee;
    const monthMatch = lr.startDate.startsWith(selectedMonth);
    return empMatch && monthMatch;
  });

  // Count stats for filtered set
  const approvedCount = filteredLeaves
    .filter((lr) => lr.status === "approved")
    .reduce((sum, lr) => sum + Number(lr.numberOfDays), 0);
  const lopCount = filteredLeaves
    .filter((lr) => lr.status === "lop")
    .reduce((sum, lr) => sum + Number(lr.numberOfDays), 0);
  const totalTaken = approvedCount + lopCount;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold" style={{ color: "#000080" }}>
          Leave Requests
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          data-ocid="admin.leave.secondary_button"
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div>
          {/* biome-ignore lint/a11y/noLabelWithoutControl: wrapping label */}
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Filter by Employee
          </label>
          <select
            className="border rounded px-2 py-1.5 text-sm min-w-[200px]"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="all">All Employees</option>
            {employeeList.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          {/* biome-ignore lint/a11y/noLabelWithoutControl: wrapping label */}
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Month
          </label>
          <input
            type="month"
            className="border rounded px-2 py-1.5 text-sm"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg border bg-blue-50 p-3">
          <p className="text-xs text-gray-500">Total Leaves Taken</p>
          <p className="text-2xl font-bold" style={{ color: "#000080" }}>
            {totalTaken}
          </p>
          <p className="text-xs text-gray-400">days (approved + LOP)</p>
        </div>
        <div className="rounded-lg border bg-green-50 p-3">
          <p className="text-xs text-gray-500">Approved Leaves</p>
          <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
          <p className="text-xs text-gray-400">days this month</p>
        </div>
        <div className="rounded-lg border bg-orange-50 p-3">
          <p className="text-xs text-gray-500">LOP Count</p>
          <p className="text-2xl font-bold text-orange-600">{lopCount}</p>
          <p className="text-xs text-gray-400">days this month</p>
        </div>
      </div>

      {loading ? (
        <div
          className="flex items-center gap-2 text-gray-500 py-8"
          data-ocid="admin.leave.loading_state"
        >
          <Loader2 className="h-5 w-5 animate-spin" /> Loading...
        </div>
      ) : filteredLeaves.length === 0 ? (
        <p
          className="text-gray-500 py-8 text-center"
          data-ocid="admin.leave.empty_state"
        >
          No leave requests found for the selected filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table data-ocid="admin.leave.table">
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave ID</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaves.map((lr, idx) => (
                <TableRow key={lr.id} data-ocid={`admin.leave.item.${idx + 1}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">
                        {employees[lr.employeeId] || lr.employeeId}
                      </p>
                      <p className="text-xs text-gray-500">{lr.employeeId}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {lr.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="text-sm">{lr.startDate}</TableCell>
                  <TableCell className="text-sm">{lr.endDate}</TableCell>
                  <TableCell>{Number(lr.numberOfDays)}</TableCell>
                  <TableCell className="max-w-40 truncate text-xs">
                    {lr.reason}
                  </TableCell>
                  <TableCell>{statusBadge(lr.status)}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(
                      Number(lr.requestedAt) / 1_000_000,
                    ).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell>
                    {lr.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                          disabled={actionLoading === `${lr.id}approved`}
                          onClick={() => handleAction(lr.id, "approved")}
                          data-ocid={`admin.leave.confirm_button.${idx + 1}`}
                        >
                          {actionLoading === `${lr.id}approved` ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Approve"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          disabled={actionLoading === `${lr.id}rejected`}
                          onClick={() => handleAction(lr.id, "rejected")}
                          data-ocid={`admin.leave.delete_button.${idx + 1}`}
                        >
                          {actionLoading === `${lr.id}rejected` ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Reject"
                          )}
                        </Button>
                      </div>
                    ) : (
                      statusBadge(lr.status)
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function AnnouncementsTab() {
  const { actor: _aActor } = useActor();
  const actor = _aActor as unknown as FullBackendInterface | null;
  const { uploadFile, getFileUrl, ready: storageReady } = useFileUpload();
  const [announcements, setAnnouncements] = useState<
    import("../backend.d").Announcement[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaType, setMediaType] = useState<"none" | "image" | "video">(
    "none",
  );
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

  const loadAnnouncements = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const list = await actor.getAllAnnouncements();
      setAnnouncements(list);
      for (const a of list) {
        if (a.mediaFileId && a.mediaType !== "none") {
          getFileUrl(a.mediaFileId)
            .then((url) => setMediaUrls((prev) => ({ ...prev, [a.id]: url })))
            .catch(() => {});
        }
      }
    } catch {
      toast.error("Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }, [actor, getFileUrl]);

  useEffect(() => {
    if (actor) loadAnnouncements();
  }, [actor, loadAnnouncements]);

  async function handleCreate() {
    if (!actor || !title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    const hasMedia = mediaType !== "none" && mediaFile != null;
    if (hasMedia && !storageReady) {
      toast.error("Storage not ready. Please wait a moment and try again.");
      return;
    }
    setCreating(true);
    try {
      let fileId = "";
      let effectiveMediaType = mediaType;
      if (hasMedia && mediaFile) {
        try {
          fileId = await uploadFile(mediaFile);
        } catch (uploadErr) {
          console.error("Upload error:", uploadErr);
          toast.error(
            "Failed to upload media file. Creating announcement without media.",
          );
          effectiveMediaType = "none";
          fileId = "";
        }
      } else if (mediaType !== "none" && !mediaFile) {
        effectiveMediaType = "none";
      }
      console.log("[Announcement] Calling createAnnouncement with:", {
        title: title.trim(),
        contentLength: content.trim().length,
        fileId,
        effectiveMediaType,
        actorHasMethod: typeof (actor as unknown as Record<string, unknown>)
          .createAnnouncement,
      });
      await actor.createAnnouncement(
        title.trim(),
        content.trim(),
        fileId,
        effectiveMediaType,
      );
      console.log("[Announcement] createAnnouncement succeeded");
      toast.success("Announcement created!");
      setTitle("");
      setContent("");
      setMediaType("none");
      setMediaFile(null);
      loadAnnouncements();
    } catch (e) {
      console.error("Announcement creation error:", e);
      const errMsg = e instanceof Error ? e.message : String(e);
      toast.error(`Failed to create announcement: ${errMsg.slice(0, 120)}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!actor) return;
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await actor.deleteAnnouncement(id);
      toast.success("Announcement deleted.");
      loadAnnouncements();
    } catch {
      toast.error("Failed to delete announcement.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Create Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4" style={{ color: "#000080" }}>
          Create Announcement
        </h2>
        <div className="space-y-4 max-w-2xl">
          <div>
            <Label className="mb-1 block text-gray-700">Title</Label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#000080" } as React.CSSProperties}
              data-ocid="admin.announcement.title.input"
            />
          </div>
          <div>
            <Label className="mb-1 block text-gray-700">Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement..."
              rows={4}
              data-ocid="admin.announcement.content.textarea"
            />
          </div>
          <div>
            <Label className="mb-1 block text-gray-700">Media Type</Label>
            <Select
              value={mediaType}
              onValueChange={(v) =>
                setMediaType(v as "none" | "image" | "video")
              }
            >
              <SelectTrigger
                className="w-48"
                data-ocid="admin.announcement.media_type.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mediaType !== "none" && (
            <div>
              <Label className="mb-1 block text-gray-700">
                Upload {mediaType === "image" ? "Image" : "Video"}
              </Label>
              <input
                type="file"
                accept={mediaType === "image" ? "image/*" : "video/*"}
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                data-ocid="admin.announcement.upload_button"
              />
              {mediaFile && (
                <p className="text-xs text-gray-500 mt-1">{mediaFile.name}</p>
              )}
            </div>
          )}
          <Button
            onClick={handleCreate}
            disabled={
              creating || !actor || (mediaType !== "none" && !storageReady)
            }
            className="text-white font-semibold"
            style={{ backgroundColor: "#000080" }}
            data-ocid="admin.announcement.submit_button"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {creating ? "Creating..." : "Create Announcement"}
          </Button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4" style={{ color: "#000080" }}>
          All Announcements
        </h2>
        {loading ? (
          <div
            className="flex items-center gap-2 text-gray-500"
            data-ocid="admin.announcements.loading_state"
          >
            <Loader2 className="h-5 w-5 animate-spin" /> Loading...
          </div>
        ) : announcements.length === 0 ? (
          <p
            className="text-gray-500 text-sm"
            data-ocid="admin.announcements.empty_state"
          >
            No announcements yet.
          </p>
        ) : (
          <div className="space-y-4">
            {announcements
              .slice()
              .sort((a, b) => Number(b.createdAt - a.createdAt))
              .map((ann, i) => (
                <div
                  key={ann.id}
                  className="border border-gray-200 rounded-lg p-4"
                  data-ocid={`admin.announcements.item.${i + 1}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-semibold text-sm"
                        style={{ color: "#000080" }}
                      >
                        {ann.title}
                      </h3>
                      <p className="text-xs text-gray-500 mb-1">
                        {new Date(
                          Number(ann.createdAt) / 1_000_000,
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {ann.content}
                      </p>
                      {ann.mediaType === "image" && mediaUrls[ann.id] && (
                        <img
                          src={mediaUrls[ann.id]}
                          alt={ann.title}
                          className="mt-2 rounded max-h-48 object-cover"
                        />
                      )}
                      {ann.mediaType === "video" && mediaUrls[ann.id] && (
                        <video
                          src={mediaUrls[ann.id]}
                          controls
                          className="mt-2 rounded max-h-48 w-full"
                        >
                          <track kind="captions" />
                        </video>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(ann.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50 flex-shrink-0"
                      data-ocid={`admin.announcements.delete_button.${i + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { actor: _loginActor, isFetching: actorFetching } = useActor();
  const loginActor = _loginActor as unknown as FullBackendInterface | null;
  const [loggedIn, setLoggedIn] = useState(
    () => localStorage.getItem("admin_logged_in") === "true",
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginActor) return;
    setLoginLoading(true);
    setLoginError(false);
    try {
      const valid = await loginActor.verifyAdminPassword(password);
      if (username === "SysTrans" && valid) {
        localStorage.setItem("admin_logged_in", "true");
        setLoggedIn(true);
        setLoginError(false);
      } else {
        setLoginError(true);
      }
    } catch {
      setLoginError(true);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_logged_in");
    setLoggedIn(false);
    setUsername("");
    setPassword("");
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-2xl p-8 sm:p-10 max-w-sm w-full shadow-sm"
          data-ocid="admin.login.panel"
        >
          <div className="flex justify-center mb-6">
            <img
              src="/assets/uploads/154-removebg-preview-019d343e-3b74-77fa-8c99-6fa4ec112249-1.png"
              alt="SysTrans Technologies"
              className="h-16 w-auto object-contain"
            />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">
            Admin Panel
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Enter your credentials to access the admin panel.
          </p>
          <div className="space-y-4 text-left">
            <div>
              <Label className="text-foreground mb-1 block">Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                data-ocid="admin.login.input"
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !loginLoading &&
                  !actorFetching &&
                  loginActor &&
                  handleLogin()
                }
              />
            </div>
            <div>
              <Label className="text-foreground mb-1 block">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                data-ocid="admin.login.password.input"
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !loginLoading &&
                  !actorFetching &&
                  loginActor &&
                  handleLogin()
                }
              />
            </div>
            {loginError && (
              <p
                className="text-destructive text-sm"
                data-ocid="admin.login.error_state"
              >
                Invalid username or password.
              </p>
            )}
            <Button
              className="btn-gradient text-white w-full font-semibold"
              onClick={handleLogin}
              disabled={loginLoading || actorFetching || !loginActor}
              data-ocid="admin.login.button"
            >
              {loginLoading || actorFetching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {actorFetching ? "Connecting..." : "Logging in..."}
                </>
              ) : (
                "Login"
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <img
            src="/assets/uploads/154-removebg-preview-019d343e-3b74-77fa-8c99-6fa4ec112249-1.png"
            alt="SysTrans Technologies"
            className="h-8 w-auto object-contain"
          />
          <span className="font-bold text-foreground">
            SysTrans <span className="text-accent">Admin</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="hidden sm:flex bg-accent/15 text-accent border-accent/30">
            Admin Panel
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="border-border text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
            data-ocid="admin.logout.button"
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Tabs defaultValue="jobs">
          <TabsList
            className="bg-card border border-border mb-8 flex-wrap h-auto gap-1 p-1"
            data-ocid="admin.tabs"
          >
            <TabsTrigger
              value="jobs"
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent"
              data-ocid="admin.jobs.tab"
            >
              Jobs
            </TabsTrigger>
            <TabsTrigger
              value="contacts"
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent"
              data-ocid="admin.contacts.tab"
            >
              Contacts
            </TabsTrigger>
            <TabsTrigger
              value="roi"
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent"
              data-ocid="admin.roi.tab"
            >
              ROI Leads
            </TabsTrigger>
            <TabsTrigger
              value="applications"
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent"
              data-ocid="admin.applications.tab"
            >
              Applications
            </TabsTrigger>
            <TabsTrigger
              value="mail-templates"
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent"
              data-ocid="admin.mail_templates.tab"
            >
              Mail Templates
            </TabsTrigger>
            <TabsTrigger
              value="mail"
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent"
              data-ocid="admin.mail.tab"
            >
              Default Templates
            </TabsTrigger>
            <TabsTrigger
              value="change-password"
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent"
              data-ocid="admin.change_password.tab"
            >
              Change Password
            </TabsTrigger>
            <TabsTrigger
              value="employees"
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent"
              data-ocid="admin.employees.tab"
            >
              Employees
            </TabsTrigger>
            <TabsTrigger
              value="timesheets"
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent"
              data-ocid="admin.timesheets.tab"
            >
              Timesheets
            </TabsTrigger>
            <TabsTrigger
              value="tickets"
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent"
              data-ocid="admin.tickets.tab"
            >
              Tickets
            </TabsTrigger>
            <TabsTrigger
              value="announcements"
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent"
              data-ocid="admin.announcements.tab"
            >
              Announcements
            </TabsTrigger>
            <TabsTrigger
              value="leave-requests"
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent"
              data-ocid="admin.leave_requests.tab"
            >
              Leave Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            <JobsTab />
          </TabsContent>
          <TabsContent value="contacts">
            <ContactTab />
          </TabsContent>
          <TabsContent value="roi">
            <ROILeadsTab />
          </TabsContent>
          <TabsContent value="applications">
            <JobApplicationsTab />
          </TabsContent>
          <TabsContent value="mail-templates">
            <MailTemplatesTab />
          </TabsContent>
          <TabsContent value="mail">
            <MailConfigTab />
          </TabsContent>
          <TabsContent value="change-password">
            <ChangePasswordTab />
          </TabsContent>
          <TabsContent value="employees">
            <EmployeesTab />
          </TabsContent>
          <TabsContent value="timesheets">
            <TimesheetsTab />
          </TabsContent>
          <TabsContent value="tickets">
            <AdminTicketsTab />
          </TabsContent>
          <TabsContent value="announcements">
            <AnnouncementsTab />
          </TabsContent>
          <TabsContent value="leave-requests">
            <AdminLeaveTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

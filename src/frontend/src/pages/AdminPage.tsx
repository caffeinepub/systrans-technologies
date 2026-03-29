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
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Plus,
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

  const emptyForm = {
    firstName: "",
    lastName: "",
    dob: "",
    maritalStatus: "Single",
    address: "",
    pincode: "",
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
        dob: form.dob,
        maritalStatus: form.maritalStatus,
        address: form.address,
        pincode: form.pincode,
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
                <TableHead>Role</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Salary</TableHead>
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
                  <TableCell className="capitalize">{e.role}</TableCell>
                  <TableCell>{e.position}</TableCell>
                  <TableCell>{e.salary ? `₹${e.salary}` : "-"}</TableCell>
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
                ["Date of Birth", "dob", "date"],
                ["Date of Joining", "dateOfJoining", "date"],
                ["Pincode", "pincode"],
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
                      ["Date of Birth", "dob", "date"],
                      ["Date of Joining", "dateOfJoining", "date"],
                      ["Pincode", "pincode"],
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
                      ["Date of Birth", viewEmployee.dob],
                      ["Marital Status", viewEmployee.maritalStatus],
                      ["Address", viewEmployee.address],
                      ["Pincode", viewEmployee.pincode],
                      ["PAN Number", viewEmployee.panNumber],
                      ["Aadhar Number", viewEmployee.aadharNumber],
                      ["Date of Joining", viewEmployee.dateOfJoining],
                      ["Role", viewEmployee.role],
                      ["Position", viewEmployee.position],
                      [
                        "Salary",
                        viewEmployee.salary ? `₹${viewEmployee.salary}` : "-",
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
  const [rowStatus, setRowStatus] = useState<Record<string, string>>({});
  const [rowNotes, setRowNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  async function load() {
    if (!actor) return;
    setLoading(true);
    try {
      const all = await actor.getAllTickets();
      setTickets(all);
      const sMap: Record<string, string> = {};
      const nMap: Record<string, string> = {};
      for (const t of all) {
        sMap[t.ticketNumber] = t.status;
        nMap[t.ticketNumber] = t.notes || "";
      }
      setRowStatus(sMap);
      setRowNotes(nMap);
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

  async function handleSave(ticketNumber: string) {
    if (!actor) return;
    setSaving((p) => ({ ...p, [ticketNumber]: true }));
    try {
      await actor.updateTicketStatus(
        ticketNumber,
        rowStatus[ticketNumber],
        rowNotes[ticketNumber] || "",
      );
      toast.success("Ticket updated!");
      load();
    } catch {
      toast.error("Failed to update ticket.");
    } finally {
      setSaving((p) => ({ ...p, [ticketNumber]: false }));
    }
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
      {loading ? (
        <div
          className="flex items-center gap-2 text-muted-foreground"
          data-ocid="admin.tickets.loading_state"
        >
          <Loader2 className="h-5 w-5 animate-spin" /> Loading...
        </div>
      ) : tickets.length === 0 ? (
        <p
          className="text-muted-foreground text-sm"
          data-ocid="admin.tickets.empty_state"
        >
          No tickets yet.
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
                <TableHead>Notes</TableHead>
                <TableHead>Save</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t, i) => (
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
                    <Select
                      value={rowStatus[t.ticketNumber] || t.status}
                      onValueChange={(v) =>
                        setRowStatus((p) => ({ ...p, [t.ticketNumber]: v }))
                      }
                    >
                      <SelectTrigger
                        className="w-36"
                        data-ocid={`admin.tickets.status.${i + 1}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm">
                    {nsToString(t.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-40 text-sm"
                      value={rowNotes[t.ticketNumber] ?? ""}
                      onChange={(e) =>
                        setRowNotes((p) => ({
                          ...p,
                          [t.ticketNumber]: e.target.value,
                        }))
                      }
                      placeholder="Notes..."
                      data-ocid={`admin.tickets.notes.${i + 1}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      className="btn-gradient text-white"
                      onClick={() => handleSave(t.ticketNumber)}
                      disabled={saving[t.ticketNumber]}
                      data-ocid={`admin.tickets.save_button.${i + 1}`}
                    >
                      {saving[t.ticketNumber] ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                    </Button>
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
        </Tabs>
      </main>
    </div>
  );
}

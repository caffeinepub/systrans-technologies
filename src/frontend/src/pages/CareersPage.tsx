import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Briefcase,
  CheckCircle,
  IndianRupee,
  Loader2,
  MapPin,
  Upload,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useFileUpload } from "../hooks/useFileUpload";
import {
  useActiveJobPositions,
  useSubmitJobApplication,
} from "../hooks/useQueries";
import type { JobPosition } from "../hooks/useQueries";

function formatSalary(salary: bigint): string {
  const n = Number(salary);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L/year`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K/year`;
  return `₹${n.toLocaleString("en-IN")}/year`;
}

interface ApplyFormState {
  applicantName: string;
  email: string;
  yearsOfExperience: string;
  currentCTC: string;
  expectedCTC: string;
  resumeFile: File | null;
}

const defaultForm: ApplyFormState = {
  applicantName: "",
  email: "",
  yearsOfExperience: "",
  currentCTC: "",
  expectedCTC: "",
  resumeFile: null,
};

function JobCard({
  job,
  onApply,
}: {
  job: JobPosition;
  onApply: (job: JobPosition) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card border border-border rounded-xl p-6 hover:border-accent/50 hover:shadow-teal-glow-sm transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground mb-2">
            {job.title}
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className="bg-accent/15 text-accent border-accent/30 text-xs">
              <Briefcase className="w-3 h-3 mr-1" />
              {job.department}
            </Badge>
            <Badge
              variant="outline"
              className="border-border text-muted-foreground text-xs"
            >
              <MapPin className="w-3 h-3 mr-1" />
              {job.location}
            </Badge>
            <Badge
              variant="outline"
              className="border-border text-muted-foreground text-xs"
            >
              <IndianRupee className="w-3 h-3 mr-1" />
              {formatSalary(job.salary)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {job.description}
          </p>
        </div>
        <Button
          className="btn-gradient text-white font-semibold shrink-0"
          onClick={() => onApply(job)}
          data-ocid="careers.apply.button"
        >
          Apply Now
        </Button>
      </div>
    </motion.div>
  );
}

export default function CareersPage() {
  const { data: jobs, isLoading } = useActiveJobPositions();
  const submitApplication = useSubmitJobApplication();
  const { uploadFile, ready: storageReady } = useFileUpload();

  const [selectedJob, setSelectedJob] = useState<JobPosition | null>(null);
  const [form, setForm] = useState<ApplyFormState>(defaultForm);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = (job: JobPosition) => {
    setSelectedJob(job);
    setForm(defaultForm);
    setApplied(false);
    setUploadProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setForm((p) => ({ ...p, resumeFile: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    let resumeFileId = "";
    if (form.resumeFile) {
      try {
        setUploading(true);
        resumeFileId = await uploadFile(form.resumeFile, setUploadProgress);
      } catch {
        toast.error("Failed to upload resume. Please try again.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    try {
      await submitApplication.mutateAsync({
        applicantName: form.applicantName,
        email: form.email,
        yearsOfExperience: form.yearsOfExperience,
        currentCTC: form.currentCTC,
        expectedCTC: form.expectedCTC,
        jobId: selectedJob.id,
        resumeFileId,
        appliedAt: BigInt(Date.now()),
      });
      setApplied(true);
      toast.success("Application submitted successfully!");
    } catch {
      toast.error("Failed to submit application. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Banner */}
      <section className="hero-bg py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-1.5 mb-4">
              <Users className="w-4 h-4 text-accent" />
              <span className="text-accent text-sm font-medium">
                We're Hiring
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
              Join Our <span className="text-accent">Team</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Build the future of technology with us. We're looking for
              passionate people who want to make a difference.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-foreground mb-8">
            Open Positions
          </h2>

          {isLoading ? (
            <div
              className="flex items-center justify-center py-16"
              data-ocid="careers.loading_state"
            >
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <div
              className="text-center py-16 bg-card border border-border rounded-xl"
              data-ocid="careers.empty_state"
            >
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">
                No Open Positions Right Now
              </h3>
              <p className="text-muted-foreground text-sm">
                Check back soon — we're growing fast!
              </p>
            </div>
          ) : (
            <div className="space-y-4" data-ocid="careers.list">
              {jobs.map((job, i) => (
                <div key={job.id} data-ocid={`careers.item.${i + 1}`}>
                  <JobCard job={job} onApply={handleApply} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* Apply Modal */}
      <AnimatePresence>
        {selectedJob && (
          <Dialog
            open={!!selectedJob}
            onOpenChange={(o) => {
              if (!o) setSelectedJob(null);
            }}
          >
            <DialogContent
              className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto"
              data-ocid="careers.modal"
            >
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {applied
                    ? "Application Submitted!"
                    : `Apply for ${selectedJob.title}`}
                </DialogTitle>
              </DialogHeader>

              {applied ? (
                <div
                  className="text-center py-6"
                  data-ocid="careers.success_state"
                >
                  <CheckCircle className="w-14 h-14 text-accent mx-auto mb-4" />
                  <p className="text-foreground font-semibold mb-2">
                    Thank you for applying!
                  </p>
                  <p className="text-muted-foreground text-sm">
                    We'll review your application and reach out soon.
                  </p>
                  <Button
                    className="mt-4 btn-gradient text-white"
                    onClick={() => setSelectedJob(null)}
                    data-ocid="careers.close.button"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label className="text-foreground mb-1 block">
                        Full Name
                      </Label>
                      <Input
                        required
                        placeholder="John Doe"
                        value={form.applicantName}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            applicantName: e.target.value,
                          }))
                        }
                        className="bg-input border-border text-foreground"
                        data-ocid="careers.name.input"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-foreground mb-1 block">
                        Email
                      </Label>
                      <Input
                        required
                        type="email"
                        placeholder="john@example.com"
                        value={form.email}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, email: e.target.value }))
                        }
                        className="bg-input border-border text-foreground"
                        data-ocid="careers.email.input"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground mb-1 block">
                        Years of Experience
                      </Label>
                      <Input
                        required
                        type="number"
                        placeholder="3"
                        value={form.yearsOfExperience}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            yearsOfExperience: e.target.value,
                          }))
                        }
                        className="bg-input border-border text-foreground"
                        data-ocid="careers.experience.input"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground mb-1 block">
                        Current CTC (₹)
                      </Label>
                      <Input
                        required
                        placeholder="600000"
                        value={form.currentCTC}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, currentCTC: e.target.value }))
                        }
                        className="bg-input border-border text-foreground"
                        data-ocid="careers.current_ctc.input"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-foreground mb-1 block">
                        Expected CTC (₹)
                      </Label>
                      <Input
                        required
                        placeholder="800000"
                        value={form.expectedCTC}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            expectedCTC: e.target.value,
                          }))
                        }
                        className="bg-input border-border text-foreground"
                        data-ocid="careers.expected_ctc.input"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-foreground mb-1 block">
                        Resume (PDF/DOC)
                      </Label>
                      <div
                        className="border border-dashed border-border rounded-lg p-4 text-center hover:border-accent/50 transition-colors"
                        data-ocid="careers.dropzone"
                      >
                        <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                        <label className="cursor-pointer text-sm text-muted-foreground">
                          <span className="text-accent">Click to upload</span>{" "}
                          or drag & drop
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="hidden"
                            data-ocid="careers.upload_button"
                          />
                        </label>
                        {form.resumeFile && (
                          <p className="text-xs text-accent mt-2">
                            {form.resumeFile.name}
                          </p>
                        )}
                        {uploading && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Uploading... {uploadProgress}%
                          </p>
                        )}
                      </div>
                      {!storageReady && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Storage initializing...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-border text-muted-foreground"
                      onClick={() => setSelectedJob(null)}
                      data-ocid="careers.cancel.button"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 btn-gradient text-white"
                      disabled={submitApplication.isPending || uploading}
                      data-ocid="careers.submit.button"
                    >
                      {submitApplication.isPending || uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

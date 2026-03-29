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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Eye,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  Ticket,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  Employee,
  backendInterface as FullBackendInterface,
  Ticket as TicketType,
} from "../backend.d";
import { useActor } from "../hooks/useActor";

type Section = "tickets" | "change-password";

function nsToString(ns: bigint | null | undefined): string {
  if (!ns && ns !== BigInt(0)) return "-";
  return new Date(Number(ns) / 1_000_000).toLocaleString("en-IN");
}

function statusColor(status: string): string {
  if (status === "resolved") return "bg-green-100 text-green-800";
  if (status === "in-progress") return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

export default function SupportPortalPage() {
  const { actor: _actor } = useActor();
  const actor = _actor as unknown as FullBackendInterface | null;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loginId, setLoginId] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [section, setSection] = useState<Section>("tickets");

  // Tickets state
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [viewTicket, setViewTicket] = useState<TicketType | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  // Password state
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  async function handleLogin() {
    if (!actor) return;
    setLoginLoading(true);
    setLoginError("");
    try {
      const result = await actor.employeeLogin(loginId.trim(), loginPass);
      if (!result) {
        setLoginError("Invalid credentials. Please try again.");
      } else if (result.role !== "support") {
        setLoginError("Access denied. Support role required.");
      } else {
        setEmployee(result);
        loadTickets();
      }
    } catch {
      setLoginError("Login failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function loadTickets() {
    if (!actor) return;
    setTicketsLoading(true);
    try {
      const all = await actor.getAllTickets();
      setTickets(all);
    } catch {
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  }

  function openTicket(t: TicketType) {
    setViewTicket(t);
    setEditStatus(t.status);
    setEditNotes(t.notes || "");
  }

  async function handleSaveTicket() {
    if (!actor || !viewTicket) return;
    setSaveLoading(true);
    try {
      await actor.updateTicketStatus(
        viewTicket.ticketNumber,
        editStatus,
        editNotes,
      );
      toast.success("Ticket updated!");
      setViewTicket(null);
      loadTickets();
    } catch {
      toast.error("Failed to update ticket.");
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleChangePassword() {
    if (!actor || !employee) return;
    if (newPass !== confirmPass) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPass.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setPwLoading(true);
    try {
      const ok = await actor.changeEmployeePassword(
        employee.employeeId,
        oldPass,
        newPass,
      );
      if (ok) {
        toast.success("Password changed!");
        setOldPass("");
        setNewPass("");
        setConfirmPass("");
      } else {
        toast.error("Old password is incorrect.");
      }
    } catch {
      toast.error("Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  }

  // Login screen
  if (!employee) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f8faff" }}
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-200">
          <div className="flex flex-col items-center mb-8">
            <img
              src="/assets/uploads/154-removebg-preview-019d343e-3b74-77fa-8c99-6fa4ec112249-1.png"
              alt="SysTrans"
              className="h-14 w-auto object-contain mb-2"
            />
            <h1 className="text-2xl font-bold" style={{ color: "#000080" }}>
              Support Portal
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Support team access only
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 mb-1 block">Employee ID</Label>
              <Input
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="e.g. SYS001"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                data-ocid="support.login.input"
              />
            </div>
            <div>
              <Label className="text-gray-700 mb-1 block">Password</Label>
              <Input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="Password"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                data-ocid="support.login.password.input"
              />
            </div>
            {loginError && (
              <p
                className="text-red-600 text-sm"
                data-ocid="support.login.error_state"
              >
                {loginError}
              </p>
            )}
            <Button
              className="w-full font-semibold text-white"
              style={{ backgroundColor: "#000080" }}
              onClick={handleLogin}
              disabled={loginLoading || !actor}
              data-ocid="support.login.button"
            >
              {loginLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {loginLoading ? "Signing in..." : "Sign In"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8faff" }}>
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <img
            src="/assets/uploads/154-removebg-preview-019d343e-3b74-77fa-8c99-6fa4ec112249-1.png"
            alt="SysTrans"
            className="h-8 w-auto object-contain"
          />
          <span className="font-bold text-lg" style={{ color: "#000080" }}>
            Support Portal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-gray-600">
            {employee.firstName} {employee.lastName}{" "}
            <span className="text-gray-400">({employee.employeeId})</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEmployee(null);
              setLoginId("");
              setLoginPass("");
            }}
            data-ocid="support.logout.button"
          >
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-6">
        {/* Sidebar */}
        <aside className="sm:w-48 flex-shrink-0">
          <nav className="flex sm:flex-col gap-2">
            {(
              [
                { id: "tickets", label: "Tickets", icon: Ticket },
                {
                  id: "change-password",
                  label: "Change Password",
                  icon: KeyRound,
                },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setSection(id)}
                data-ocid={`support.${id}.tab`}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  section === id
                    ? "text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                style={section === id ? { backgroundColor: "#000080" } : {}}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          {section === "tickets" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: "#000080" }}>
                  All Tickets
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadTickets}
                  disabled={ticketsLoading}
                  data-ocid="support.tickets.refresh"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-1 ${ticketsLoading ? "animate-spin" : ""}`}
                  />{" "}
                  Refresh
                </Button>
              </div>
              {ticketsLoading ? (
                <div
                  className="flex items-center gap-2 text-gray-500"
                  data-ocid="support.tickets.loading_state"
                >
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading
                  tickets...
                </div>
              ) : tickets.length === 0 ? (
                <p
                  className="text-gray-500 text-sm"
                  data-ocid="support.tickets.empty_state"
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
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((t, i) => (
                        <TableRow
                          key={t.ticketNumber}
                          data-ocid={`support.tickets.item.${i + 1}`}
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
                              onClick={() => openTicket(t)}
                              data-ocid={`support.tickets.view.${i + 1}`}
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
            </div>
          )}

          {section === "change-password" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2
                className="text-xl font-bold mb-6"
                style={{ color: "#000080" }}
              >
                Change Password
              </h2>
              <div className="space-y-4 max-w-sm">
                <div>
                  <Label className="mb-1 block text-gray-700">
                    Old Password
                  </Label>
                  <Input
                    type="password"
                    value={oldPass}
                    onChange={(e) => setOldPass(e.target.value)}
                    data-ocid="support.old_password.input"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-gray-700">
                    New Password
                  </Label>
                  <Input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    data-ocid="support.new_password.input"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-gray-700">
                    Confirm New Password
                  </Label>
                  <Input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    data-ocid="support.confirm_password.input"
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={pwLoading}
                  className="text-white font-semibold"
                  style={{ backgroundColor: "#000080" }}
                  data-ocid="support.change_password.button"
                >
                  {pwLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {pwLoading ? "Saving..." : "Change Password"}
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* View Ticket Dialog */}
      <Dialog
        open={!!viewTicket}
        onOpenChange={(o) => !o && setViewTicket(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: "#000080" }}>
              Ticket Details — {viewTicket?.ticketNumber}
            </DialogTitle>
          </DialogHeader>
          {viewTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Raised By:</span>{" "}
                  <span className="font-medium">{viewTicket.raisedBy}</span>
                </div>
                <div>
                  <span className="text-gray-500">Category:</span>{" "}
                  <span className="font-medium">{viewTicket.category}</span>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>{" "}
                  <span className="font-medium">
                    {nsToString(viewTicket.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Current Status:</span>
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(viewTicket.status)}`}
                  >
                    {viewTicket.status}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-1">Description:</p>
                <p className="text-sm bg-gray-50 rounded p-3">
                  {viewTicket.description}
                </p>
              </div>
              <div>
                <Label className="mb-1 block text-gray-700">
                  Update Status
                </Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger data-ocid="support.ticket_status.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block text-gray-700">Notes</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add resolution notes..."
                  rows={3}
                  data-ocid="support.ticket_notes.textarea"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewTicket(null)}
              data-ocid="support.ticket_dialog.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTicket}
              disabled={saveLoading}
              className="text-white"
              style={{ backgroundColor: "#000080" }}
              data-ocid="support.ticket_dialog.save_button"
            >
              {saveLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  CheckCircle,
  ClipboardList,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  Ticket,
  Timer,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  Employee,
  backendInterface as FullBackendInterface,
  Ticket as TicketType,
  TimesheetEntry,
} from "../backend.d";
import { useActor } from "../hooks/useActor";

type Section = "timesheet" | "change-password" | "raise-ticket" | "my-tickets";

function nsToString(ns: bigint | null | undefined): string {
  if (!ns && ns !== BigInt(0)) return "-";
  return new Date(Number(ns) / 1_000_000).toLocaleString("en-IN");
}

function statusColor(status: string): string {
  if (status === "resolved") return "bg-green-100 text-green-800";
  if (status === "in-progress") return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

export default function EmployeePortalPage() {
  const { actor: _actor } = useActor();
  const actor = _actor as unknown as FullBackendInterface | null;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loginId, setLoginId] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [section, setSection] = useState<Section>("timesheet");

  // Timesheet state
  const [todayEntry, setTodayEntry] = useState<
    TimesheetEntry | null | undefined
  >(undefined);
  const [timesheetLoading, setTimesheetLoading] = useState(false);

  // Change password state
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Ticket state
  const [ticketCategory, setTicketCategory] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketLoading, setTicketLoading] = useState(false);
  const [myTickets, setMyTickets] = useState<TicketType[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  async function handleLogin() {
    if (!actor) return;
    setLoginLoading(true);
    setLoginError("");
    try {
      const result = await actor.employeeLogin(loginId.trim(), loginPass);
      if (result) {
        setEmployee(result);
        loadTodayEntry(result.employeeId);
        loadMyTickets(result.employeeId);
      } else {
        setLoginError("Invalid credentials. Please try again.");
      }
    } catch {
      setLoginError("Login failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function loadTodayEntry(empId: string) {
    if (!actor) return;
    setTimesheetLoading(true);
    try {
      const entry = await actor.getTodayTimesheetEntry(empId, today);
      setTodayEntry(entry);
    } catch {
      setTodayEntry(null);
    } finally {
      setTimesheetLoading(false);
    }
  }

  async function handleCheckIn() {
    if (!actor || !employee) return;
    setTimesheetLoading(true);
    try {
      const entry = await actor.checkIn(employee.employeeId, today);
      setTodayEntry(entry);
      toast.success("Checked in successfully!");
    } catch {
      toast.error("Check-in failed.");
    } finally {
      setTimesheetLoading(false);
    }
  }

  async function handleCheckOut() {
    if (!actor || !employee) return;
    setTimesheetLoading(true);
    try {
      const entry = await actor.checkOut(employee.employeeId, today);
      if (entry) setTodayEntry(entry);
      toast.success("Checked out successfully!");
    } catch {
      toast.error("Check-out failed.");
    } finally {
      setTimesheetLoading(false);
    }
  }

  async function handleChangePassword() {
    if (!actor || !employee) return;
    if (newPass !== confirmPass) {
      toast.error("New passwords do not match.");
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
        toast.success("Password changed successfully!");
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

  async function handleRaiseTicket() {
    if (!actor || !employee) return;
    if (!ticketCategory || !ticketDesc.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setTicketLoading(true);
    try {
      const ticket = await actor.createTicket(
        employee.employeeId,
        ticketCategory,
        ticketDesc.trim(),
      );
      toast.success(`Ticket raised! Ticket #: ${ticket.ticketNumber}`);
      setTicketCategory("");
      setTicketDesc("");
      loadMyTickets(employee.employeeId);
    } catch {
      toast.error("Failed to raise ticket.");
    } finally {
      setTicketLoading(false);
    }
  }

  async function loadMyTickets(empId: string) {
    if (!actor) return;
    setTicketsLoading(true);
    try {
      const tickets = await actor.getTicketsByEmployee(empId);
      setMyTickets(tickets);
    } catch {
      setMyTickets([]);
    } finally {
      setTicketsLoading(false);
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
              Employee Portal
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Sign in with your employee credentials
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
                data-ocid="employee.login.input"
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
                data-ocid="employee.login.password.input"
              />
            </div>
            {loginError && (
              <p
                className="text-red-600 text-sm"
                data-ocid="employee.login.error_state"
              >
                {loginError}
              </p>
            )}
            <Button
              className="w-full font-semibold text-white"
              style={{ backgroundColor: "#000080" }}
              onClick={handleLogin}
              disabled={loginLoading || !actor}
              data-ocid="employee.login.button"
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <img
            src="/assets/uploads/154-removebg-preview-019d343e-3b74-77fa-8c99-6fa4ec112249-1.png"
            alt="SysTrans"
            className="h-8 w-auto object-contain"
          />
          <span className="font-bold text-lg" style={{ color: "#000080" }}>
            Employee Portal
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
            data-ocid="employee.logout.button"
          >
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-6">
        {/* Sidebar */}
        <aside className="sm:w-48 flex-shrink-0">
          <nav className="flex sm:flex-col gap-2">
            {(
              [
                { id: "timesheet", label: "Timesheet", icon: Timer },
                { id: "raise-ticket", label: "Raise Ticket", icon: Ticket },
                { id: "my-tickets", label: "My Tickets", icon: ClipboardList },
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
                data-ocid={`employee.${id}.tab`}
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

        {/* Content */}
        <main className="flex-1">
          {/* Timesheet */}
          {section === "timesheet" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2
                className="text-xl font-bold mb-1"
                style={{ color: "#000080" }}
              >
                Timesheet
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Today:{" "}
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {timesheetLoading ? (
                <div
                  className="flex items-center gap-2 text-gray-500"
                  data-ocid="employee.timesheet.loading_state"
                >
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Check-In Time
                      </p>
                      <p className="font-semibold text-gray-800">
                        {todayEntry?.checkInTime
                          ? nsToString(todayEntry.checkInTime)
                          : "-"}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Check-Out Time
                      </p>
                      <p className="font-semibold text-gray-800">
                        {todayEntry?.checkOutTime
                          ? nsToString(todayEntry.checkOutTime)
                          : "-"}
                      </p>
                    </div>
                  </div>
                  {!todayEntry?.checkInTime && (
                    <Button
                      onClick={handleCheckIn}
                      disabled={timesheetLoading}
                      className="text-white font-semibold"
                      style={{ backgroundColor: "#000080" }}
                      data-ocid="employee.checkin.button"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" /> Check In
                    </Button>
                  )}
                  {todayEntry?.checkInTime && !todayEntry?.checkOutTime && (
                    <Button
                      onClick={handleCheckOut}
                      disabled={timesheetLoading}
                      variant="outline"
                      className="border-navy font-semibold"
                      style={{ borderColor: "#000080", color: "#000080" }}
                      data-ocid="employee.checkout.button"
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Check Out
                    </Button>
                  )}
                  {todayEntry?.checkInTime && todayEntry?.checkOutTime && (
                    <p className="text-green-600 font-medium text-sm">
                      ✓ Attendance recorded for today.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Change Password */}
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
                    data-ocid="employee.old_password.input"
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
                    data-ocid="employee.new_password.input"
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
                    data-ocid="employee.confirm_password.input"
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={pwLoading}
                  className="text-white font-semibold"
                  style={{ backgroundColor: "#000080" }}
                  data-ocid="employee.change_password.button"
                >
                  {pwLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {pwLoading ? "Saving..." : "Change Password"}
                </Button>
              </div>
            </div>
          )}

          {/* Raise Ticket */}
          {section === "raise-ticket" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2
                className="text-xl font-bold mb-6"
                style={{ color: "#000080" }}
              >
                Raise a Ticket
              </h2>
              <div className="space-y-4 max-w-lg">
                <div>
                  <Label className="mb-1 block text-gray-700">Category</Label>
                  <Select
                    value={ticketCategory}
                    onValueChange={setTicketCategory}
                  >
                    <SelectTrigger data-ocid="employee.ticket_category.select">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT Support">IT Support</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1 block text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    value={ticketDesc}
                    onChange={(e) => setTicketDesc(e.target.value)}
                    placeholder="Describe your issue..."
                    rows={4}
                    data-ocid="employee.ticket_description.textarea"
                  />
                </div>
                <Button
                  onClick={handleRaiseTicket}
                  disabled={ticketLoading}
                  className="text-white font-semibold"
                  style={{ backgroundColor: "#000080" }}
                  data-ocid="employee.raise_ticket.button"
                >
                  {ticketLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {ticketLoading ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </div>
          )}

          {/* My Tickets */}
          {section === "my-tickets" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: "#000080" }}>
                  My Tickets
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => employee && loadMyTickets(employee.employeeId)}
                  disabled={ticketsLoading}
                  data-ocid="employee.tickets.refresh"
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
                  data-ocid="employee.tickets.loading_state"
                >
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading...
                </div>
              ) : myTickets.length === 0 ? (
                <p
                  className="text-gray-500 text-sm"
                  data-ocid="employee.tickets.empty_state"
                >
                  No tickets raised yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket #</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myTickets.map((t, i) => (
                        <TableRow
                          key={t.ticketNumber}
                          data-ocid={`employee.tickets.item.${i + 1}`}
                        >
                          <TableCell className="font-mono text-sm">
                            {t.ticketNumber}
                          </TableCell>
                          <TableCell>{t.category}</TableCell>
                          <TableCell className="max-w-xs truncate">
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
                          <TableCell className="text-sm text-gray-500">
                            {t.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

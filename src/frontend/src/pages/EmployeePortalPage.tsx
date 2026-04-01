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
  Bell,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  Ticket,
  Timer,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  Announcement,
  Employee,
  backendInterface as FullBackendInterface,
  Ticket as TicketType,
  TimesheetEntry,
} from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useFileUpload } from "../hooks/useFileUpload";

type BackendWithLeave = FullBackendInterface;
type LeaveRequest = import("../backend").LeaveRequest;

type Section =
  | "timesheet"
  | "change-password"
  | "raise-ticket"
  | "my-tickets"
  | "apply-leave"
  | "profile";

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
  const actor = _actor as BackendWithLeave | null;
  const { getFileUrl } = useFileUpload();
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

  // Leave state
  const [leaveBalance, setLeaveBalance] = useState<bigint>(BigInt(0));
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  // Announcements / notifications
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [announcementMediaUrls, setAnnouncementMediaUrls] = useState<
    Record<string, string>
  >({});

  const today = new Date().toISOString().split("T")[0];

  async function loadAnnouncements() {
    if (!actor) return;
    try {
      const list = await actor.getAllAnnouncements();
      setAnnouncements(list);
      // preload media URLs
      for (const a of list) {
        if (a.mediaFileId && a.mediaType !== "none") {
          getFileUrl(a.mediaFileId)
            .then((url) =>
              setAnnouncementMediaUrls((prev) => ({ ...prev, [a.id]: url })),
            )
            .catch(() => {});
        }
      }
    } catch {
      // silently fail
    }
  }

  async function loadLeaveData(empId: string) {
    if (!actor) return;
    try {
      const [bal, reqs] = await Promise.all([
        actor.initOrRefreshLeaveBalance(empId),
        actor.getLeavesByEmployee(empId),
      ]);
      setLeaveBalance(bal);
      setLeaveRequests(reqs);
    } catch {
      // silently fail
    }
  }

  async function handleApplyLeave() {
    if (!actor || !employee) return;
    if (!leaveStartDate || !leaveEndDate || !leaveReason.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    const start = new Date(leaveStartDate);
    const end = new Date(leaveEndDate);
    if (end < start) {
      toast.error("End date must be after start date.");
      return;
    }
    const days = BigInt(
      Math.round((end.getTime() - start.getTime()) / 86400000) + 1,
    );
    setLeaveSubmitting(true);
    try {
      await actor.applyLeave(
        employee.employeeId,
        leaveReason.trim(),
        leaveStartDate,
        leaveEndDate,
        days,
      );
      toast.success("Leave application submitted!");
      setLeaveStartDate("");
      setLeaveEndDate("");
      setLeaveReason("");
      loadLeaveData(employee.employeeId);
    } catch {
      toast.error("Failed to submit leave application.");
    } finally {
      setLeaveSubmitting(false);
    }
  }

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
        loadAnnouncements();
        loadLeaveData(result.employeeId);
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
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#f8faff" }}
      >
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md border border-gray-200">
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
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <img
            src="/assets/uploads/154-removebg-preview-019d343e-3b74-77fa-8c99-6fa4ec112249-1.png"
            alt="SysTrans"
            className="h-8 w-auto object-contain"
          />
          <span
            className="font-bold text-base sm:text-lg"
            style={{ color: "#000080" }}
          >
            Employee Portal
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:block text-sm text-gray-600">
            {employee.firstName} {employee.lastName}{" "}
            <span className="text-gray-400">({employee.employeeId})</span>
          </span>
          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((v) => !v)}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              data-ocid="employee.notifications.button"
            >
              <Bell className="h-5 w-5" style={{ color: "#000080" }} />
              {announcements.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {announcements.length > 9 ? "9+" : announcements.length}
                </span>
              )}
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEmployee(null);
              setLoginId("");
              setLoginPass("");
              setAnnouncements([]);
              setShowNotifications(false);
            }}
            data-ocid="employee.logout.button"
          >
            <LogOut className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Notifications Panel Overlay */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          data-ocid="employee.notifications.panel"
        >
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setShowNotifications(false)}
            onKeyDown={(e) => e.key === "Escape" && setShowNotifications(false)}
            role="button"
            tabIndex={-1}
            aria-label="Close notifications"
          />
          <div className="relative bg-white w-full max-w-sm h-full shadow-2xl flex flex-col overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ backgroundColor: "#000080" }}
            >
              <h2 className="text-white font-bold text-lg">Announcements</h2>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="text-white/80 hover:text-white"
                data-ocid="employee.notifications.close_button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {announcements.length === 0 ? (
                <p
                  className="text-gray-500 text-sm text-center mt-8"
                  data-ocid="employee.notifications.empty_state"
                >
                  No announcements yet.
                </p>
              ) : (
                announcements
                  .slice()
                  .sort((a, b) => Number(b.createdAt - a.createdAt))
                  .map((ann) => (
                    <div
                      key={ann.id}
                      className="bg-blue-50 border border-blue-100 rounded-lg p-4"
                      data-ocid="employee.announcement.card"
                    >
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
                      {ann.mediaType === "image" &&
                        announcementMediaUrls[ann.id] && (
                          <img
                            src={announcementMediaUrls[ann.id]}
                            alt={ann.title}
                            className="mt-2 rounded w-full object-cover max-h-48"
                          />
                        )}
                      {ann.mediaType === "video" &&
                        announcementMediaUrls[ann.id] && (
                          <video
                            src={announcementMediaUrls[ann.id]}
                            controls
                            className="mt-2 rounded w-full max-h-48"
                          >
                            <track kind="captions" />
                          </video>
                        )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Sidebar */}
        <aside className="sm:w-48 flex-shrink-0">
          <nav className="flex sm:flex-col flex-wrap gap-1.5 sm:gap-2">
            {(
              [
                { id: "timesheet", label: "Timesheet", icon: Timer },
                { id: "raise-ticket", label: "Raise Ticket", icon: Ticket },
                { id: "my-tickets", label: "My Tickets", icon: ClipboardList },
                { id: "apply-leave", label: "Apply Leave", icon: CalendarDays },
                {
                  id: "change-password",
                  label: "Change Password",
                  icon: KeyRound,
                },
                { id: "profile", label: "Profile", icon: User },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setSection(id)}
                data-ocid={`employee.${id}.tab`}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors text-left ${
                  section === id
                    ? "text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                style={section === id ? { backgroundColor: "#000080" } : {}}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {/* Timesheet */}
          {section === "timesheet" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2
                className="text-lg sm:text-xl font-bold mb-1"
                style={{ color: "#000080" }}
              >
                Timesheet
              </h2>
              <p className="text-gray-500 text-sm mb-4 sm:mb-6">
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
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Check-In Time
                      </p>
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">
                        {todayEntry?.checkInTime
                          ? nsToString(todayEntry.checkInTime)
                          : "-"}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Check-Out Time
                      </p>
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">
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
                      className="font-semibold"
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2
                className="text-lg sm:text-xl font-bold mb-4 sm:mb-6"
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2
                className="text-lg sm:text-xl font-bold mb-4 sm:mb-6"
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2
                  className="text-lg sm:text-xl font-bold"
                  style={{ color: "#000080" }}
                >
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

          {/* Apply Leave */}
          {section === "apply-leave" && (
            <div className="space-y-4 sm:space-y-6">
              {/* Balance Card */}
              <div
                className="rounded-xl p-4 sm:p-6 text-white flex items-center gap-4"
                style={{ backgroundColor: "#000080" }}
              >
                <CalendarDays className="h-10 w-10 opacity-80 flex-shrink-0" />
                <div>
                  <p className="text-sm opacity-80">Available Leave Balance</p>
                  <p className="text-3xl font-bold">
                    {Number(leaveBalance)}{" "}
                    {Number(leaveBalance) === 1 ? "day" : "days"}
                  </p>
                  <p className="text-xs opacity-70 mt-1">
                    2 leaves credited each month. Excess leaves marked as LOP.
                  </p>
                </div>
              </div>

              {/* Apply Form */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2
                  className="text-lg font-bold mb-1"
                  style={{ color: "#000080" }}
                >
                  Apply for Leave
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Max 2 leave applications per month. Additional leaves will be
                  marked as Loss of Pay (LOP).
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1 block text-sm text-gray-700">
                        Start Date
                      </Label>
                      <Input
                        type="date"
                        value={leaveStartDate}
                        onChange={(e) => setLeaveStartDate(e.target.value)}
                        data-ocid="employee.leave_start.input"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block text-sm text-gray-700">
                        End Date
                      </Label>
                      <Input
                        type="date"
                        value={leaveEndDate}
                        onChange={(e) => setLeaveEndDate(e.target.value)}
                        data-ocid="employee.leave_end.input"
                      />
                    </div>
                  </div>
                  {leaveStartDate &&
                    leaveEndDate &&
                    new Date(leaveEndDate) >= new Date(leaveStartDate) && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Number of days:{" "}
                          <strong>
                            {Math.round(
                              (new Date(leaveEndDate).getTime() -
                                new Date(leaveStartDate).getTime()) /
                                86400000,
                            ) + 1}
                          </strong>
                        </span>
                        {(() => {
                          const days =
                            Math.round(
                              (new Date(leaveEndDate).getTime() -
                                new Date(leaveStartDate).getTime()) /
                                86400000,
                            ) + 1;
                          return days > Number(leaveBalance) ? (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              ⚠ Insufficient balance — will be marked as LOP
                            </span>
                          ) : null;
                        })()}
                      </div>
                    )}
                  <div>
                    <Label className="mb-1 block text-sm text-gray-700">
                      Reason <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder="Please provide reason for leave..."
                      rows={3}
                      data-ocid="employee.leave_reason.textarea"
                    />
                  </div>
                  <Button
                    onClick={handleApplyLeave}
                    disabled={
                      leaveSubmitting ||
                      !leaveStartDate ||
                      !leaveEndDate ||
                      !leaveReason.trim()
                    }
                    className="text-white w-full sm:w-auto"
                    style={{ backgroundColor: "#000080" }}
                    data-ocid="employee.leave.submit_button"
                  >
                    {leaveSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Submit Leave Application
                  </Button>
                </div>
              </div>

              {/* Leave History */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className="text-lg font-bold"
                    style={{ color: "#000080" }}
                  >
                    Leave History
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      employee && loadLeaveData(employee.employeeId)
                    }
                    data-ocid="employee.leave.secondary_button"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                  </Button>
                </div>
                {leaveRequests.length === 0 ? (
                  <p
                    className="text-gray-500 text-sm"
                    data-ocid="employee.leave.empty_state"
                  >
                    No leave applications found.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Leave ID</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Applied On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaveRequests.map((lr, idx) => (
                          <TableRow
                            key={lr.id}
                            data-ocid={`employee.leave.item.${idx + 1}`}
                          >
                            <TableCell className="font-mono text-xs">
                              {lr.id.slice(0, 8)}...
                            </TableCell>
                            <TableCell className="text-xs">
                              {lr.startDate} → {lr.endDate}
                            </TableCell>
                            <TableCell>{Number(lr.numberOfDays)}</TableCell>
                            <TableCell className="max-w-32 truncate text-xs">
                              {lr.reason}
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  lr.status === "approved"
                                    ? "px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                    : lr.status === "rejected"
                                      ? "px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                                      : lr.status === "lop"
                                        ? "px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                                        : "px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                                }
                              >
                                {lr.status === "lop"
                                  ? "LOP"
                                  : lr.status.charAt(0).toUpperCase() +
                                    lr.status.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs">
                              {new Date(
                                Number(lr.requestedAt) / 1_000_000,
                              ).toLocaleDateString("en-IN")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile */}
          {section === "profile" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2
                className="text-lg sm:text-xl font-bold mb-4 sm:mb-6"
                style={{ color: "#000080" }}
              >
                My Profile
              </h2>

              {/* Initials Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4"
                  style={{ backgroundColor: "#000080", borderColor: "#000080" }}
                >
                  {employee.firstName?.[0]}
                  {employee.lastName?.[0]}
                </div>
                <p className="mt-2 text-sm font-semibold text-gray-700">
                  {employee.firstName} {employee.lastName}
                </p>
                <p className="text-xs text-gray-500">{employee.employeeId}</p>
              </div>

              {/* Profile Details (read-only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(
                  [
                    ["First Name", employee.firstName],
                    ["Last Name", employee.lastName],
                    ["Email", employee.email],
                    ["Mobile", employee.mobile],
                    ["Date of Birth", employee.dob],
                    ["Date of Joining", employee.dateOfJoining],
                    ["Position", employee.position],
                    ["Address", employee.address],
                    ["City", employee.city],
                    ["State", employee.state],
                    ["Pincode", employee.pincode],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div key={label}>
                    <Label className="text-xs text-gray-500 mb-0.5 block">
                      {label}
                    </Label>
                    <p className="text-sm font-medium text-gray-800 bg-gray-50 rounded px-3 py-2">
                      {value || "-"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

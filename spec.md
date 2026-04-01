# SysTrans Technologies

## Current State
Full-stack app with employee portal (/employee), support portal (/support), and admin panel (/admin). Backend has employees, timesheets, tickets, and announcements. No leave management exists.

## Requested Changes (Diff)

### Add
- `LeaveRequest` type: id, employeeId, reason, startDate, endDate, numberOfDays, status (pending/approved/rejected/lop), requestedAt, approvedAt
- `LeaveBalance` type: employeeId, balance (Nat), lastCreditedMonth (Text) — used to track when the monthly 2 leaves were last credited
- Backend functions:
  - `applyLeave(employeeId, reason, startDate, endDate, numberOfDays)` → LeaveRequest. If numberOfDays > balance, status = "lop", else status = "pending"
  - `getLeavesByEmployee(employeeId)` → [LeaveRequest]
  - `getAllLeaveRequests()` → [LeaveRequest] (admin)
  - `approveLeaveRequest(id, status)` → Bool (admin, status = approved or rejected)
  - `getLeaveBalance(employeeId)` → Nat — also auto-credits 2 leaves if current month != lastCreditedMonth
  - Max 2 leave applications per calendar month (excluding LOP)
- "Apply Leave" tab in Employee Portal:
  - Shows leave balance prominently
  - Form: reason (text), start date, end date → auto-calculates number of days
  - If days > balance: warns user it will be marked as LOP, still allows submission
  - Shows history table of all leave requests with status badges
- "Apply Leave" tab in Support Portal: same as employee portal
- Admin Panel "Leave Requests" tab:
  - Table of all leave requests with employee name, dates, reason, days, status
  - Approve / Reject buttons for pending requests
  - LOP requests are shown as informational (no approval needed, already marked)

### Modify
- `backend/main.mo` — add LeaveRequest and LeaveBalance types, stable maps, and all leave functions
- `backend.did.d.ts` — add new types and method signatures
- `EmployeePortalPage.tsx` — add Apply Leave tab
- `SupportPortalPage.tsx` — add Apply Leave tab
- `AdminPage.tsx` — add Leave Requests tab

### Remove
- Nothing removed

## Implementation Plan
1. Update main.mo with LeaveRequest type, LeaveBalance type, stable maps (nextLeaveId, leaveRequests, leaveBalances), and all 6 leave functions
2. Update backend.did.d.ts with new types and methods
3. Update EmployeePortalPage.tsx with Apply Leave tab (balance display, apply form, history)
4. Update SupportPortalPage.tsx with Apply Leave tab (same as employee)
5. Update AdminPage.tsx with Leave Requests tab (view all, approve/reject)

# SysTrans Technologies

## Current State
Full-stack website with admin panel at /admin (username/password login). Backend has job positions, contact forms, ROI leads, job applications, mail templates. Frontend has HomePage, CareersPage, AdminPage with tabs. Resume download fixed in V18.

## Requested Changes (Diff)

### Add
- **Employee type** in backend: employeeId (SYS001 sequence), hashedPassword, firstName, lastName, dob, maritalStatus, address, pincode, panNumber, aadharNumber, dateOfJoining, role (employee/support/admin), position, salary
- **Timesheet type**: employeeId, checkInTime, checkOutTime, date
- **Ticket type**: ticketNumber (unique), raisedBy (employeeId), category, description, status (open/in-progress/resolved), createdAt
- Backend CRUD: createEmployee, getEmployee, updateEmployee, deleteEmployee, getAllEmployees
- Backend: employeeLogin (returns employee record or null), changeEmployeePassword
- Backend: checkIn, checkOut, getTimesheetForEmployee(employeeId, month, year), getAllTimesheets
- Backend: createTicket, getAllTickets, getTicketsByEmployee, updateTicketStatus
- **Admin panel**: new "Employees" tab with table, add employee form, view/edit/delete dialog
- **Admin panel**: view all timesheets per employee (monthly filter)
- **Admin panel**: view all tickets
- **/employee route**: login page with employeeId/password, dashboard with check-in/out, change password, raise ticket, view my tickets
- **/support route**: login page (support role only), dashboard showing all tickets, view ticket detail in dialog, update status, change password

### Modify
- App.tsx: add /employee and /support routes
- AdminPage.tsx: add Employees tab and Timesheets tab and Tickets tab

### Remove
- Nothing removed

## Implementation Plan
1. Extend Motoko backend with Employee, Timesheet, Ticket types and all CRUD/query functions
2. Create EmployeePortalPage.tsx for /employee
3. Create SupportPortalPage.tsx for /support
4. Add Employees, Timesheets, Tickets tabs to AdminPage
5. Wire new routes in App.tsx

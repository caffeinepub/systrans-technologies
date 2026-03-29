# SysTrans

## Current State
Full-stack app with admin panel (/admin), employee portal (/employee), support portal (/support). Employee type lacks email, mobile, city, state, profilePhotoFileId fields. Timesheet admin view has no total-hours calculation. Admin tickets tab allows editing (should be view-only). No ticket export in admin or support portal. No Profile section in employee/support portals.

## Requested Changes (Diff)

### Add
- Total hours worked column in admin Timesheets tab (calculated from checkIn/checkOut)
- Ticket export with date range in admin panel
- Ticket export with date range in support portal
- Profile section in employee portal (read-only details + uploadable profile photo)
- Profile section in support portal (same as employee)
- email, mobile, city, state, profilePhotoFileId fields to Employee backend type
- updateEmployeeProfilePhoto backend method

### Modify
- Admin tickets tab: remove edit capability (view-only dialog + export only)
- Employee form in admin: add email, mobile, city, state fields; auto-fetch city/state from pincode via India Post API
- Employee creation backend call: pass email, mobile, city, state, profilePhotoFileId

### Remove
- Admin tickets inline status/notes editing

## Implementation Plan
1. Update backend main.mo: add fields to Employee type, add updateEmployeeProfilePhoto method
2. Update backend.d.ts: add fields to Employee interface, add method signature
3. Update AdminPage.tsx: add email/mobile/city/state to employee forms, pincode auto-fetch, total hours in timesheet, view-only tickets with date range export
4. Update EmployeePortalPage.tsx: add Profile section
5. Update SupportPortalPage.tsx: add Profile section, add ticket export with date range

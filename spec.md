# SysTrans Technologies

## Current State
- Full-stack site with admin panel, employee portal (/employee), support portal (/support)
- Employee type has `profilePhotoFileId`; `updateEmployeeProfilePhoto` backend method exists
- Employee portal has profile photo upload UI
- Support portal has profile photo upload UI
- Support portal has NO timesheet functionality
- No notifications/announcements system
- Admin, employee, support UIs have basic responsiveness

## Requested Changes (Diff)

### Add
- `Announcement` type in backend: id, title, content, mediaFileId (blob-storage), mediaType ("none"/"image"/"video"), createdAt
- Backend methods: `createAnnouncement`, `getAllAnnouncements`, `deleteAnnouncement`
- Admin panel: "Announcements" tab — create announcement with text + optional image/video upload, list/delete announcements
- Employee portal: notification bell icon in header with unread count badge; clicking opens an announcements panel showing all announcements
- Support portal: same notification bell as employee portal
- Support portal: Timesheet tab (check-in/check-out, same as employee portal) — admin can view support staff timesheets in the Timesheets tab

### Modify
- Remove `profilePhotoFileId` from public `Employee` type (keep in internal EmployeeExtra for stable compat, just don't expose)
- Remove `updateEmployeeProfilePhoto` backend method
- Remove profile photo upload UI from employee portal profile section
- Remove profile photo upload UI from support portal profile section
- Improve responsiveness of admin panel (mobile/tablet/desktop): sidebar/tab navigation collapses, tables scroll horizontally, forms stack on mobile
- Improve responsiveness of employee portal: nav becomes hamburger on mobile, cards stack
- Improve responsiveness of support portal: nav becomes hamburger on mobile, tables/cards responsive

### Remove
- Profile photo upload functionality in employee portal
- Profile photo upload functionality in support portal
- `updateEmployeeProfilePhoto` backend endpoint

## Implementation Plan
1. Update `main.mo`: remove `profilePhotoFileId` from public Employee type (keep EmployeeExtra internal), remove `updateEmployeeProfilePhoto`, add `Announcement` type + stable map + CRUD methods
2. Update `backend.d.ts` to reflect new types (remove `profilePhotoFileId`, `updateEmployeeProfilePhoto`; add Announcement interface and methods)
3. Update `declarations/backend.did.d.ts` and `backend.did.js` accordingly
4. Update `EmployeePortalPage.tsx`: remove photo upload from profile section; add notification bell with count + announcements drawer/panel; improve mobile responsiveness
5. Update `SupportPortalPage.tsx`: remove photo upload; add notification bell + announcements panel; add Timesheet tab with check-in/check-out; improve responsiveness
6. Update `AdminPage.tsx`: add Announcements tab (create with text + image/video, list, delete); improve responsiveness of all tabs

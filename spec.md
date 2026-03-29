# SysTrans

## Current State
Full-stack site with admin panel, /employee, /support portals. Backend has Employee/Timesheet/Ticket types but bindings file is outdated and missing these. State is not stable so data resets on upgrade.

## Requested Changes (Diff)

### Add
- Stable variables for all state to persist across upgrades

### Modify
- Regenerate backend bindings to include Employee, TimesheetEntry, Ticket types and all methods

### Remove
- Nothing

## Implementation Plan
1. Regenerate Motoko backend with stable state
2. Updated bindings will fix all three issues

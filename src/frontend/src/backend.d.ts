import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MailConfig {
    contactTemplate: MailTemplate;
    roiTemplate: MailTemplate;
}
export interface JobPosition {
    id: string;
    title: string;
    salary: bigint;
    createdAt: Time;
    description: string;
    isActive: boolean;
    department: string;
    location: string;
}
export interface CustomMailTemplate {
    id: string;
    subject: string;
    body: string;
    name: string;
    createdAt: Time;
}
export type Time = bigint;
export interface MailTemplate {
    subject: string;
    body: string;
}
export interface ROINewLead {
    name: string;
    abandonedLeads: string;
    submittedAt: Time;
    email: string;
    staffHours: string;
    phone: string;
    calculatedGain: string;
    monthlyRevenue: string;
}
export interface ContactFormSubmission {
    name: string;
    submittedAt: Time;
    email: string;
    message: string;
    phone: string;
}
export interface JobApplication {
    yearsOfExperience: string;
    appliedAt: Time;
    applicantName: string;
    jobId: string;
    resumeFileId: string;
    email: string;
    expectedCTC: string;
    currentCTC: string;
}
export interface UserProfile {
    name: string;
}
export interface Employee {
    employeeId: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    dob: string;
    maritalStatus: string;
    address: string;
    pincode: string;
    panNumber: string;
    aadharNumber: string;
    dateOfJoining: string;
    role: string;
    position: string;
    salary: string;
}
export interface TimesheetEntry {
    id: string;
    employeeId: string;
    checkInTime: Time | null;
    checkOutTime: Time | null;
    date: string;
}
export interface Ticket {
    ticketNumber: string;
    raisedBy: string;
    category: string;
    description: string;
    status: string;
    createdAt: Time;
    resolvedAt: Time | null;
    notes: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCustomMailTemplate(input: CustomMailTemplate): Promise<CustomMailTemplate>;
    createJobPosition(input: JobPosition): Promise<JobPosition>;
    deleteCustomMailTemplate(id: bigint): Promise<void>;
    deleteJobPosition(id: bigint): Promise<void>;
    getAllActiveJobPositions(): Promise<Array<JobPosition>>;
    getAllContactSubmissions(): Promise<Array<ContactFormSubmission>>;
    getAllCustomMailTemplates(): Promise<Array<CustomMailTemplate>>;
    getAllJobApplications(): Promise<Array<JobApplication>>;
    getAllJobPositions(): Promise<Array<JobPosition>>;
    getAllROINewLeads(): Promise<Array<ROINewLead>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getJobPosition(id: bigint): Promise<JobPosition | null>;
    getMailConfig(): Promise<MailConfig | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setMailConfig(config: MailConfig): Promise<void>;
    submitContactForm(submission: ContactFormSubmission): Promise<void>;
    submitJobApplication(application: JobApplication): Promise<void>;
    submitROILead(roi: ROINewLead): Promise<void>;
    updateCustomMailTemplate(id: bigint, template: CustomMailTemplate): Promise<void>;
    updateJobPosition(id: bigint, position: JobPosition): Promise<void>;
    // Employee
    createEmployee(input: Employee): Promise<Employee>;
    getAllEmployees(): Promise<Array<Employee>>;
    getEmployee(id: string): Promise<Employee | null>;
    updateEmployee(id: string, data: Employee): Promise<boolean>;
    deleteEmployee(id: string): Promise<boolean>;
    employeeLogin(employeeId: string, password: string): Promise<Employee | null>;
    changeEmployeePassword(employeeId: string, oldPassword: string, newPassword: string): Promise<boolean>;
    // Timesheet
    checkIn(employeeId: string, date: string): Promise<TimesheetEntry>;
    checkOut(employeeId: string, date: string): Promise<TimesheetEntry | null>;
    getTodayTimesheetEntry(employeeId: string, date: string): Promise<TimesheetEntry | null>;
    getTimesheetByEmployee(employeeId: string): Promise<Array<TimesheetEntry>>;
    getAllTimesheets(): Promise<Array<TimesheetEntry>>;
    // Tickets
    createTicket(employeeId: string, category: string, description: string): Promise<Ticket>;
    getAllTickets(): Promise<Array<Ticket>>;
    getTicketsByEmployee(employeeId: string): Promise<Array<Ticket>>;
    updateTicketStatus(ticketNumber: string, status: string, notes: string): Promise<boolean>;
}

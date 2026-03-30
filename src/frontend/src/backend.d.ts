import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CustomMailTemplate {
    id: string;
    subject: string;
    body: string;
    name: string;
    createdAt: Time;
}
export type Time = bigint;
export interface TimesheetEntry {
    id: string;
    date: string;
    checkInTime?: Time;
    employeeId: string;
    checkOutTime?: Time;
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
export interface MailConfig {
    contactTemplate: MailTemplate;
    roiTemplate: MailTemplate;
}
export interface ContactFormSubmission {
    name: string;
    submittedAt: Time;
    email: string;
    message: string;
    phone: string;
}
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
export interface Employee {
    dob: string;
    salary: string;
    role: string;
    dateOfJoining: string;
    employeeId: string;
    aadharNumber: string;
    address: string;
    panNumber: string;
    passwordHash: string;
    pincode: string;
    position: string;
    lastName: string;
    maritalStatus: string;
    firstName: string;
    email: string;
    mobile: string;
    city: string;
    state: string;
}
export interface Ticket {
    status: string;
    createdAt: Time;
    description: string;
    ticketNumber: string;
    notes: string;
    category: string;
    raisedBy: string;
    resolvedAt?: Time;
}
export interface Announcement {
    id: string;
    title: string;
    content: string;
    mediaFileId: string;
    mediaType: string;
    createdAt: Time;
}
export interface UserProfile {
    name: string;
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
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    changeEmployeePassword(employeeId: string, oldPassword: string, newPassword: string): Promise<boolean>;
    checkIn(employeeId: string, date: string): Promise<TimesheetEntry>;
    checkOut(employeeId: string, date: string): Promise<TimesheetEntry | null>;
    createAnnouncement(title: string, content: string, mediaFileId: string, mediaType: string): Promise<Announcement>;
    createCustomMailTemplate(input: CustomMailTemplate): Promise<CustomMailTemplate>;
    createEmployee(input: Employee): Promise<Employee>;
    createJobPosition(input: JobPosition): Promise<JobPosition>;
    createTicket(employeeId: string, category: string, description: string): Promise<Ticket>;
    deleteAnnouncement(id: string): Promise<boolean>;
    deleteCustomMailTemplate(id: bigint): Promise<void>;
    deleteEmployee(id: string): Promise<boolean>;
    deleteJobPosition(id: bigint): Promise<void>;
    employeeLogin(employeeId: string, password: string): Promise<Employee | null>;
    getAdminPasswordHash(): Promise<string>;
    getAllActiveJobPositions(): Promise<Array<JobPosition>>;
    getAllAnnouncements(): Promise<Array<Announcement>>;
    getAllContactSubmissions(): Promise<Array<ContactFormSubmission>>;
    getAllCustomMailTemplates(): Promise<Array<CustomMailTemplate>>;
    getAllEmployees(): Promise<Array<Employee>>;
    getAllJobApplications(): Promise<Array<JobApplication>>;
    getAllJobPositions(): Promise<Array<JobPosition>>;
    getAllROINewLeads(): Promise<Array<ROINewLead>>;
    getAllTickets(): Promise<Array<Ticket>>;
    getAllTimesheets(): Promise<Array<TimesheetEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEmployee(id: string): Promise<Employee | null>;
    getJobPosition(id: bigint): Promise<JobPosition | null>;
    getMailConfig(): Promise<MailConfig | null>;
    getTicketsByEmployee(employeeId: string): Promise<Array<Ticket>>;
    getTimesheetByEmployee(employeeId: string): Promise<Array<TimesheetEntry>>;
    getTodayTimesheetEntry(employeeId: string, date: string): Promise<TimesheetEntry | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setAdminPasswordHash(newHash: string): Promise<void>;
    setMailConfig(config: MailConfig): Promise<void>;
    submitContactForm(submission: ContactFormSubmission): Promise<void>;
    submitJobApplication(application: JobApplication): Promise<void>;
    submitROILead(roi: ROINewLead): Promise<void>;
    updateCustomMailTemplate(id: bigint, template: CustomMailTemplate): Promise<void>;
    updateEmployee(id: string, data: Employee): Promise<boolean>;
    updateJobPosition(id: bigint, position: JobPosition): Promise<void>;
    updateTicketStatus(ticketNumber: string, status: string, notes: string): Promise<boolean>;
    verifyAdminPassword(password: string): Promise<boolean>;
}

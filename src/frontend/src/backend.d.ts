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
}

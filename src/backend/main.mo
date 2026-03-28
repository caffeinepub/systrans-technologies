import Array "mo:core/Array";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  module JobPosition {
    public func compare(jp1 : JobPosition, jp2 : JobPosition) : Order.Order {
      Text.compare(jp1.id, jp2.id);
    };
  };

  module ContactFormSubmission {
    public func compare(cfs1 : ContactFormSubmission, cfs2 : ContactFormSubmission) : Order.Order {
      Text.compare(cfs1.email, cfs2.email);
    };
  };

  module ROINewLead {
    public func compare(rl1 : ROINewLead, rl2 : ROINewLead) : Order.Order {
      Text.compare(rl1.email, rl2.email);
    };
  };

  module JobApplication {
    public func compare(ja1 : JobApplication, ja2 : JobApplication) : Order.Order {
      Text.compare(ja1.applicantName, ja2.applicantName);
    };
  };

  // Authorization (kept for MixinAuthorization compatibility)
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Storage
  include MixinStorage();

  // Types
  public type JobPosition = {
    id : Text;
    title : Text;
    department : Text;
    location : Text;
    salary : Nat;
    description : Text;
    isActive : Bool;
    createdAt : Time.Time;
  };

  public type ContactFormSubmission = {
    name : Text;
    email : Text;
    phone : Text;
    message : Text;
    submittedAt : Time.Time;
  };

  public type ROINewLead = {
    name : Text;
    email : Text;
    phone : Text;
    monthlyRevenue : Text;
    staffHours : Text;
    abandonedLeads : Text;
    calculatedGain : Text;
    submittedAt : Time.Time;
  };

  public type JobApplication = {
    jobId : Text;
    applicantName : Text;
    yearsOfExperience : Text;
    email : Text;
    currentCTC : Text;
    expectedCTC : Text;
    resumeFileId : Text;
    appliedAt : Time.Time;
  };

  public type MailTemplate = {
    subject : Text;
    body : Text;
  };

  public type MailConfig = {
    contactTemplate : MailTemplate;
    roiTemplate : MailTemplate;
  };

  public type CustomMailTemplate = {
    id : Text;
    name : Text;
    subject : Text;
    body : Text;
    createdAt : Time.Time;
  };

  public type UserProfile = {
    name : Text;
  };

  // Persistent state
  var nextJobId = 0;
  var nextTemplateId = 0;
  let jobPositions = Map.empty<Nat, JobPosition>();
  let contactFormSubmissions = List.empty<ContactFormSubmission>();
  let roiLeads = List.empty<ROINewLead>();
  let jobApplications = List.empty<JobApplication>();
  var mailConfig : ?MailConfig = null;
  let customMailTemplates = Map.empty<Nat, CustomMailTemplate>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management (kept for MixinAuthorization compatibility)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // Job Positions (no auth checks - frontend handles auth)
  public shared func createJobPosition(input : JobPosition) : async JobPosition {
    let newJob : JobPosition = {
      input with
      id = nextJobId.toText();
      createdAt = Time.now();
    };
    jobPositions.add(nextJobId, newJob);
    nextJobId += 1;
    newJob;
  };

  public query func getAllActiveJobPositions() : async [JobPosition] {
    jobPositions.values().toArray().filter(func(job) { job.isActive }).sort();
  };

  public query func getAllJobPositions() : async [JobPosition] {
    jobPositions.values().toArray().sort();
  };

  public shared func updateJobPosition(id : Nat, position : JobPosition) : async () {
    jobPositions.add(id, position);
  };

  public query func getJobPosition(id : Nat) : async ?JobPosition {
    jobPositions.get(id);
  };

  public shared func deleteJobPosition(id : Nat) : async () {
    jobPositions.remove(id);
  };

  // Contact Form
  public shared func submitContactForm(submission : ContactFormSubmission) : async () {
    contactFormSubmissions.add(submission);
  };

  public query func getAllContactSubmissions() : async [ContactFormSubmission] {
    contactFormSubmissions.toArray().sort();
  };

  // ROI Form
  public shared func submitROILead(roi : ROINewLead) : async () {
    roiLeads.add(roi);
  };

  public query func getAllROINewLeads() : async [ROINewLead] {
    roiLeads.toArray().sort();
  };

  // Job Applications
  public shared func submitJobApplication(application : JobApplication) : async () {
    jobApplications.add(application);
  };

  public query func getAllJobApplications() : async [JobApplication] {
    jobApplications.toArray().sort();
  };

  // Mail Configuration
  public shared func setMailConfig(config : MailConfig) : async () {
    mailConfig := ?config;
  };

  public query func getMailConfig() : async ?MailConfig {
    mailConfig;
  };

  // Custom Mail Templates
  public shared func createCustomMailTemplate(input : CustomMailTemplate) : async CustomMailTemplate {
    let newTemplate : CustomMailTemplate = {
      input with
      id = nextTemplateId.toText();
      createdAt = Time.now();
    };
    customMailTemplates.add(nextTemplateId, newTemplate);
    nextTemplateId += 1;
    newTemplate;
  };

  public shared func updateCustomMailTemplate(id : Nat, template : CustomMailTemplate) : async () {
    customMailTemplates.add(id, { template with id = id.toText() });
  };

  public shared func deleteCustomMailTemplate(id : Nat) : async () {
    customMailTemplates.remove(id);
  };

  public query func getAllCustomMailTemplates() : async [CustomMailTemplate] {
    customMailTemplates.values().toArray();
  };
};

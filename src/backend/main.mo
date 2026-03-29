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

  // Authorization
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

  public type Employee = {
    employeeId : Text;
    passwordHash : Text;
    firstName : Text;
    lastName : Text;
    dob : Text;
    maritalStatus : Text;
    address : Text;
    pincode : Text;
    panNumber : Text;
    aadharNumber : Text;
    dateOfJoining : Text;
    role : Text;
    position : Text;
    salary : Text;
  };

  public type TimesheetEntry = {
    id : Text;
    employeeId : Text;
    checkInTime : ?Time.Time;
    checkOutTime : ?Time.Time;
    date : Text;
  };

  public type Ticket = {
    ticketNumber : Text;
    raisedBy : Text;
    category : Text;
    description : Text;
    status : Text;
    createdAt : Time.Time;
    resolvedAt : ?Time.Time;
    notes : Text;
  };

  // Persistent state (stable so data survives upgrades)
  var nextJobId = 0;
  var nextTemplateId = 0;
  var nextEmployeeId = 0;
  var nextTimesheetId = 0;
  var nextTicketId = 0;
  let jobPositions = Map.empty<Nat, JobPosition>();
  var contactFormSubmissions = List.empty<ContactFormSubmission>();
  var roiLeads = List.empty<ROINewLead>();
  var jobApplications = List.empty<JobApplication>();
  var mailConfig : ?MailConfig = null;
  let customMailTemplates = Map.empty<Nat, CustomMailTemplate>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let employees = Map.empty<Text, Employee>();
  let timesheetEntries = Map.empty<Text, TimesheetEntry>();
  let tickets = Map.empty<Text, Ticket>();
  var adminPasswordHash : Text = "Kumaresh@436314";

  func formatEmployeeId(n : Nat) : Text {
    let s = n.toText();
    if (s.size() == 1) { "SYS00" # s }
    else if (s.size() == 2) { "SYS0" # s }
    else { "SYS" # s };
  };

  func formatTicketNumber(n : Nat) : Text {
    let s = n.toText();
    if (s.size() == 1) { "TKT00" # s }
    else if (s.size() == 2) { "TKT0" # s }
    else { "TKT" # s };
  };

  func formatTimesheetId(n : Nat) : Text {
    "TS" # n.toText();
  };

  // User Profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller = _ }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // Job Positions
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
    contactFormSubmissions.toArray();
  };

  // ROI Form
  public shared func submitROILead(roi : ROINewLead) : async () {
    roiLeads.add(roi);
  };

  public query func getAllROINewLeads() : async [ROINewLead] {
    roiLeads.toArray();
  };

  // Job Applications
  public shared func submitJobApplication(application : JobApplication) : async () {
    jobApplications.add(application);
  };

  public query func getAllJobApplications() : async [JobApplication] {
    jobApplications.toArray();
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

  // Employee Management
  public shared func createEmployee(input : Employee) : async Employee {
    nextEmployeeId += 1;
    let empId = formatEmployeeId(nextEmployeeId);
    let newEmployee : Employee = {
      input with
      employeeId = empId;
      passwordHash = "SysTrans";
    };
    employees.add(empId, newEmployee);
    newEmployee;
  };

  public query func getAllEmployees() : async [Employee] {
    employees.values().toArray();
  };

  public query func getEmployee(id : Text) : async ?Employee {
    employees.get(id);
  };

  public shared func updateEmployee(id : Text, data : Employee) : async Bool {
    switch (employees.get(id)) {
      case null { false };
      case (?_existing) {
        employees.add(id, { data with employeeId = id });
        true;
      };
    };
  };

  public shared func deleteEmployee(id : Text) : async Bool {
    switch (employees.get(id)) {
      case null { false };
      case (?_) {
        employees.remove(id);
        true;
      };
    };
  };

  public query func employeeLogin(employeeId : Text, password : Text) : async ?Employee {
    switch (employees.get(employeeId)) {
      case null { null };
      case (?emp) {
        if (emp.passwordHash == password) { ?emp } else { null };
      };
    };
  };

  public shared func changeEmployeePassword(employeeId : Text, oldPassword : Text, newPassword : Text) : async Bool {
    switch (employees.get(employeeId)) {
      case null { false };
      case (?emp) {
        if (emp.passwordHash == oldPassword) {
          employees.add(employeeId, { emp with passwordHash = newPassword });
          true;
        } else { false };
      };
    };
  };

  // Timesheet
  public shared func checkIn(employeeId : Text, date : Text) : async TimesheetEntry {
    let id = formatTimesheetId(nextTimesheetId);
    nextTimesheetId += 1;
    let entry : TimesheetEntry = {
      id;
      employeeId;
      checkInTime = ?Time.now();
      checkOutTime = null;
      date;
    };
    timesheetEntries.add(id, entry);
    entry;
  };

  public shared func checkOut(employeeId : Text, date : Text) : async ?TimesheetEntry {
    let openEntry = timesheetEntries.values().toArray().filter(
      func(e : TimesheetEntry) : Bool {
        e.employeeId == employeeId and e.date == date and e.checkOutTime == null
      }
    );
    if (openEntry.size() == 0) {
      null;
    } else {
      let entry = openEntry[0];
      let updated : TimesheetEntry = { entry with checkOutTime = ?Time.now() };
      timesheetEntries.add(entry.id, updated);
      ?updated;
    };
  };

  public query func getTodayTimesheetEntry(employeeId : Text, date : Text) : async ?TimesheetEntry {
    let entries = timesheetEntries.values().toArray().filter(
      func(e : TimesheetEntry) : Bool {
        e.employeeId == employeeId and e.date == date
      }
    );
    if (entries.size() == 0) { null } else { ?entries[0] };
  };

  public query func getTimesheetByEmployee(employeeId : Text) : async [TimesheetEntry] {
    timesheetEntries.values().toArray().filter(
      func(e : TimesheetEntry) : Bool { e.employeeId == employeeId }
    );
  };

  public query func getAllTimesheets() : async [TimesheetEntry] {
    timesheetEntries.values().toArray();
  };

  // Tickets
  public shared func createTicket(employeeId : Text, category : Text, description : Text) : async Ticket {
    nextTicketId += 1;
    let ticketNumber = formatTicketNumber(nextTicketId);
    let ticket : Ticket = {
      ticketNumber;
      raisedBy = employeeId;
      category;
      description;
      status = "open";
      createdAt = Time.now();
      resolvedAt = null;
      notes = "";
    };
    tickets.add(ticketNumber, ticket);
    ticket;
  };

  public query func getAllTickets() : async [Ticket] {
    tickets.values().toArray();
  };

  public query func getTicketsByEmployee(employeeId : Text) : async [Ticket] {
    tickets.values().toArray().filter(
      func(t : Ticket) : Bool { t.raisedBy == employeeId }
    );
  };

  public shared func updateTicketStatus(ticketNumber : Text, status : Text, notes : Text) : async Bool {
    switch (tickets.get(ticketNumber)) {
      case null { false };
      case (?ticket) {
        let resolvedAt = if (status == "resolved") { ?Time.now() } else { ticket.resolvedAt };
        tickets.add(ticketNumber, { ticket with status; notes; resolvedAt });
        true;
      };
    };
  };

  // Admin Password
  public query func getAdminPasswordHash() : async Text {
    adminPasswordHash;
  };

  public shared func setAdminPasswordHash(newHash : Text) : async () {
    adminPasswordHash := newHash;
  };

  public query func verifyAdminPassword(password : Text) : async Bool {
    password == adminPasswordHash;
  };
};

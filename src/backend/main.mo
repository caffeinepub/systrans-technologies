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

persistent actor {
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
    email : Text;
    mobile : Text;
    city : Text;
    state : Text;
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

  public type Announcement = {
    id : Text;
    title : Text;
    content : Text;
    mediaFileId : Text;
    mediaType : Text;
    createdAt : Time.Time;
  };

  public type LeaveRequest = {
    id : Text;
    employeeId : Text;
    reason : Text;
    startDate : Text;
    endDate : Text;
    numberOfDays : Nat;
    status : Text;
    requestedAt : Time.Time;
    approvedAt : ?Time.Time;
  };

  public type LeaveBalance = {
    employeeId : Text;
    balance : Nat;
    lastCreditedMonth : Text;
  };

  // Internal base type for stable upgrade compat
  type EmployeeBase = {
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

  type EmployeeExtra = {
    email : Text;
    mobile : Text;
    city : Text;
    state : Text;
    profilePhotoFileId : Text;
  };

  // ── Stable state ──────────────────────────────────────────────────────────
  var nextJobId = 0;
  var nextTemplateId = 0;
  var nextEmployeeId = 0;
  var nextTimesheetId = 0;
  var nextTicketId = 0;
  var nextAnnouncementId = 0;
  var nextLeaveId = 0;
  let jobPositions = Map.empty<Nat, JobPosition>();
  var contactFormSubmissions = List.empty<ContactFormSubmission>();
  var roiLeads = List.empty<ROINewLead>();
  var jobApplications = List.empty<JobApplication>();
  var mailConfig : ?MailConfig = null;
  let customMailTemplates = Map.empty<Nat, CustomMailTemplate>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let employees = Map.empty<Text, EmployeeBase>();
  let employeeExtras = Map.empty<Text, EmployeeExtra>();
  let timesheetEntries = Map.empty<Text, TimesheetEntry>();
  let tickets = Map.empty<Text, Ticket>();
  let announcements = Map.empty<Text, Announcement>();
  let leaveRequests = Map.empty<Text, LeaveRequest>();
  let leaveBalances = Map.empty<Text, LeaveBalance>();
  var adminPasswordHash : Text = "Kumaresh@436314";

  // ── Helpers ───────────────────────────────────────────────────────────────
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

  func formatLeaveId(n : Nat) : Text {
    let s = n.toText();
    if (s.size() == 1) { "LV00" # s }
    else if (s.size() == 2) { "LV0" # s }
    else { "LV" # s };
  };

  func textPrefix(t : Text, n : Nat) : Text {
    var result = "";
    var i = 0;
    for (c in t.chars()) {
      if (i < n) {
        result #= Text.fromChar(c);
        i += 1;
      };
    };
    result;
  };

  func combineEmployee(base : EmployeeBase, extra : EmployeeExtra) : Employee {
    {
      employeeId    = base.employeeId;
      passwordHash  = base.passwordHash;
      firstName     = base.firstName;
      lastName      = base.lastName;
      dob           = base.dob;
      maritalStatus = base.maritalStatus;
      address       = base.address;
      pincode       = base.pincode;
      panNumber     = base.panNumber;
      aadharNumber  = base.aadharNumber;
      dateOfJoining = base.dateOfJoining;
      role          = base.role;
      position      = base.position;
      salary        = base.salary;
      email         = extra.email;
      mobile        = extra.mobile;
      city          = extra.city;
      state         = extra.state;
    };
  };

  func toEmployee(empId : Text) : ?Employee {
    switch (employees.get(empId)) {
      case null { null };
      case (?base) {
        let extra = switch (employeeExtras.get(empId)) {
          case null { { email = ""; mobile = ""; city = ""; state = ""; profilePhotoFileId = "" } };
          case (?e) { e };
        };
        ?combineEmployee(base, extra);
      };
    };
  };

  func getOrInitBalance(employeeId : Text, currentMonth : Text) : LeaveBalance {
    switch (leaveBalances.get(employeeId)) {
      case null {
        let bal : LeaveBalance = {
          employeeId;
          balance = 2;
          lastCreditedMonth = currentMonth;
        };
        leaveBalances.add(employeeId, bal);
        bal;
      };
      case (?existing) {
        if (existing.lastCreditedMonth != currentMonth) {
          let bal : LeaveBalance = {
            employeeId;
            balance = existing.balance + 2;
            lastCreditedMonth = currentMonth;
          };
          leaveBalances.add(employeeId, bal);
          bal;
        } else {
          existing;
        };
      };
    };
  };

  func getCurrentMonth() : Text {
    let now = Time.now();
    let seconds = now / 1_000_000_000;
    let days = seconds / 86400;
    var d = days;
    var y : Nat = 1970;
    while (true) {
      let diy : Nat = if (y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)) { 366 } else { 365 };
      if (d < diy) {
        let monthDays : [Nat] = if (diy == 366) {
          [31,29,31,30,31,30,31,31,30,31,30,31]
        } else {
          [31,28,31,30,31,30,31,31,30,31,30,31]
        };
        var m : Nat = 0;
        var dd = d;
        while (m < 12 and dd >= monthDays[m]) {
          dd -= monthDays[m];
          m += 1;
        };
        let monthNum = m + 1;
        let mm = if (monthNum < 10) { "0" # monthNum.toText() } else { monthNum.toText() };
        return y.toText() # "-" # mm;
      };
      d -= diy;
      y += 1;
    };
    "2025-01";
  };

  // ── User Profile ──────────────────────────────────────────────────────────
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller = _ }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // ── Job Positions ─────────────────────────────────────────────────────────
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

  // ── Contact Form ──────────────────────────────────────────────────────────
  public shared func submitContactForm(submission : ContactFormSubmission) : async () {
    contactFormSubmissions.add(submission);
  };

  public query func getAllContactSubmissions() : async [ContactFormSubmission] {
    contactFormSubmissions.toArray();
  };

  // ── ROI Form ──────────────────────────────────────────────────────────────
  public shared func submitROILead(roi : ROINewLead) : async () {
    roiLeads.add(roi);
  };

  public query func getAllROINewLeads() : async [ROINewLead] {
    roiLeads.toArray();
  };

  // ── Job Applications ──────────────────────────────────────────────────────
  public shared func submitJobApplication(application : JobApplication) : async () {
    jobApplications.add(application);
  };

  public query func getAllJobApplications() : async [JobApplication] {
    jobApplications.toArray();
  };

  // ── Mail Configuration ────────────────────────────────────────────────────
  public shared func setMailConfig(config : MailConfig) : async () {
    mailConfig := ?config;
  };

  public query func getMailConfig() : async ?MailConfig {
    mailConfig;
  };

  // ── Custom Mail Templates ─────────────────────────────────────────────────
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

  // ── Employee Management ───────────────────────────────────────────────────
  public shared func createEmployee(input : Employee) : async Employee {
    nextEmployeeId += 1;
    let empId = formatEmployeeId(nextEmployeeId);
    let base : EmployeeBase = {
      employeeId    = empId;
      passwordHash  = "Goodluck1";
      firstName     = input.firstName;
      lastName      = input.lastName;
      dob           = input.dob;
      maritalStatus = input.maritalStatus;
      address       = input.address;
      pincode       = input.pincode;
      panNumber     = input.panNumber;
      aadharNumber  = input.aadharNumber;
      dateOfJoining = input.dateOfJoining;
      role          = input.role;
      position      = input.position;
      salary        = input.salary;
    };
    let extra : EmployeeExtra = {
      email  = input.email;
      mobile = input.mobile;
      city   = input.city;
      state  = input.state;
      profilePhotoFileId = "";
    };
    employees.add(empId, base);
    employeeExtras.add(empId, extra);
    combineEmployee(base, extra);
  };

  public query func getAllEmployees() : async [Employee] {
    employees.values().toArray().map(func(base : EmployeeBase) : Employee {
      let extra = switch (employeeExtras.get(base.employeeId)) {
        case null { { email = ""; mobile = ""; city = ""; state = ""; profilePhotoFileId = "" } };
        case (?e) { e };
      };
      combineEmployee(base, extra);
    });
  };

  public query func getEmployee(id : Text) : async ?Employee {
    toEmployee(id);
  };

  public shared func updateEmployee(id : Text, data : Employee) : async Bool {
    switch (employees.get(id)) {
      case null { false };
      case (?_) {
        let base : EmployeeBase = {
          employeeId    = id;
          passwordHash  = data.passwordHash;
          firstName     = data.firstName;
          lastName      = data.lastName;
          dob           = data.dob;
          maritalStatus = data.maritalStatus;
          address       = data.address;
          pincode       = data.pincode;
          panNumber     = data.panNumber;
          aadharNumber  = data.aadharNumber;
          dateOfJoining = data.dateOfJoining;
          role          = data.role;
          position      = data.position;
          salary        = data.salary;
        };
        let extra : EmployeeExtra = {
          email  = data.email;
          mobile = data.mobile;
          city   = data.city;
          state  = data.state;
          profilePhotoFileId = "";
        };
        employees.add(id, base);
        employeeExtras.add(id, extra);
        true;
      };
    };
  };

  public shared func deleteEmployee(id : Text) : async Bool {
    switch (employees.get(id)) {
      case null { false };
      case (?_) {
        employees.remove(id);
        employeeExtras.remove(id);
        true;
      };
    };
  };

  public query func employeeLogin(employeeId : Text, password : Text) : async ?Employee {
    switch (employees.get(employeeId)) {
      case null { null };
      case (?base) {
        if (base.passwordHash == password) {
          toEmployee(employeeId);
        } else { null };
      };
    };
  };

  public shared func changeEmployeePassword(employeeId : Text, oldPassword : Text, newPassword : Text) : async Bool {
    switch (employees.get(employeeId)) {
      case null { false };
      case (?base) {
        if (base.passwordHash == oldPassword) {
          employees.add(employeeId, { base with passwordHash = newPassword });
          true;
        } else { false };
      };
    };
  };

  // ── Timesheet ─────────────────────────────────────────────────────────────
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

  // ── Tickets ───────────────────────────────────────────────────────────────
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

  // ── Announcements ─────────────────────────────────────────────────────────
  public shared func createAnnouncement(annTitle : Text, annContent : Text, annMediaFileId : Text, annMediaType : Text) : async Announcement {
    nextAnnouncementId += 1;
    let annId = nextAnnouncementId.toText();
    let ann : Announcement = {
      id = annId;
      title = annTitle;
      content = annContent;
      mediaFileId = annMediaFileId;
      mediaType = annMediaType;
      createdAt = Time.now();
    };
    announcements.add(annId, ann);
    ann;
  };

  public query func getAllAnnouncements() : async [Announcement] {
    announcements.values().toArray();
  };

  public shared func deleteAnnouncement(id : Text) : async Bool {
    switch (announcements.get(id)) {
      case null { false };
      case (?_) {
        announcements.remove(id);
        true;
      };
    };
  };

  // ── Leave Management ──────────────────────────────────────────────────────
  public shared func applyLeave(employeeId : Text, reason : Text, startDate : Text, endDate : Text, numberOfDays : Nat) : async LeaveRequest {
    let currentMonth = getCurrentMonth();
    let bal = getOrInitBalance(employeeId, currentMonth);

    let thisMonthLeaves = leaveRequests.values().toArray().filter(
      func(lr : LeaveRequest) : Bool {
        lr.employeeId == employeeId and
        lr.status != "lop" and lr.status != "rejected" and
        lr.startDate.size() >= 7 and
        textPrefix(lr.startDate, 7) == currentMonth
      }
    );
    let monthlyCount = thisMonthLeaves.size();

    let status : Text = if (numberOfDays > bal.balance or monthlyCount >= 2) {
      "lop"
    } else {
      "pending"
    };

    nextLeaveId += 1;
    let leaveId = formatLeaveId(nextLeaveId);
    let req : LeaveRequest = {
      id = leaveId;
      employeeId;
      reason;
      startDate;
      endDate;
      numberOfDays;
      status;
      requestedAt = Time.now();
      approvedAt = null;
    };
    leaveRequests.add(leaveId, req);
    req;
  };

  public query func getLeaveBalance(employeeId : Text) : async Nat {
    switch (leaveBalances.get(employeeId)) {
      case null { 0 };
      case (?bal) { bal.balance };
    };
  };

  public shared func initOrRefreshLeaveBalance(employeeId : Text) : async Nat {
    let currentMonth = getCurrentMonth();
    let bal = getOrInitBalance(employeeId, currentMonth);
    bal.balance;
  };

  public query func getLeavesByEmployee(employeeId : Text) : async [LeaveRequest] {
    leaveRequests.values().toArray().filter(
      func(lr : LeaveRequest) : Bool { lr.employeeId == employeeId }
    );
  };

  public query func getAllLeaveRequests() : async [LeaveRequest] {
    leaveRequests.values().toArray();
  };

  public shared func approveLeaveRequest(leaveId : Text, newStatus : Text) : async Bool {
    switch (leaveRequests.get(leaveId)) {
      case null { false };
      case (?req) {
        if (req.status == "lop") { return false };
        let approvedAt : ?Time.Time = if (newStatus == "approved") { ?Time.now() } else { null };
        if (newStatus == "approved") {
          switch (leaveBalances.get(req.employeeId)) {
            case null {};
            case (?bal) {
              let newBal : Nat = if (bal.balance > req.numberOfDays) {
                bal.balance - req.numberOfDays
              } else {
                0
              };
              leaveBalances.add(req.employeeId, { bal with balance = newBal });
            };
          };
        };
        leaveRequests.add(leaveId, { req with status = newStatus; approvedAt });
        true;
      };
    };
  };

  // ── Admin Password ────────────────────────────────────────────────────────
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

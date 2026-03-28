import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ContactFormSubmission,
  CustomMailTemplate,
  JobApplication,
  JobPosition,
  MailConfig,
  ROINewLead,
} from "../backend.d";
import { useActor } from "./useActor";

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useActiveJobPositions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["activeJobs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllActiveJobPositions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllJobPositions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allJobs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllJobPositions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllContactSubmissions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["contactSubmissions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllContactSubmissions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllROILeads() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["roiLeads"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllROINewLeads();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllJobApplications() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["jobApplications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllJobApplications();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMailConfig() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["mailConfig"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMailConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllCustomMailTemplates() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["customMailTemplates"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCustomMailTemplates();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitContactForm() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: ContactFormSubmission) => {
      if (!actor) throw new Error("Not connected");
      return actor.submitContactForm(data);
    },
  });
}

export function useSubmitROILead() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: ROINewLead) => {
      if (!actor) throw new Error("Not connected");
      return actor.submitROILead(data);
    },
  });
}

export function useSubmitJobApplication() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: JobApplication) => {
      if (!actor) throw new Error("Not connected");
      return actor.submitJobApplication(data);
    },
  });
}

export function useCreateJobPosition() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: JobPosition) => {
      if (!actor) throw new Error("Not connected");
      return actor.createJobPosition(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activeJobs"] });
      qc.invalidateQueries({ queryKey: ["allJobs"] });
    },
  });
}

export function useUpdateJobPosition() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      position,
    }: { id: bigint; position: JobPosition }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateJobPosition(id, position);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activeJobs"] });
      qc.invalidateQueries({ queryKey: ["allJobs"] });
    },
  });
}

export function useDeleteJobPosition() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteJobPosition(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activeJobs"] });
      qc.invalidateQueries({ queryKey: ["allJobs"] });
    },
  });
}

export function useSetMailConfig() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: MailConfig) => {
      if (!actor) throw new Error("Not connected");
      return actor.setMailConfig(config);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mailConfig"] }),
  });
}

export function useCreateCustomMailTemplate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CustomMailTemplate) => {
      if (!actor) throw new Error("Not connected");
      return actor.createCustomMailTemplate(data);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["customMailTemplates"] }),
  });
}

export function useUpdateCustomMailTemplate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      template,
    }: { id: bigint; template: CustomMailTemplate }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateCustomMailTemplate(id, template);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["customMailTemplates"] }),
  });
}

export function useDeleteCustomMailTemplate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteCustomMailTemplate(id);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["customMailTemplates"] }),
  });
}

export type {
  JobPosition,
  ContactFormSubmission,
  ROINewLead,
  JobApplication,
  MailConfig,
  CustomMailTemplate,
};

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Project,
  Step,
  InsightsData,
  PRDData,
  PrioritiesData,
  InterviewData,
  ChatMessage,
} from "@/lib/types";
import { STEP_ORDER, createEmptyProject } from "@/lib/types";

interface ProjectStore {
  projects: Project[];
  currentProjectId: string | null;

  getCurrentProject: () => Project | null;
  createProject: (name: string, inputType: "idea" | "reviews") => string;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (id: string) => void;

  updateInsights: (data: Partial<InsightsData>) => void;
  updatePRD: (data: Partial<PRDData>) => void;
  updatePriorities: (data: Partial<PrioritiesData>) => void;
  updateInterview: (data: Partial<InterviewData>) => void;
  addInterviewMessage: (message: ChatMessage) => void;

  goToStep: (step: Step) => void;
  canAccessStep: (step: Step) => boolean;
  getCompletedSteps: () => Step[];
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,

      getCurrentProject: () => {
        const { projects, currentProjectId } = get();
        return projects.find((p) => p.id === currentProjectId) ?? null;
      },

      createProject: (name, inputType) => {
        const project = createEmptyProject(name, inputType);
        set((state) => ({
          projects: [project, ...state.projects],
          currentProjectId: project.id,
        }));
        return project.id;
      },

      renameProject: (id, name) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, name } : p,
          ),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProjectId:
            state.currentProjectId === id ? null : state.currentProjectId,
        }));
      },

      setCurrentProject: (id) => {
        set({ currentProjectId: id });
      },

      updateInsights: (data) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === state.currentProjectId
              ? { ...p, insights: { ...p.insights, ...data } }
              : p,
          ),
        }));
      },

      updatePRD: (data) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === state.currentProjectId
              ? { ...p, prd: { ...p.prd, ...data } }
              : p,
          ),
        }));
      },

      updatePriorities: (data) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === state.currentProjectId
              ? { ...p, priorities: { ...p.priorities, ...data } }
              : p,
          ),
        }));
      },

      updateInterview: (data) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === state.currentProjectId
              ? { ...p, interview: { ...p.interview, ...data } }
              : p,
          ),
        }));
      },

      addInterviewMessage: (message) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === state.currentProjectId
              ? {
                  ...p,
                  interview: {
                    ...p.interview,
                    messages: [...p.interview.messages, message],
                  },
                }
              : p,
          ),
        }));
      },

      goToStep: (step) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === state.currentProjectId ? { ...p, currentStep: step } : p,
          ),
        }));
      },

      canAccessStep: (step) => {
        const project = get().getCurrentProject();
        if (!project) return false;
        const stepIndex = STEP_ORDER.indexOf(step);
        if (stepIndex === 0) return true;

        const prevStep = STEP_ORDER[stepIndex - 1];
        switch (prevStep) {
          case "insights":
            return project.insights.painPoints.length > 0;
          case "prd":
            return project.prd.features.length > 0;
          case "priorities":
            return project.priorities.rankings.length > 0;
          default:
            return true;
        }
      },

      getCompletedSteps: () => {
        const project = get().getCurrentProject();
        if (!project) return [];
        const completed: Step[] = [];
        if (project.insights.painPoints.length > 0) completed.push("insights");
        if (project.prd.features.length > 0) completed.push("prd");
        if (project.priorities.rankings.length > 0)
          completed.push("priorities");
        if (project.interview.messages.length > 0) completed.push("interview");
        return completed;
      },
    }),
    {
      name: "prodmind-projects",
    },
  ),
);

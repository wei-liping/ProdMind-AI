"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { STEPS, STEP_ORDER, type Step } from "@/lib/types";
import { useProjectStore } from "@/store/project-store";
import {
  Search,
  FileText,
  BarChart3,
  MessageCircle,
  Check,
  Lock,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search,
  FileText,
  BarChart3,
  MessageCircle,
};

export function Stepper() {
  const router = useRouter();
  const projects = useProjectStore((s) => s.projects);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const goToStep = useProjectStore((s) => s.goToStep);

  const project = useMemo(
    () => projects.find((p) => p.id === currentProjectId) ?? null,
    [projects, currentProjectId],
  );

  const completedSteps = useMemo(() => {
    if (!project) return [] as Step[];
    const completed: Step[] = [];
    if (project.insights.painPoints.length > 0) completed.push("insights");
    if (project.prd.features.length > 0) completed.push("prd");
    if (project.priorities.rankings.length > 0) completed.push("priorities");
    if (project.interview.messages.length > 0) completed.push("interview");
    return completed;
  }, [project]);

  const canAccessStep = useCallback(
    (step: Step) => {
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
    [project],
  );

  if (!project) return null;

  return (
    <nav className="w-full">
      <ol className="flex items-center gap-0">
        {STEPS.map((step, index) => {
          const Icon = iconMap[step.icon];
          const isCurrent = project.currentStep === step.key;
          const isCompleted = completedSteps.includes(step.key);
          const isAccessible = canAccessStep(step.key);
          const isLast = index === STEPS.length - 1;

          return (
            <li
              key={step.key}
              className={cn("flex items-center", !isLast && "flex-1")}
            >
              <button
                onClick={() => {
                  if (!isAccessible) return;
                  goToStep(step.key);
                  router.push(`/project/${step.key}`);
                }}
                disabled={!isAccessible}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  isCurrent && "bg-primary text-primary-foreground shadow-sm",
                  isCompleted &&
                    !isCurrent &&
                    "text-primary hover:bg-primary/10",
                  !isCurrent &&
                    !isCompleted &&
                    isAccessible &&
                    "text-muted-foreground hover:bg-muted",
                  !isAccessible &&
                    "text-muted-foreground/40 cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs shrink-0",
                    isCurrent && "bg-primary-foreground/20",
                    isCompleted && !isCurrent && "bg-primary/10",
                    !isCurrent && !isCompleted && "bg-muted",
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : !isAccessible && !isCurrent ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                </span>
                <span className="hidden sm:inline whitespace-nowrap">
                  {step.label}
                </span>
              </button>

              {!isLast && (
                <div
                  className={cn(
                    "mx-1 h-px flex-1 min-w-4",
                    isCompleted ? "bg-primary/40" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

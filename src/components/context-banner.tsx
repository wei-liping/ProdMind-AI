"use client";

import { useMemo } from "react";
import { useProjectStore } from "@/store/project-store";
import type { Project } from "@/lib/types";
import { Sparkles } from "lucide-react";

function getBannerMessage(project: Project): string | null {
  const step = project.currentStep;
  switch (step) {
    case "insights":
      return null;
    case "prd": {
      const n = project.insights.painPoints.length;
      const needs = project.insights.highFreqNeeds.length;
      if (n === 0) return null;
      return `基于上一步发现的 ${n} 个核心痛点和 ${needs} 个高频需求，为你生成产品需求文档...`;
    }
    case "priorities": {
      const n = project.prd.features.length;
      const mvp = project.prd.mvpScope.length;
      if (n === 0) return null;
      return `共 ${n} 个功能特性，其中 ${mvp} 个被标记为 MVP 范围，现在进行优先级排序...`;
    }
    case "interview": {
      const n = project.prd.userPersonas.length;
      if (n === 0) return null;
      return `基于生成的 ${n} 个用户画像，选择一个角色进行模拟访谈验证...`;
    }
    default:
      return null;
  }
}

export function ContextBanner() {
  const projects = useProjectStore((s) => s.projects);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);

  const project = useMemo(
    () => projects.find((p) => p.id === currentProjectId) ?? null,
    [projects, currentProjectId],
  );

  const message = useMemo(
    () => (project ? getBannerMessage(project) : null),
    [project],
  );

  if (!message) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-primary">
      <Sparkles className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

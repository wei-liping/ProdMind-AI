"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjectStore } from "@/store/project-store";
import { Stepper } from "@/components/stepper";
import { ContextBanner } from "@/components/context-banner";
import { Brain, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { SettingsDialog } from "@/components/settings-dialog";
import { ExportDialog } from "@/components/export-dialog";
import type { Step } from "@/lib/types";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const renameProject = useProjectStore((s) => s.renameProject);
  const projects = useProjectStore((s) => s.projects);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);

  const project = useMemo(
    () => projects.find((p) => p.id === currentProjectId) ?? null,
    [projects, currentProjectId],
  );

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params.id && typeof params.id === "string") {
      setCurrentProject(params.id);
    }
  }, [params.id, setCurrentProject]);

  if (!project) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">项目未找到</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          返回首页
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Brain className="h-3.5 w-3.5" />
            </div>
          </Link>
          <div className="h-5 w-px bg-border shrink-0" />
          {editing ? (
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => {
                if (editName.trim() && project)
                  renameProject(project.id, editName.trim());
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setEditing(false);
              }}
              className="h-7 w-32 sm:w-48 text-sm font-medium"
            />
          ) : (
            <button
              onClick={() => {
                setEditName(project?.name ?? "");
                setEditing(true);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              className="group flex items-center gap-1 text-sm font-medium truncate max-w-[120px] sm:max-w-[200px] hover:text-primary transition-colors shrink-0"
              title="点击重命名"
            >
              <span className="truncate">{project.name}</span>
              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0" />
            </button>
          )}
          <div className="h-5 w-px bg-border shrink-0" />
          <div className="flex-1 overflow-x-auto">
            <Stepper />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <ExportDialog currentStep={project.currentStep as Step} />
            <SettingsDialog />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <ContextBanner />
          <div className="mt-4">{children}</div>
        </div>
      </main>
    </div>
  );
}

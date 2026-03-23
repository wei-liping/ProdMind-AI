"use client";

import { useState, useMemo } from "react";
import { useProjectStore } from "@/store/project-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, File, Check, Loader2 } from "lucide-react";
import { STEPS, type Step } from "@/lib/types";
import { exportMarkdown, exportPDF } from "@/lib/export";

export function ExportDialog({ currentStep }: { currentStep?: Step }) {
  const projects = useProjectStore((s) => s.projects);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const project = useMemo(
    () => projects.find((p) => p.id === currentProjectId) ?? null,
    [projects, currentProjectId],
  );

  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<"md" | "pdf">("md");
  const [selectedSteps, setSelectedSteps] = useState<Step[]>(
    currentStep
      ? [currentStep]
      : ["insights", "prd", "priorities", "interview"],
  );
  const [exporting, setExporting] = useState(false);

  function toggleStep(step: Step) {
    setSelectedSteps((prev) =>
      prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step],
    );
  }

  function selectAll() {
    setSelectedSteps(["insights", "prd", "priorities", "interview"]);
  }

  function hasData(step: Step): boolean {
    if (!project) return false;
    switch (step) {
      case "insights":
        return project.insights.painPoints.length > 0;
      case "prd":
        return (
          project.prd.features.length > 0 || project.prd.fullDocument.length > 0
        );
      case "priorities":
        return project.priorities.rankings.length > 0;
      case "interview":
        return project.interview.messages.length > 0;
    }
  }

  async function handleExport() {
    if (!project || selectedSteps.length === 0) return;
    setExporting(true);
    try {
      if (format === "md") {
        exportMarkdown(project, selectedSteps);
      } else {
        await exportPDF(project, selectedSteps);
      }
      setOpen(false);
    } finally {
      setExporting(false);
    }
  }

  if (!project) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v && currentStep) setSelectedSteps([currentStep]);
      }}
    >
      <DialogTrigger
        render={<Button variant="ghost" size="sm" className="gap-1.5 h-8" />}
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">导出</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>导出项目</DialogTitle>
          <DialogDescription>选择导出格式和要包含的流程步骤</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">导出格式</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormat("md")}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                  format === "md"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <FileText className="h-4 w-4" />
                Markdown
              </button>
              <button
                onClick={() => setFormat("pdf")}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                  format === "pdf"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <File className="h-4 w-4" />
                PDF
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">包含步骤</p>
              <button
                onClick={selectAll}
                className="text-xs text-primary hover:underline"
              >
                全选
              </button>
            </div>
            <div className="space-y-1">
              {STEPS.map((step) => {
                const active = selectedSteps.includes(step.key);
                const empty = !hasData(step.key);
                return (
                  <button
                    key={step.key}
                    onClick={() => toggleStep(step.key)}
                    disabled={empty}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors text-left ${
                      empty
                        ? "opacity-40 cursor-not-allowed border-border"
                        : active
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        active && !empty
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {active && !empty && <Check className="h-3 w-3" />}
                    </div>
                    <span className="flex-1">{step.label}</span>
                    {empty && (
                      <span className="text-xs text-muted-foreground">
                        无数据
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleExport}
            disabled={selectedSteps.length === 0 || exporting}
            className="w-full gap-2"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                导出 {format === "md" ? "Markdown" : "PDF"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/project-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  MessagesSquare,
  Trash2,
  ArrowRight,
  Brain,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { SettingsDialog } from "@/components/settings-dialog";
import { useSettingsStore } from "@/store/settings-store";

export default function HomePage() {
  const router = useRouter();
  const projects = useProjectStore((s) => s.projects);
  const createProject = useProjectStore((s) => s.createProject);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const renameProject = useProjectStore((s) => s.renameProject);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);
  const isConfigured = useSettingsStore(
    (s) => !!s.api.apiKey && !!s.api.baseUrl && !!s.api.modelId,
  );
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  function handleCreate(type: "idea" | "reviews") {
    const name = type === "idea" ? "新想法项目" : "用户反馈分析";
    createProject(name, type);
    router.push("/project/insights");
  }

  function handleResume(id: string) {
    setCurrentProject(id);
    const project = projects.find((p) => p.id === id);
    if (project) {
      router.push(`/project/${project.currentStep}`);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              ProdMind AI
            </span>
          </div>
          <div className="ml-auto">
            <SettingsDialog />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 pt-20 pb-16">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              像产品经理一样思考的 AI
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              从用户洞察到 PRD 生成，再到优先级决策 —— 一个完整的产品经理工作流
            </p>
          </div>

          {!isConfigured && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                请先点击右上角 <strong>设置按钮</strong> 配置 API Key
                和模型信息，才能使用 AI 功能。
              </span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 mb-16">
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                hoveredCard === "idea" ? "border-primary/50 shadow-md" : ""
              }`}
              onMouseEnter={() => setHoveredCard("idea")}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleCreate("idea")}
            >
              <CardHeader className="pb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 mb-2">
                  <Lightbulb className="h-5.5 w-5.5" />
                </div>
                <CardTitle className="text-lg">我有一个想法</CardTitle>
                <CardDescription>
                  输入你的产品想法，AI 帮你拆解成用户痛点、需求和完整 PRD
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 -ml-2 text-muted-foreground"
                >
                  开始探索 <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                hoveredCard === "reviews" ? "border-primary/50 shadow-md" : ""
              }`}
              onMouseEnter={() => setHoveredCard("reviews")}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleCreate("reviews")}
            >
              <CardHeader className="pb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 mb-2">
                  <MessagesSquare className="h-5.5 w-5.5" />
                </div>
                <CardTitle className="text-lg">我有一堆用户评论</CardTitle>
                <CardDescription>
                  粘贴用户反馈或评论，AI 自动聚类分析提取痛点和高频需求
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 -ml-2 text-muted-foreground"
                >
                  开始分析 <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {projects.length > 0 && (
            <div>
              <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                历史项目
              </h2>
              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="group flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleResume(project.id)}
                  >
                    <div className="flex-1 min-w-0">
                      {renamingId === project.id ? (
                        <Input
                          ref={renameRef}
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={() => {
                            if (renameValue.trim())
                              renameProject(project.id, renameValue.trim());
                            setRenamingId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              (e.target as HTMLInputElement).blur();
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          className="h-7 text-sm font-medium w-full max-w-xs"
                        />
                      ) : (
                        <p className="font-medium truncate">{project.name}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(project.createdAt).toLocaleDateString(
                          "zh-CN",
                        )}{" "}
                        · 当前步骤：
                        {project.currentStep === "insights" && "用户洞察"}
                        {project.currentStep === "prd" && "PRD 生成"}
                        {project.currentStep === "priorities" && "优先级排序"}
                        {project.currentStep === "interview" && "用户访谈"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameValue(project.name);
                          setRenamingId(project.id);
                          setTimeout(() => renameRef.current?.focus(), 0);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

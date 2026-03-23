"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useProjectStore } from "@/store/project-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Users,
  LayoutList,
  FileText,
  CheckCircle2,
  Circle,
  Copy,
  Check,
} from "lucide-react";
import type { Feature } from "@/lib/types";
import { useSettingsStore } from "@/store/settings-store";

export default function PRDPage() {
  const params = useParams();
  const router = useRouter();
  const projects = useProjectStore((s) => s.projects);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const updatePRD = useProjectStore((s) => s.updatePRD);
  const goToStep = useProjectStore((s) => s.goToStep);
  const project = useMemo(
    () => projects.find((p) => p.id === currentProjectId) ?? null,
    [projects, currentProjectId],
  );

  const api = useSettingsStore((s) => s.api);
  const [loading, setLoading] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("personas");
  const [copied, setCopied] = useState(false);

  if (!project) return null;

  const hasPersonas = project.prd.userPersonas.length > 0;
  const hasFeatures = project.prd.features.length > 0;
  const hasDoc = project.prd.fullDocument.length > 0;

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/prd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          painPoints: project!.insights.painPoints,
          highFreqNeeds: project!.insights.highFreqNeeds,
          rawInput: project!.insights.rawInput,
          apiKey: api.apiKey,
          baseUrl: api.baseUrl,
          modelId: api.modelId,
        }),
      });

      if (!res.ok) throw new Error("生成失败");

      const data = await res.json();
      updatePRD({
        userPersonas: data.userPersonas,
        scenarios: data.scenarios,
        features: data.features,
        mvpScope: data.features
          .filter((f: Feature) => f.inMVP)
          .map((f: Feature) => f.id),
      });
      setActiveTab("personas");
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateDoc() {
    setDocLoading(true);
    try {
      const res = await fetch("/api/prd-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personas: project!.prd.userPersonas,
          scenarios: project!.prd.scenarios,
          features: project!.prd.features,
          rawInput: project!.insights.rawInput,
          apiKey: api.apiKey,
          baseUrl: api.baseUrl,
          modelId: api.modelId,
        }),
      });

      if (!res.ok) throw new Error("生成失败");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let doc = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          doc += chunk;
          updatePRD({ fullDocument: doc });
        }
      }
      setActiveTab("document");
    } catch {
      // error handled silently
    } finally {
      setDocLoading(false);
    }
  }

  function toggleMVP(featureId: string) {
    const features = project!.prd.features.map((f) =>
      f.id === featureId ? { ...f, inMVP: !f.inMVP } : f,
    );
    const mvpScope = features.filter((f) => f.inMVP).map((f) => f.id);
    updatePRD({ features, mvpScope });
  }

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(project!.prd.fullDocument);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [project]);

  function handleBack() {
    goToStep("insights");
    router.push(`/project/${params.id}/insights`);
  }

  function handleNext() {
    goToStep("priorities");
    router.push(`/project/${params.id}/priorities`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PRD 生成</h1>
          <p className="text-muted-foreground mt-1">
            基于用户洞察自动生成用户画像、功能列表和产品文档
          </p>
        </div>
        {!hasPersonas && (
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI 生成中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                生成 PRD 内容
              </>
            )}
          </Button>
        )}
      </div>

      {hasPersonas && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personas" className="gap-1.5">
              <Users className="h-4 w-4" /> 用户画像
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-1.5">
              <LayoutList className="h-4 w-4" /> 功能列表
            </TabsTrigger>
            <TabsTrigger value="document" className="gap-1.5">
              <FileText className="h-4 w-4" /> PRD 文档
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personas" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {project.prd.userPersonas.map((persona) => (
                <Card key={persona.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{persona.avatar}</span>
                      <div>
                        <CardTitle className="text-base">
                          {persona.name}
                        </CardTitle>
                        <CardDescription>
                          {persona.age} · {persona.role}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">{persona.bio}</p>
                    <div>
                      <p className="font-medium text-green-700 mb-1">目标</p>
                      <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                        {persona.goals.map((g, i) => (
                          <li key={i}>{g}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-red-700 mb-1">挫败</p>
                      <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                        {persona.frustrations.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {project.prd.scenarios.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">使用场景</h3>
                <div className="space-y-2">
                  {project.prd.scenarios.map((sc) => {
                    const persona = project.prd.userPersonas.find(
                      (p) => p.id === sc.personaId,
                    );
                    return (
                      <div key={sc.id} className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{sc.title}</span>
                          {persona && (
                            <Badge variant="outline" className="text-xs">
                              {persona.avatar} {persona.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {sc.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="features" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                共 {project.prd.features.length} 个功能，
                {project.prd.mvpScope.length} 个在 MVP 范围内
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "重新生成"
                )}
              </Button>
            </div>

            <div className="space-y-2">
              {project.prd.features.map((feature) => (
                <Card key={feature.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleMVP(feature.id)}
                        className="mt-0.5 shrink-0"
                      >
                        {feature.inMVP ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/40" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{feature.name}</span>
                          {feature.inMVP && (
                            <Badge className="text-xs">MVP</Badge>
                          )}
                          {feature.fromPainPoint && (
                            <Badge variant="outline" className="text-xs">
                              关联痛点
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {feature.description}
                        </p>
                        <p className="text-xs text-muted-foreground italic">
                          {feature.userStory}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="document" className="mt-6">
            {!hasDoc ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    基于当前的用户画像和功能列表生成完整 PRD 文档
                  </p>
                  <Button onClick={handleGenerateDoc} disabled={docLoading}>
                    {docLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        生成 PRD 文档
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg">产品需求文档</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="gap-1.5"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copied ? "已复制" : "复制"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateDoc}
                      disabled={docLoading}
                    >
                      {docLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "重新生成"
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                      {project.prd.fullDocument}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {hasFeatures && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回洞察
          </Button>
          <Button onClick={handleNext} size="lg" className="gap-2">
            下一步：优先级排序
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

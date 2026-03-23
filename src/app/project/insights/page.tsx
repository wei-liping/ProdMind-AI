"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/project-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  SmilePlus,
  Frown,
  Meh,
  Sparkles,
} from "lucide-react";
import { useSettingsStore } from "@/store/settings-store";
import { analyzeInsights, generateProjectName } from "@/lib/ai/client";

const severityColors = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

const severityLabels = { high: "严重", medium: "中等", low: "轻微" };

export default function InsightsPage() {
  const router = useRouter();
  const projects = useProjectStore((s) => s.projects);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const updateInsights = useProjectStore((s) => s.updateInsights);
  const renameProject = useProjectStore((s) => s.renameProject);
  const goToStep = useProjectStore((s) => s.goToStep);
  const project = useMemo(
    () => projects.find((p) => p.id === currentProjectId) ?? null,
    [projects, currentProjectId],
  );
  const api = useSettingsStore((s) => s.api);
  const [input, setInput] = useState(project?.insights.rawInput ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!project) return null;

  const hasResults = project.insights.painPoints.length > 0;

  async function handleAnalyze() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    updateInsights({ rawInput: input });

    try {
      const data = await analyzeInsights(
        api,
        input,
        project!.insights.inputType,
      );
      updateInsights({
        painPoints: data.painPoints,
        sentimentSummary: data.sentimentSummary,
        highFreqNeeds: data.highFreqNeeds,
      });

      if (project!.name === "新想法项目" || project!.name === "用户反馈分析") {
        generateProjectName(api, input)
          .then((name) => {
            if (name) renameProject(project!.id, name);
          })
          .catch(() => {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    goToStep("prd");
    router.push("/project/prd");
  }

  const sentiment = project.insights.sentimentSummary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">用户洞察</h1>
        <p className="text-muted-foreground mt-1">
          {project.insights.inputType === "idea"
            ? "输入你的产品想法，AI 帮你拆解用户痛点与需求"
            : "粘贴用户反馈或评论，AI 自动聚类分析"}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Textarea
            placeholder={
              project.insights.inputType === "idea"
                ? "描述你的产品想法，例如：我想做一个帮助远程团队异步协作的工具，解决不同时区沟通效率低的问题..."
                : "粘贴用户评论或反馈，每条一行...\n\n例如：\n- 你们的App太卡了，每次打开都要等好久\n- 找不到历史记录功能，太难用了\n- 希望能支持暗黑模式"
            }
            className="min-h-[180px] text-base leading-relaxed"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleAnalyze} disabled={loading || !input.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  AI 分析中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  开始分析
                </>
              )}
            </Button>
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {error}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {hasResults && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <SmilePlus className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {sentiment.positive}%
                </div>
                <div className="text-sm text-muted-foreground">正面情绪</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Frown className="h-8 w-8 mx-auto text-red-500 mb-2" />
                <div className="text-2xl font-bold text-red-600">
                  {sentiment.negative}%
                </div>
                <div className="text-sm text-muted-foreground">负面情绪</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Meh className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <div className="text-2xl font-bold text-gray-500">
                  {sentiment.neutral}%
                </div>
                <div className="text-sm text-muted-foreground">中性情绪</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                核心痛点
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.insights.painPoints.map((point) => (
                  <div
                    key={point.id}
                    className="flex items-start gap-3 rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{point.title}</span>
                        <Badge
                          variant="outline"
                          className={severityColors[point.severity]}
                        >
                          {severityLabels[point.severity]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {point.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>频率 {point.frequency}/10</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">高频需求</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {project.insights.highFreqNeeds.map((need, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-sm px-3 py-1"
                  >
                    {need}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleNext} size="lg" className="gap-2">
              下一步：生成 PRD
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useProjectStore } from "@/store/project-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useSettingsStore } from "@/store/settings-store";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
} from "recharts";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: { name: string; score: number; effort: number; impact: number };
  }>;
}

function ChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="font-medium">{d.name}</p>
      <p className="text-muted-foreground">
        RICE Score:{" "}
        <span className="font-semibold text-foreground">
          {d.score.toFixed(1)}
        </span>
      </p>
      <p className="text-muted-foreground">
        Effort: {d.effort} · Impact: {d.impact}
      </p>
    </div>
  );
}

export default function PrioritiesPage() {
  const params = useParams();
  const router = useRouter();
  const projects = useProjectStore((s) => s.projects);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const updatePriorities = useProjectStore((s) => s.updatePriorities);
  const goToStep = useProjectStore((s) => s.goToStep);
  const project = useMemo(
    () => projects.find((p) => p.id === currentProjectId) ?? null,
    [projects, currentProjectId],
  );

  const api = useSettingsStore((s) => s.api);
  const [loading, setLoading] = useState(false);

  if (!project) return null;

  const hasRankings = project.priorities.rankings.length > 0;

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/priorities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          features: project!.prd.features,
          apiKey: api.apiKey,
          baseUrl: api.baseUrl,
          modelId: api.modelId,
        }),
      });

      if (!res.ok) throw new Error("评分失败");

      const data = await res.json();
      updatePriorities({
        rankings: data.rankings.sort(
          (a: { score: number }, b: { score: number }) => b.score - a.score,
        ),
        recommendation: data.recommendation,
      });
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }

  function updateRanking(featureId: string, field: string, value: number) {
    const rankings = project!.priorities.rankings.map((r) => {
      if (r.featureId !== featureId) return r;
      const updated = { ...r, [field]: value };
      updated.score =
        (updated.reach * updated.impact * updated.confidence) / updated.effort;
      return updated;
    });
    rankings.sort((a, b) => b.score - a.score);
    updatePriorities({ rankings });
  }

  const chartData = useMemo(() => {
    return project!.priorities.rankings.map((r) => {
      const feat = project!.prd.features.find((f) => f.id === r.featureId);
      return {
        name: feat?.name ?? r.featureId,
        effort: r.effort,
        impact: r.impact,
        score: r.score,
        z: Math.max(r.score * 80, 200),
      };
    });
  }, [project]);

  function handleBack() {
    goToStep("prd");
    router.push(`/project/${params.id}/prd`);
  }

  function handleNext() {
    goToStep("interview");
    router.push(`/project/${params.id}/interview`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">优先级排序</h1>
          <p className="text-muted-foreground mt-1">
            使用 RICE 框架为功能评分，辅助决策
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              AI 评分中...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {hasRankings ? "重新评分" : "AI 自动评分"}
            </>
          )}
        </Button>
      </div>

      {hasRankings && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Impact vs Effort 气泡图</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart
                  margin={{ top: 10, right: 30, bottom: 20, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    type="number"
                    dataKey="effort"
                    name="Effort"
                    label={{
                      value: "Effort (人/周)",
                      position: "bottom",
                      offset: 0,
                      fontSize: 12,
                    }}
                    domain={[0, 12]}
                  />
                  <YAxis
                    type="number"
                    dataKey="impact"
                    name="Impact"
                    label={{
                      value: "Impact",
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 12,
                    }}
                    domain={[0, 4]}
                  />
                  <ZAxis type="number" dataKey="z" range={[100, 800]} />
                  <Tooltip content={<ChartTooltip />} />
                  <Scatter data={chartData}>
                    {chartData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                        fillOpacity={0.7}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-4 justify-center">
                {chartData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    {d.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {project.priorities.recommendation && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-4">
                <div className="flex gap-2">
                  <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm mb-1">AI 建议</p>
                    <p className="text-sm text-muted-foreground">
                      {project.priorities.recommendation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {project.priorities.rankings.map((ranking, index) => {
              const feature = project.prd.features.find(
                (f) => f.id === ranking.featureId,
              );
              if (!feature) return null;

              return (
                <Card key={ranking.featureId}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{feature.name}</span>
                          {feature.inMVP && (
                            <Badge className="text-xs">MVP</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {ranking.score.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          RICE Score
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1.5">
                          Reach ({ranking.reach})
                        </label>
                        <Slider
                          value={[ranking.reach]}
                          min={1}
                          max={10}
                          step={1}
                          onValueChange={(v) =>
                            updateRanking(ranking.featureId, "reach", v)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1.5">
                          Impact ({ranking.impact})
                        </label>
                        <Slider
                          value={[ranking.impact]}
                          min={1}
                          max={3}
                          step={0.5}
                          onValueChange={(v) =>
                            updateRanking(ranking.featureId, "impact", v)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1.5">
                          Confidence ({(ranking.confidence * 100).toFixed(0)}%)
                        </label>
                        <Slider
                          value={[ranking.confidence]}
                          min={0.5}
                          max={1}
                          step={0.1}
                          onValueChange={(v) =>
                            updateRanking(ranking.featureId, "confidence", v)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1.5">
                          Effort ({ranking.effort})
                        </label>
                        <Slider
                          value={[ranking.effort]}
                          min={1}
                          max={10}
                          step={1}
                          onValueChange={(v) =>
                            updateRanking(ranking.featureId, "effort", v)
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回 PRD
        </Button>
        {hasRankings && (
          <Button onClick={handleNext} size="lg" className="gap-2">
            下一步：用户访谈
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

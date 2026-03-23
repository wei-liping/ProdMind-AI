"use client";

import { useState } from "react";
import { useSettingsStore } from "@/store/settings-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

export function SettingsDialog() {
  const api = useSettingsStore((s) => s.api);
  const updateAPI = useSettingsStore((s) => s.updateAPI);
  const [showKey, setShowKey] = useState(false);
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);

  const isConfigured = !!(api.apiKey && api.baseUrl && api.modelId);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(api),
      });
      setTestResult(res.ok ? "ok" : "fail");
    } catch {
      setTestResult("fail");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="h-8 w-8 relative" />
        }
      >
        <Settings className="h-4 w-4" />
        {!isConfigured && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive" />
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API 设置</DialogTitle>
          <DialogDescription>
            配置 AI 模型接口，支持任何 OpenAI 兼容的
            API（火山引擎、SiliconFlow、OpenAI 等）
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showKey ? "text" : "password"}
                placeholder="sk-..."
                value={api.apiKey}
                onChange={(e) => {
                  updateAPI({ apiKey: e.target.value });
                  setTestResult(null);
                }}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              placeholder="https://ark.cn-beijing.volces.com/api/v3"
              value={api.baseUrl}
              onChange={(e) => {
                updateAPI({ baseUrl: e.target.value });
                setTestResult(null);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelId">模型名称</Label>
            <Input
              id="modelId"
              placeholder="doubao-seed-2-0-pro-260215"
              value={api.modelId}
              onChange={(e) => {
                updateAPI({ modelId: e.target.value });
                setTestResult(null);
              }}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleTest}
              disabled={!isConfigured || testing}
              variant="outline"
              className="gap-2"
            >
              {testing ? "测试中..." : "测试连接"}
            </Button>
            {testResult === "ok" && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                连接成功
              </span>
            )}
            {testResult === "fail" && (
              <span className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                连接失败，请检查配置
              </span>
            )}
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium">常用配置示例：</p>
            <p>火山引擎：Base URL = https://ark.cn-beijing.volces.com/api/v3</p>
            <p>SiliconFlow：Base URL = https://api.siliconflow.cn/v1</p>
            <p>OpenAI：Base URL = https://api.openai.com/v1</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

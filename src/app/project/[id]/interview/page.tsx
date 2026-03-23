"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useProjectStore } from "@/store/project-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, Loader2, User, Bot } from "lucide-react";
import type { Persona, ChatMessage } from "@/lib/types";
import { useSettingsStore } from "@/store/settings-store";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const projects = useProjectStore((s) => s.projects);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const updateInterview = useProjectStore((s) => s.updateInterview);
  const addInterviewMessage = useProjectStore((s) => s.addInterviewMessage);
  const goToStep = useProjectStore((s) => s.goToStep);
  const project = useMemo(
    () => projects.find((p) => p.id === currentProjectId) ?? null,
    [projects, currentProjectId],
  );

  const api = useSettingsStore((s) => s.api);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedPersona = project?.interview.persona;
  const messages = project?.interview.messages ?? [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!project) return null;

  function handleSelectPersona(persona: Persona) {
    updateInterview({
      persona,
      messages: [
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `你好！我是${persona.name}，${persona.bio}。你有什么想了解的吗？`,
          timestamp: Date.now(),
        },
      ],
    });
  }

  async function handleSend() {
    if (!input.trim() || !selectedPersona || streaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };
    addInterviewMessage(userMsg);
    setInput("");
    setStreaming(true);

    try {
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          persona: selectedPersona,
          apiKey: api.apiKey,
          baseUrl: api.baseUrl,
          modelId: api.modelId,
        }),
      });

      if (!res.ok) throw new Error("请求失败");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = crypto.randomUUID();

      addInterviewMessage({
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      });

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          assistantContent += chunk;
          updateInterview({
            messages: [
              ...messages,
              userMsg,
              {
                id: assistantId,
                role: "assistant",
                content: assistantContent,
                timestamp: Date.now(),
              },
            ],
          });
        }
      }
    } catch {
      // handled silently
    } finally {
      setStreaming(false);
    }
  }

  function handleBack() {
    goToStep("priorities");
    router.push(`/project/${params.id}/priorities`);
  }

  if (!selectedPersona) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">用户访谈模拟</h1>
          <p className="text-muted-foreground mt-1">
            选择一个用户画像，模拟进行产品验证访谈
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {project.prd.userPersonas.map((persona) => (
            <Card
              key={persona.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
              onClick={() => handleSelectPersona(persona)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{persona.avatar}</span>
                  <div>
                    <CardTitle className="text-base">{persona.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {persona.age} · {persona.role}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{persona.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button variant="outline" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回优先级
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">用户访谈模拟</h1>
          <p className="text-muted-foreground mt-1">
            正在与 {selectedPersona.avatar} {selectedPersona.name} 对话
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateInterview({ persona: null, messages: [] })}
        >
          切换角色
        </Button>
      </div>

      <Card className="flex flex-col" style={{ height: "calc(100vh - 280px)" }}>
        <CardHeader className="border-b py-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedPersona.avatar}</span>
            <div>
              <CardTitle className="text-sm">{selectedPersona.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {selectedPersona.role} · {selectedPersona.bio}
              </p>
            </div>
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback
                    className={
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }
                  >
                    {msg.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <span className="text-sm">{selectedPersona.avatar}</span>
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`rounded-2xl px-4 py-2.5 max-w-[75%] text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted rounded-tl-sm"
                  }`}
                >
                  {msg.content || <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <CardContent className="border-t p-3 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="作为产品经理提问..."
              disabled={streaming}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={streaming || !input.trim()}
            >
              {streaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={handleBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        返回优先级
      </Button>
    </div>
  );
}

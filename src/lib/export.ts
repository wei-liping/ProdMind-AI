import type { Project, Step } from "./types";
import { STEPS } from "./types";

const STEP_LABELS: Record<Step, string> = {
  insights: "用户洞察",
  prd: "PRD 生成",
  priorities: "优先级排序",
  interview: "用户访谈",
};

const SEVERITY_LABELS: Record<string, string> = {
  high: "严重",
  medium: "中等",
  low: "轻微",
};

function renderInsights(p: Project): string {
  const { insights } = p;
  const lines: string[] = ["## 用户洞察", ""];

  if (insights.rawInput) {
    lines.push("### 原始输入", "", insights.rawInput, "");
  }

  const s = insights.sentimentSummary;
  lines.push(
    "### 情绪分析",
    "",
    `| 正面 | 负面 | 中性 |`,
    `| --- | --- | --- |`,
    `| ${s.positive}% | ${s.negative}% | ${s.neutral}% |`,
    "",
  );

  if (insights.painPoints.length) {
    lines.push("### 核心痛点", "");
    for (const pp of insights.painPoints) {
      lines.push(
        `- **${pp.title}**（${SEVERITY_LABELS[pp.severity] ?? pp.severity}，频率 ${pp.frequency}/10）`,
        `  ${pp.description}`,
      );
    }
    lines.push("");
  }

  if (insights.highFreqNeeds.length) {
    lines.push(
      "### 高频需求",
      "",
      insights.highFreqNeeds.map((n) => `\`${n}\``).join("  "),
      "",
    );
  }

  return lines.join("\n");
}

function renderPRD(p: Project): string {
  const { prd } = p;
  const lines: string[] = ["## PRD 内容", ""];

  if (prd.fullDocument) {
    lines.push("### 完整 PRD 文档", "", prd.fullDocument, "");
    return lines.join("\n");
  }

  if (prd.userPersonas.length) {
    lines.push("### 用户画像", "");
    for (const persona of prd.userPersonas) {
      lines.push(
        `#### ${persona.avatar} ${persona.name}`,
        "",
        `- **年龄**：${persona.age}`,
        `- **角色**：${persona.role}`,
        `- **简介**：${persona.bio}`,
        `- **目标**：${persona.goals.join("、")}`,
        `- **挫败**：${persona.frustrations.join("、")}`,
        "",
      );
    }
  }

  if (prd.scenarios.length) {
    lines.push("### 使用场景", "");
    for (const sc of prd.scenarios) {
      const persona = prd.userPersonas.find((p) => p.id === sc.personaId);
      lines.push(
        `- **${sc.title}**${persona ? `（${persona.name}）` : ""}：${sc.description}`,
      );
    }
    lines.push("");
  }

  if (prd.features.length) {
    const mvp = prd.features.filter((f) => f.inMVP);
    const later = prd.features.filter((f) => !f.inMVP);

    lines.push("### 功能列表", "");
    if (mvp.length) {
      lines.push(`**MVP 功能（${mvp.length} 个）**`, "");
      for (const f of mvp) {
        lines.push(
          `- **${f.name}**：${f.description}`,
          `  > ${f.userStory}`,
          "",
        );
      }
    }
    if (later.length) {
      lines.push(`**后续功能（${later.length} 个）**`, "");
      for (const f of later) {
        lines.push(`- **${f.name}**：${f.description}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

function renderPriorities(p: Project): string {
  const { priorities, prd } = p;
  const lines: string[] = ["## 优先级排序（RICE）", ""];

  if (priorities.rankings.length) {
    lines.push(
      "| # | 功能 | Reach | Impact | Confidence | Effort | Score |",
      "| --- | --- | --- | --- | --- | --- | --- |",
    );
    for (let i = 0; i < priorities.rankings.length; i++) {
      const r = priorities.rankings[i];
      const feat = prd.features.find((f) => f.id === r.featureId);
      lines.push(
        `| ${i + 1} | ${feat?.name ?? r.featureId} | ${r.reach} | ${r.impact} | ${(r.confidence * 100).toFixed(0)}% | ${r.effort} | **${r.score.toFixed(1)}** |`,
      );
    }
    lines.push("");
  }

  if (priorities.recommendation) {
    lines.push("### AI 建议", "", priorities.recommendation, "");
  }

  return lines.join("\n");
}

function renderInterview(p: Project): string {
  const { interview } = p;
  const lines: string[] = ["## 用户访谈模拟", ""];

  if (interview.persona) {
    const persona = interview.persona;
    lines.push(
      `**访谈对象**：${persona.avatar} ${persona.name}（${persona.role}）`,
      "",
    );
  }

  if (interview.messages.length) {
    lines.push("### 对话记录", "");
    for (const msg of interview.messages) {
      const prefix =
        msg.role === "user"
          ? "**产品经理**"
          : `**${interview.persona?.name ?? "用户"}**`;
      lines.push(`${prefix}：${msg.content}`, "");
    }
  }

  return lines.join("\n");
}

const RENDERERS: Record<Step, (p: Project) => string> = {
  insights: renderInsights,
  prd: renderPRD,
  priorities: renderPriorities,
  interview: renderInterview,
};

export function generateMarkdown(project: Project, steps: Step[]): string {
  const sections: string[] = [
    `# ${project.name}`,
    "",
    `> 创建于 ${new Date(project.createdAt).toLocaleDateString("zh-CN")}`,
    "",
    "---",
    "",
  ];

  for (const step of steps) {
    const rendered = RENDERERS[step](project);
    if (rendered.trim()) {
      sections.push(rendered);
      sections.push("---", "");
    }
  }

  sections.push("*由 ProdMind AI 生成*");
  return sections.join("\n");
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportMarkdown(project: Project, steps: Step[]) {
  const md = generateMarkdown(project, steps);
  const safeName = project.name.replace(/[^\w\u4e00-\u9fff-]/g, "_");
  downloadFile(md, `${safeName}.md`, "text/markdown;charset=utf-8");
}

export async function exportPDF(project: Project, steps: Step[]) {
  const md = generateMarkdown(project, steps);

  const html = markdownToSimpleHTML(md);

  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.cssText =
    "font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.8;color:#1a1a1a;padding:40px;max-width:800px;";
  document.body.appendChild(container);

  const { default: html2pdf } = await import("html2pdf.js");
  const safeName = project.name.replace(/[^\w\u4e00-\u9fff-]/g, "_");

  await html2pdf()
    .set({
      margin: [10, 15],
      filename: `${safeName}.pdf`,
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(container)
    .save();

  document.body.removeChild(container);
}

function markdownToSimpleHTML(md: string): string {
  return md
    .replace(
      /^### (.+)$/gm,
      "<h3 style='margin:16px 0 8px;font-size:16px;color:#374151'>$1</h3>",
    )
    .replace(
      /^## (.+)$/gm,
      "<h2 style='margin:24px 0 12px;font-size:20px;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:8px'>$1</h2>",
    )
    .replace(
      /^# (.+)$/gm,
      "<h1 style='margin:0 0 8px;font-size:26px;color:#111827'>$1</h1>",
    )
    .replace(
      /^> (.+)$/gm,
      "<blockquote style='margin:8px 0;padding:8px 16px;border-left:3px solid #d1d5db;color:#6b7280;font-size:13px'>$1</blockquote>",
    )
    .replace(
      /^---$/gm,
      "<hr style='border:none;border-top:1px solid #e5e7eb;margin:20px 0'>",
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /`([^`]+)`/g,
      "<code style='background:#f3f4f6;padding:2px 6px;border-radius:3px;font-size:13px'>$1</code>",
    )
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match
        .split("|")
        .filter(Boolean)
        .map((c) => c.trim());
      if (cells.every((c) => /^-+$/.test(c))) return "";
      const tag = cells.some((c) => c.startsWith("**")) ? "td" : "td";
      return `<tr>${cells.map((c) => `<${tag} style="padding:6px 12px;border:1px solid #e5e7eb">${c}</${tag}>`).join("")}</tr>`;
    })
    .replace(/(<tr>[\s\S]*?<\/tr>)/g, (m) => {
      if (m.trim() === "") return "";
      return m;
    })
    .replace(
      /((?:<tr>.*<\/tr>\n?)+)/g,
      "<table style='border-collapse:collapse;width:100%;margin:12px 0'>$1</table>",
    )
    .replace(/^- (.+)$/gm, "<li style='margin:4px 0;margin-left:20px'>$1</li>")
    .replace(/\n{2,}/g, "<br><br>")
    .replace(/\n/g, "<br>");
}

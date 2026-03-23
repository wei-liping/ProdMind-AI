# ProdMind AI

像产品经理一样思考的 AI Copilot — 从用户洞察到 PRD 生成，再到优先级决策。

## 功能特点

- **用户洞察**：输入产品想法或用户评论，AI 自动提取痛点、情绪分析和高频需求
- **PRD 生成**：基于洞察生成用户画像、功能列表和完整 PRD 文档
- **优先级排序**：RICE 评分框架，可视化气泡图辅助决策
- **用户访谈模拟**：与 AI 扮演的用户画像进行产品验证对话
- **导出**：支持 Markdown / PDF 导出，可选择单个或多个步骤
- **AI 自动命名**：分析完成后自动为项目生成简洁名称

## 技术栈

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Zustand（状态管理 + localStorage 持久化）
- 支持任何 OpenAI 兼容 API（火山引擎、SiliconFlow、OpenAI 等）

## 使用方式

1. 打开应用
2. 点击右上角 ⚙️ 设置按钮，配置你的 API Key、Base URL 和模型名称
3. 选择「我有一个想法」或「我有一堆用户评论」开始
4. 按照工作流逐步推进

## 本地开发

```bash
npm install
npm run dev
```

## 部署

本项目配置为 GitHub Pages 静态部署，推送到 `main` 分支后自动构建部署。

所有 AI 调用在用户浏览器端直接发起，无需后端服务器。

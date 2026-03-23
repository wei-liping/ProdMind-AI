# ProdMind AI

> An AI copilot that thinks like a product manager.

ProdMind AI 是一个面向产品经理的 AI 助手，覆盖从用户洞察到 PRD 生成再到优先级决策的完整工作流。它不是一个工具合集，而是一个**流程驱动**的产品经理 copilot。

## 核心流程

```
用户输入 → 用户洞察 → PRD 生成 → 优先级排序 → 用户访谈模拟
```

### 1. 用户洞察 (PainPoint Radar)
- 支持「产品想法」和「用户评论」两种输入模式
- AI 自动提取核心痛点、情绪分析、高频需求

### 2. PRD 生成（核心模块）
- 自动生成用户画像 (Persona)
- 使用场景关联
- 功能列表 + MVP 范围标记
- 一键生成完整 PRD 文档（流式输出）

### 3. 优先级排序 (RICE)
- AI 自动 RICE 评分（Reach / Impact / Confidence / Effort）
- 可手动调整滑块
- Impact vs Effort 气泡图可视化

### 4. 用户访谈模拟
- 选择 AI 生成的 Persona 角色
- Chat UI 模拟真实用户访谈
- AI 完全进入角色回答问题

## 设计亮点

- **流程驱动**：步骤导航引导用户逐步完成，不是工具合集
- **状态延续**：上一步结果自动流入下一步，Context Banner 提示数据流转
- **一份共享状态**：所有模块操作同一份 Project State（Zustand + localStorage 持久化）
- **有取舍的 MVP**：功能列表支持 MVP 标记，体现产品思维

## 技术栈

- **框架**：Next.js 16 (App Router)
- **UI**：shadcn/ui + Tailwind CSS v4
- **状态**：Zustand (persist middleware)
- **AI**：Vercel AI SDK + OpenAI API
- **可视化**：Recharts
- **部署**：Vercel

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 OpenAI API Key

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `OPENAI_API_KEY` | OpenAI API 密钥 | 是 |

## 项目结构

```
src/
├── app/
│   ├── api/                    # API Routes (AI 调用)
│   │   ├── insights/           # 用户洞察 API
│   │   ├── prd/                # PRD 生成 API
│   │   ├── prd-doc/            # PRD 文档流式生成
│   │   ├── priorities/         # RICE 评分 API
│   │   └── interview/          # 访谈模拟流式 API
│   ├── project/[id]/           # 项目流程页面
│   │   ├── insights/           # Step 1
│   │   ├── prd/                # Step 2
│   │   ├── priorities/         # Step 3
│   │   └── interview/          # Step 4
│   └── page.tsx                # 首页
├── components/
│   ├── ui/                     # shadcn/ui 组件
│   ├── stepper.tsx             # 流程步骤导航
│   └── context-banner.tsx      # 数据流转上下文提示
├── store/
│   └── project-store.ts        # Zustand 全局状态
└── lib/
    ├── ai/prompts.ts           # AI Prompt 模板
    ├── types.ts                # TypeScript 类型定义
    └── utils.ts                # 工具函数
```

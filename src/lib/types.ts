export type Step = "insights" | "prd" | "priorities" | "interview";

export interface PainPoint {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  frequency: number;
}

export interface SentimentSummary {
  positive: number;
  negative: number;
  neutral: number;
}

export interface Persona {
  id: string;
  name: string;
  age: string;
  role: string;
  bio: string;
  goals: string[];
  frustrations: string[];
  avatar: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  personaId: string;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  userStory: string;
  acceptanceCriteria: string[];
  fromPainPoint?: string;
  inMVP: boolean;
}

export interface RICERanking {
  featureId: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface InsightsData {
  rawInput: string;
  inputType: "idea" | "reviews";
  painPoints: PainPoint[];
  sentimentSummary: SentimentSummary;
  highFreqNeeds: string[];
}

export interface PRDData {
  userPersonas: Persona[];
  scenarios: Scenario[];
  features: Feature[];
  mvpScope: string[];
  fullDocument: string;
}

export interface PrioritiesData {
  rankings: RICERanking[];
  recommendation: string;
}

export interface InterviewData {
  persona: Persona | null;
  messages: ChatMessage[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  currentStep: Step;
  insights: InsightsData;
  prd: PRDData;
  priorities: PrioritiesData;
  interview: InterviewData;
}

export const STEPS: {
  key: Step;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    key: "insights",
    label: "用户洞察",
    icon: "Search",
    description: "分析用户反馈，提取痛点与需求",
  },
  {
    key: "prd",
    label: "PRD 生成",
    icon: "FileText",
    description: "生成用户画像、功能列表与产品文档",
  },
  {
    key: "priorities",
    label: "优先级排序",
    icon: "BarChart3",
    description: "RICE 评分排序与可视化决策",
  },
  {
    key: "interview",
    label: "用户访谈",
    icon: "MessageCircle",
    description: "模拟用户角色进行产品验证",
  },
];

export const STEP_ORDER: Step[] = [
  "insights",
  "prd",
  "priorities",
  "interview",
];

export function createEmptyProject(
  name: string,
  inputType: "idea" | "reviews",
): Project {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    currentStep: "insights",
    insights: {
      rawInput: "",
      inputType,
      painPoints: [],
      sentimentSummary: { positive: 0, negative: 0, neutral: 0 },
      highFreqNeeds: [],
    },
    prd: {
      userPersonas: [],
      scenarios: [],
      features: [],
      mvpScope: [],
      fullDocument: "",
    },
    priorities: {
      rankings: [],
      recommendation: "",
    },
    interview: {
      persona: null,
      messages: [],
    },
  };
}

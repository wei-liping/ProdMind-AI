"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface APISettings {
  apiKey: string;
  baseUrl: string;
  modelId: string;
}

interface SettingsStore {
  api: APISettings;
  updateAPI: (data: Partial<APISettings>) => void;
  isConfigured: () => boolean;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      api: {
        apiKey: "",
        baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
        modelId: "doubao-seed-2-0-pro-260215",
      },

      updateAPI: (data) => {
        set((state) => ({ api: { ...state.api, ...data } }));
      },

      isConfigured: () => {
        const { api } = get();
        return !!(api.apiKey && api.baseUrl && api.modelId);
      },
    }),
    { name: "prodmind-settings" },
  ),
);

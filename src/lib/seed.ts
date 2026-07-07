import type { AppUser, Budget, CejasEvent, DashboardSummary, FinanceEntry, Gratuity, ServerFile } from "@/types";

export const dashboardSeed: DashboardSummary = {
  totalEvents: 0,
  confirmedEvents: 0,
  pendingEvents: 0,
  canceledEvents: 0,
  expectedRevenue: 0,
  confirmedRevenue: 0,
  discountsApplied: 0,
  gratuitiesLoss: 0,
  cashBalance: 0,
  source: "Supabase Database • aguardando primeiro relatório/importação",
  updatedAt: "",
  monthlyRevenue: []
};

export const eventsSeed: CejasEvent[] = [];
export const budgetsSeed: Budget[] = [];
export const financeSeed: FinanceEntry[] = [];
export const gratuitiesSeed: Gratuity[] = [];
export const usersSeed: AppUser[] = [];
export const serverFilesSeed: ServerFile[] = [];
export const tasksSeed: Array<{ id: string; title: string; module: string; priority: string; due: string; status: string }> = [];

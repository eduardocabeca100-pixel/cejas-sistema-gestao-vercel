export type EventStatus = "confirmado" | "em_espera" | "cancelado";
export type GratuityType = "orgao" | "associado" | "nao_associado";
export type UserProfile = "Superadmin" | "Administrador" | "Financeiro" | "Comercial" | "Operacional" | "Leitura";

export interface DashboardSummary {
  totalEvents: number;
  confirmedEvents: number;
  pendingEvents: number;
  canceledEvents: number;
  expectedRevenue: number;
  confirmedRevenue: number;
  discountsApplied: number;
  gratuitiesLoss: number;
  cashBalance: number;
  source: string;
  updatedAt: string;
  monthlyRevenue: Array<{ month: string; value: number }>;
}

export interface CejasEvent {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  company: string;
  room: string;
  origin: string;
  participants?: number;
  responsible?: string;
  amount: number;
  status: EventStatus;
}

export interface BudgetItem {
  id: string;
  rubric: string;
  description: string;
  quantity: number;
  unitValue: number;
  details: string;
}

export interface Budget {
  id: string;
  title: string;
  company: string;
  eventName: string;
  issuer: string;
  customerType: "associado" | "nao_associado";
  dayType: "dias_uteis" | "sabado" | "dom_fer";
  notes: string;
  date: string;
  startTime: string;
  endTime: string;
  items: BudgetItem[];
  total: number;
  status: string;
}

export interface FinanceEntry {
  id: string;
  client: string;
  date?: string;
  budgetLabel?: string;
  boletoStatus: string;
  demonstrativoStatus: string;
  paymentStatus: string;
  billingStatus: string;
  amount: number;
  filesCount: number;
}

export interface Gratuity {
  id: string;
  date: string;
  event: string;
  beneficiary: string;
  type: GratuityType;
  totalValue: number;
  paidValue: number;
  lossValue: number;
  notes: string;
  responsible: string;
  status: string;
}

export interface ServerFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  year: string;
  month?: string;
  eventName?: string;
  fileType?: string;
  uploadedAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserProfile | string;
  permissions: string[];
  status: "ativo" | "inativo" | string;
}

export interface Contract {
  id: string;
  client: string;
  title: string;
  status: string;
  storagePath?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  module?: string;
  priority: string;
  dueDate?: string;
  status: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId?: string;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface AppSetting {
  key: string;
  value: Record<string, unknown>;
}

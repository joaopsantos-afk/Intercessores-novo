export interface Intercessor {
  id: string;
  name: string;
  joinedAt: string;
  active: boolean; // true for current 9 active members; false for historical-only members
  isHistoricalOnly?: boolean;
}

export interface WebhookStatus {
  success: boolean;
  status: number | null;
  message: string;
  timestamp: string;
  payloadSent?: any;
}

export interface Week {
  id: string; // "2026-09-28"
  weekNumber: number; // 1 to 17, 18, 19...
  startDate: string; // "2026-09-28"
  endDate: string; // "2026-10-04" or "2026-10-05" (closing Monday)
  targetPerMember: number; // 140
  memberCountAtWeek: number; // e.g. 9 or 11
  totalTarget: number; // memberCountAtWeek * 140
  hasIndividualData: boolean;
  fixedTotalCount?: number;
  closed?: boolean; // true when week is officially closed on Monday 20h
  closedAt?: string | null; // ISO timestamp of closure
  closedTotalCount?: number; // permanent total frozen at closure
  cumulativeTotalUntilWeek?: number; // accumulated total up to this week
  whatsappSent?: boolean;
  whatsappSentAt?: string | null;
  lastWebhookStatus?: WebhookStatus | null;
}

export interface PrayerRecord {
  id: string;
  weekId: string;
  intercessorId: string;
  count: number; // >= 0. Note: 0 means responded! Absence of record means pending.
  updatedAt: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  assignedMemberIds: string[]; // Intercessor IDs
  createdAt: string;
  updatedAt: string;
}

export interface SpiritualDirection {
  id: string;
  weekId: string;
  weekNumber: number;
  periodLabel: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  weekId: string;
  type: 'monday_12h' | 'monday_18h' | 'monday_20h_closure' | 'mission_assigned' | 'mission_updated' | 'mission_cancelled' | 'manual_test';
  sentAt: string;
  recipientsCount: number;
  recipientNames: string[];
  message: string;
}

export interface AppSettings {
  whatsappGroupLink: string;
  whatsappWebhookUrl: string;
  whatsappApiKey: string;
  enableAutoWhatsapp: boolean;
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  evolutionInstanceName?: string;
  evolutionTargetJid?: string;
}

export interface AppState {
  intercessors: Intercessor[];
  weeks: Week[];
  records: PrayerRecord[];
  missions: Mission[];
  directions: SpiritualDirection[];
  notifications: NotificationLog[];
  settings: AppSettings;
  currentWeekId: string;
}

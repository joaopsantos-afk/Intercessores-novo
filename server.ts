import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import webpush from 'web-push';
import QRCode from 'qrcode';
import { AppState, Intercessor, Week, PrayerRecord, NotificationLog, WebhookStatus, Mission, SpiritualDirection } from './src/types';
import { getInitialAppState } from './src/initialData';
import { getBrasiliaNow, getWeekBoundsForDate, formatWeekPeriod } from './src/utils/date';
import { calculateWeekTotal, calculateOverallTotal } from './src/utils/weeks';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// VAPID keys for Web Push Notifications
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEYSGRtjXgKjTPfzevFgK1t0qSnFHsk43B_pkw1L16nl_mYZ94_LopIOdiDTWzUMs9nu1vyUnMaEGjluZqkLt8o';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'BjH1_L7DLugBjnQsELOUCU72nBAd29o427Bd41XCBao';
const VAPID_SUBJECT = 'mailto:contato@intercessao.org';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Persistent local database path
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');
const SUBSCRIPTIONS_FILE = path.resolve(DATA_DIR, 'push_subscriptions.json');

// Store push subscriptions
let pushSubscriptions: any[] = [];
try {
  if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
    pushSubscriptions = JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8'));
  }
} catch (e) {
  console.error('Error loading push subscriptions:', e);
}

function saveSubscriptions() {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(pushSubscriptions, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving push subscriptions:', e);
  }
}

async function sendPushToAll(title: string, body: string, url: string = '/') {
  const payload = JSON.stringify({ title, body, url });
  const activeSubs = [...pushSubscriptions];
  const invalidEndpoints: string[] = [];

  for (const sub of activeSubs) {
    try {
      await webpush.sendNotification(sub, payload);
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        invalidEndpoints.push(sub.endpoint);
      } else {
        console.error('Push notification delivery error:', err.message);
      }
    }
  }

  if (invalidEndpoints.length > 0) {
    pushSubscriptions = pushSubscriptions.filter(s => !invalidEndpoints.includes(s.endpoint));
    saveSubscriptions();
  }
}

// Ensure local data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory state with 100% local file persistence
let state: AppState = getInitialAppState();

// Migrate and sanitize loaded state (Unify Maria -> Maria Alice, ensure missions and directions)
function sanitizeState(s: AppState): AppState {
  // 1. Unify Maria and Maria Alice into single "Maria Alice"
  s.intercessors = s.intercessors.filter(i => i.id !== 'int-maria');
  const mariaAlice = s.intercessors.find(i => i.id === 'int-maria-alice');
  if (mariaAlice) {
    mariaAlice.name = 'Maria Alice';
    mariaAlice.active = true;
    mariaAlice.isHistoricalOnly = false;
  } else {
    s.intercessors.push({
      id: 'int-maria-alice',
      name: 'Maria Alice',
      joinedAt: '2026-06-08T00:00:00.000Z',
      active: true,
    });
  }

  // Deduplicate intercessors array by ID
  const seenIds = new Set<string>();
  s.intercessors = s.intercessors.filter(i => {
    if (seenIds.has(i.id)) return false;
    seenIds.add(i.id);
    return true;
  });

  // Update records pointing to 'int-maria'
  s.records.forEach(r => {
    if (r.intercessorId === 'int-maria') {
      r.intercessorId = 'int-maria-alice';
    }
  });

  // Ensure collections exist
  const initial = getInitialAppState();
  if (!Array.isArray(s.missions) || s.missions.length === 0) {
    s.missions = initial.missions || [];
  }
  if (!Array.isArray(s.directions) || s.directions.length === 0) {
    s.directions = initial.directions || [];
  }

  // Sanitize mission participants
  s.missions.forEach(m => {
    m.assignedMemberIds = m.assignedMemberIds.map(id => id === 'int-maria' ? 'int-maria-alice' : id);
    m.assignedMemberIds = Array.from(new Set(m.assignedMemberIds));
  });

  // Ensure historical weeks 1 to 16 are marked as closed
  s.weeks.forEach(w => {
    if (w.weekNumber < 17 && w.closed === undefined) {
      w.closed = true;
    }
  });

  // Ensure current week is set properly
  if (!s.currentWeekId || !s.weeks.some(w => w.id === s.currentWeekId)) {
    // Pick highest weekNumber that is not closed, or week 17
    const openWeek = s.weeks.find(w => !w.closed);
    if (openWeek) {
      s.currentWeekId = openWeek.id;
    } else {
      const highest = [...s.weeks].sort((a, b) => b.weekNumber - a.weekNumber)[0];
      s.currentWeekId = highest ? highest.id : '2026-09-28';
    }
  }

  return s;
}

function loadStateFromLocalFile() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.intercessors) && Array.isArray(parsed.weeks)) {
        state = sanitizeState(parsed);
        console.log('⚡ Banco de dados local carregado com sucesso de data/db.json!');
        saveStateToFile(state);
        return;
      }
    }
  } catch (e) {
    console.error('Erro ao ler data/db.json local:', e);
  }

  state = getInitialAppState();
  saveStateToFile(state);
}

function saveStateToFile(newState: AppState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(newState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar em data/db.json:', err);
  }
}

// Initialize local database
loadStateFromLocalFile();

// Returns the current active week
function ensureCurrentWeek(): Week {
  let currentWeek = state.weeks.find(w => w.id === state.currentWeekId);
  const activeMembers = state.intercessors.filter(i => i.active);

  if (!currentWeek) {
    // If not found, look for latest open week
    const openWeek = [...state.weeks].sort((a, b) => b.weekNumber - a.weekNumber).find(w => !w.closed);
    if (openWeek) {
      state.currentWeekId = openWeek.id;
      currentWeek = openWeek;
    } else {
      // Create Week 17 or next week
      const lastWeek = [...state.weeks].sort((a, b) => b.weekNumber - a.weekNumber)[0];
      const nextWeekNumber = (lastWeek?.weekNumber || 16) + 1;
      currentWeek = {
        id: '2026-09-28',
        weekNumber: nextWeekNumber,
        startDate: '2026-09-28',
        endDate: '2026-10-05',
        targetPerMember: 140,
        memberCountAtWeek: activeMembers.length,
        totalTarget: activeMembers.length * 140,
        hasIndividualData: true,
        closed: false,
        closedAt: null,
        whatsappSent: false,
        whatsappSentAt: null,
      };
      state.weeks.push(currentWeek);
      state.currentWeekId = currentWeek.id;
      saveStateToFile(state);
    }
  }

  return currentWeek;
}

/**
 * Closes the current week permanently on Monday at 20h and advances to the next week (Tuesday).
 * Section 7 & 8 strict compliance.
 */
function closeWeekAndAdvance(specificWeekId?: string): { closedWeek: Week; nextWeek: Week; totalPrayed: number } {
  const currentWeek = specificWeekId 
    ? (state.weeks.find(w => w.id === specificWeekId) || state.weeks.find(w => w.id === state.currentWeekId)!)
    : (state.weeks.find(w => w.id === state.currentWeekId)!);

  // 1. Calculate final total prayed in this week
  const weekRecords = state.records.filter(r => r.weekId === currentWeek.id);
  const totalPrayed = currentWeek.hasIndividualData
    ? weekRecords.reduce((sum, r) => sum + (r.count || 0), 0)
    : (currentWeek.fixedTotalCount || 0);

  const nowIso = new Date().toISOString();

  // 2. Mark week as permanently closed
  currentWeek.closed = true;
  currentWeek.closedAt = nowIso;
  currentWeek.closedTotalCount = totalPrayed;

  // 3. Prepare next week (starts next day / Tuesday)
  const nextWeekNumber = currentWeek.weekNumber + 1;
  const activeMembers = state.intercessors.filter(i => i.active);

  // Dates: Next week starts on Tuesday (day after Monday closing) and ends on following Monday
  const prevEnd = new Date(currentWeek.endDate + 'T12:00:00Z');
  const nextStart = new Date(prevEnd);
  nextStart.setDate(prevEnd.getDate() + 1); // Tuesday
  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextStart.getDate() + 6); // Following Monday

  const nextStartDateStr = nextStart.toISOString().split('T')[0];
  const nextEndDateStr = nextEnd.toISOString().split('T')[0];
  const nextWeekId = nextStartDateStr;

  let nextWeek = state.weeks.find(w => w.id === nextWeekId || w.weekNumber === nextWeekNumber);
  if (!nextWeek) {
    nextWeek = {
      id: nextWeekId,
      weekNumber: nextWeekNumber,
      startDate: nextStartDateStr,
      endDate: nextEndDateStr,
      targetPerMember: 140,
      memberCountAtWeek: activeMembers.length,
      totalTarget: activeMembers.length * 140,
      hasIndividualData: true,
      closed: false,
      closedAt: null,
      whatsappSent: false,
      whatsappSentAt: null,
      lastWebhookStatus: null,
    };
    state.weeks.push(nextWeek);
  } else {
    nextWeek.closed = false;
    nextWeek.closedAt = null;
  }

  // 4. Update currentWeekId
  state.currentWeekId = nextWeek.id;

  // 5. Create official closure notification log
  const closureLog: NotificationLog = {
    id: `notif-closure-${Date.now()}`,
    weekId: currentWeek.id,
    type: 'monday_20h_closure',
    sentAt: nowIso,
    recipientsCount: activeMembers.length,
    recipientNames: activeMembers.map(i => i.name),
    message: `Fechamento da Semana ${currentWeek.weekNumber}: foram rezadas ${totalPrayed.toLocaleString('pt-BR')} Ave-Marias! A Semana ${nextWeek.weekNumber} foi iniciada. 🙏`,
  };
  state.notifications.unshift(closureLog);

  saveStateToFile(state);

  // Send push notification to all registered devices
  sendPushToAll(
    `Fechamento da Semana ${currentWeek.weekNumber}`,
    `Foram rezadas ${totalPrayed.toLocaleString('pt-BR')} Ave-Marias! A Semana ${nextWeek.weekNumber} começou.`,
    '/'
  );

  return { closedWeek: currentWeek, nextWeek, totalPrayed };
}

// Format message for WhatsApp - Section 35 strict compliance
function buildWhatsAppMessage(week: Week, records: PrayerRecord[]): string {
  const weekRecords = records.filter(r => r.weekId === week.id);
  const total = week.hasIndividualData
    ? weekRecords.reduce((acc, curr) => acc + curr.count, 0)
    : (week.fixedTotalCount || 0);

  return `*Ave-Marias · Grupo de Intercessão*\nSemana ${week.weekNumber}\n\nNesta semana, foram rezadas *${total.toLocaleString('pt-BR')}* Ave-Marias. 🙏`;
}

// WhatsApp Dispatcher
async function dispatchWhatsAppWebhook(week: Week, message: string): Promise<WebhookStatus> {
  const webhookUrl = state.settings.whatsappWebhookUrl?.trim();
  const apiKey = state.settings.whatsappApiKey?.trim();
  const evoUrl = state.settings.evolutionApiUrl?.trim();
  const evoKey = state.settings.evolutionApiKey?.trim();
  const evoInstance = state.settings.evolutionInstanceName?.trim();
  const evoTarget = state.settings.evolutionTargetJid?.trim();
  const nowIso = new Date().toISOString();

  // Local Environment Mode
  if (!webhookUrl && (!evoUrl || !evoTarget)) {
    const status: WebhookStatus = {
      success: true,
      status: 200,
      message: 'Disparo registrado com sucesso no ambiente local (modo isolado sem conexões externas ativas).',
      timestamp: nowIso,
      payloadSent: { text: message, weekNumber: week.weekNumber },
    };
    week.whatsappSent = true;
    week.whatsappSentAt = nowIso;
    week.lastWebhookStatus = status;
    saveStateToFile(state);
    return status;
  }

  // External webhook if configured
  if (webhookUrl) {
    try {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ message, weekNumber: week.weekNumber, timestamp: nowIso }),
      });
      const isSuccess = resp.status >= 200 && resp.status < 300;
      const status: WebhookStatus = {
        success: isSuccess,
        status: resp.status,
        message: isSuccess ? 'Disparo realizado com sucesso.' : `Erro HTTP ${resp.status}`,
        timestamp: nowIso,
      };
      if (isSuccess) {
        week.whatsappSent = true;
        week.whatsappSentAt = nowIso;
      }
      week.lastWebhookStatus = status;
      return status;
    } catch (e: any) {
      return { success: false, status: null, message: e.message, timestamp: nowIso };
    }
  }

  return { success: true, status: 200, message: 'Disparo local simulado.', timestamp: nowIso };
}

// ======================== API ROUTES ========================

// 1. App State & Dynamic Totals
app.get('/api/state', (req, res) => {
  ensureCurrentWeek();
  const overallTotal = calculateOverallTotal(state.weeks, state.records);
  res.json({
    ...state,
    overallTotal,
    serverTimeBRT: getBrasiliaNow().toISOString(),
  });
});

// 2. Records
app.post('/api/records', async (req, res) => {
  try {
    const { weekId, intercessorId, count } = req.body;

    if (!weekId || !intercessorId || typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
      return res.status(400).json({ error: 'Dados inválidos. O número de Ave-Marias deve ser um número inteiro igual ou maior que zero.' });
    }

    const intercessor = state.intercessors.find(i => (i.id === intercessorId || (intercessorId === 'int-maria' && i.id === 'int-maria-alice')) && i.active);
    if (!intercessor) {
      return res.status(404).json({ error: 'Intercessor não encontrado ou inativo.' });
    }

    const targetMemberId = intercessor.id; // ensures Maria Alice ID is used
    let week = state.weeks.find(w => w.id === weekId);
    if (!week) {
      return res.status(404).json({ error: 'Semana não encontrada.' });
    }

    if (week.closed) {
      return res.status(400).json({ 
        error: `A Semana ${week.weekNumber} já foi encerrada oficialmente e não recebe novos registros. Os novos registros devem ser feitos na Semana ${state.weeks.find(w => w.id === state.currentWeekId)?.weekNumber || 'atual'}.` 
      });
    }

    // Find or update record (REPLACES value, does not sum)
    const existingIndex = state.records.findIndex(r => r.weekId === weekId && r.intercessorId === targetMemberId);
    const nowIso = new Date().toISOString();
    let updatedRecord: PrayerRecord;

    if (existingIndex >= 0) {
      state.records[existingIndex].count = count;
      state.records[existingIndex].updatedAt = nowIso;
      updatedRecord = state.records[existingIndex];
    } else {
      updatedRecord = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        weekId,
        intercessorId: targetMemberId,
        count,
        updatedAt: nowIso,
      };
      state.records.push(updatedRecord);
    }

    // Check if ALL active intercessors have answered this week
    const activeMembers = state.intercessors.filter(i => i.active);
    const weekRecords = state.records.filter(r => r.weekId === weekId);
    const allAnswered = activeMembers.every(m => weekRecords.some(r => r.intercessorId === m.id));

    saveStateToFile(state);

    const overallTotal = calculateOverallTotal(state.weeks, state.records);

    return res.json({
      success: true,
      record: updatedRecord,
      allAnswered,
      justTriggeredWhatsapp: false,
      week,
      overallTotal,
    });
  } catch (err: any) {
    console.error('Error saving record:', err);
    return res.status(500).json({ error: 'Não foi possível salvar o registro agora. Tente novamente.' });
  }
});

// 3. Week Closure & Transition (Monday 20h)
app.post('/api/weeks/close-current', (req, res) => {
  try {
    const { weekId } = req.body;
    const result = closeWeekAndAdvance(weekId);
    const overallTotal = calculateOverallTotal(state.weeks, state.records);
    return res.json({
      success: true,
      closedWeek: result.closedWeek,
      nextWeek: result.nextWeek,
      totalPrayed: result.totalPrayed,
      overallTotal,
      state,
    });
  } catch (err: any) {
    console.error('Error closing week:', err);
    return res.status(500).json({ error: err.message || 'Erro ao fechar a semana.' });
  }
});

// Reopen / Reset back to Week 17 for quick testing
app.post('/api/weeks/reset-to-week17', (req, res) => {
  try {
    const week17 = state.weeks.find(w => w.weekNumber === 17);
    if (week17) {
      week17.closed = false;
      week17.closedAt = null;
      week17.closedTotalCount = undefined;
      state.currentWeekId = week17.id;
    }
    // Remove future weeks above 17 and their records
    const futureWeekIds = state.weeks.filter(w => w.weekNumber > 17).map(w => w.id);
    state.records = state.records.filter(r => !futureWeekIds.includes(r.weekId));
    state.weeks = state.weeks.filter(w => w.weekNumber <= 17);
    saveStateToFile(state);
    return res.json({ success: true, currentWeekId: state.currentWeekId, state });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Intercessors
app.post('/api/intercessors', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Nome do intercessor é obrigatório.' });
    }

    const trimmedName = name.trim();
    const exists = state.intercessors.some(i => i.name.toLowerCase() === trimmedName.toLowerCase() && i.active);
    if (exists) {
      return res.status(400).json({ error: `Já existe um intercessor ativo com o nome "${trimmedName}".` });
    }

    const newIntercessor: Intercessor = {
      id: `int-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmedName,
      joinedAt: new Date().toISOString(),
      active: true,
    };

    state.intercessors.push(newIntercessor);

    const currentWeek = ensureCurrentWeek();
    const activeMembersCount = state.intercessors.filter(i => i.active).length;
    currentWeek.memberCountAtWeek = activeMembersCount;
    currentWeek.totalTarget = activeMembersCount * 140;

    saveStateToFile(state);

    return res.json({
      success: true,
      intercessor: newIntercessor,
      currentWeek,
    });
  } catch (err) {
    console.error('Error adding intercessor:', err);
    return res.status(500).json({ error: 'Não foi possível adicionar o intercessor agora.' });
  }
});

// 5. Missions (Calendário de Missões)
app.get('/api/missions', (req, res) => {
  res.json({ success: true, missions: state.missions || [] });
});

app.post('/api/missions', (req, res) => {
  try {
    const { title, description, date, time, assignedMemberIds } = req.body;
    if (!title || !date) {
      return res.status(400).json({ error: 'Título e data da missão são obrigatórios.' });
    }

    const nowIso = new Date().toISOString();
    const newMission: Mission = {
      id: `miss-${Date.now()}`,
      title: title.trim(),
      description: (description || '').trim(),
      date,
      time: time || '19:30',
      assignedMemberIds: Array.isArray(assignedMemberIds) ? assignedMemberIds : [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    state.missions.push(newMission);

    // Notify assigned participants
    const assignedNames = state.intercessors
      .filter(i => newMission.assignedMemberIds.includes(i.id))
      .map(i => i.name);

    if (assignedNames.length > 0) {
      const notif: NotificationLog = {
        id: `notif-miss-assign-${Date.now()}`,
        weekId: state.currentWeekId,
        type: 'mission_assigned',
        sentAt: nowIso,
        recipientsCount: assignedNames.length,
        recipientNames: assignedNames,
        message: `Você foi escalado(a) para a missão: "${newMission.title}" no dia ${newMission.date} às ${newMission.time}. 🙏`,
      };
      state.notifications.unshift(notif);

      sendPushToAll(
        `Escala de Missão: ${newMission.title}`,
        `Você foi escalado(a) para a missão no dia ${newMission.date} às ${newMission.time}.`,
        '/'
      );
    }

    saveStateToFile(state);
    return res.json({ success: true, mission: newMission });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao criar missão.' });
  }
});

app.put('/api/missions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, time, assignedMemberIds } = req.body;

    const mission = state.missions.find(m => m.id === id);
    if (!mission) {
      return res.status(404).json({ error: 'Missão não encontrada.' });
    }

    const nowIso = new Date().toISOString();
    mission.title = title ? title.trim() : mission.title;
    mission.description = description !== undefined ? description.trim() : mission.description;
    mission.date = date || mission.date;
    mission.time = time || mission.time;
    if (Array.isArray(assignedMemberIds)) {
      mission.assignedMemberIds = assignedMemberIds;
    }
    mission.updatedAt = nowIso;

    // Notify assigned participants of change
    const assignedNames = state.intercessors
      .filter(i => mission.assignedMemberIds.includes(i.id))
      .map(i => i.name);

    if (assignedNames.length > 0) {
      const notif: NotificationLog = {
        id: `notif-miss-update-${Date.now()}`,
        weekId: state.currentWeekId,
        type: 'mission_updated',
        sentAt: nowIso,
        recipientsCount: assignedNames.length,
        recipientNames: assignedNames,
        message: `A missão "${mission.title}" foi alterada para ${mission.date} às ${mission.time}.`,
      };
      state.notifications.unshift(notif);

      sendPushToAll(
        `Missão Alterada: ${mission.title}`,
        `Aviso: a data/horário da missão foi atualizada para ${mission.date} às ${mission.time}.`,
        '/'
      );
    }

    saveStateToFile(state);
    return res.json({ success: true, mission });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao atualizar missão.' });
  }
});

app.delete('/api/missions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = state.missions.findIndex(m => m.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Missão não encontrada.' });
    }

    const removed = state.missions.splice(index, 1)[0];
    const nowIso = new Date().toISOString();

    // Notify participants of cancellation
    const assignedNames = state.intercessors
      .filter(i => removed.assignedMemberIds.includes(i.id))
      .map(i => i.name);

    if (assignedNames.length > 0) {
      const notif: NotificationLog = {
        id: `notif-miss-cancel-${Date.now()}`,
        weekId: state.currentWeekId,
        type: 'mission_cancelled',
        sentAt: nowIso,
        recipientsCount: assignedNames.length,
        recipientNames: assignedNames,
        message: `A missão "${removed.title}" agendada para ${removed.date} foi cancelada.`,
      };
      state.notifications.unshift(notif);

      sendPushToAll(
        `Missão Cancelada`,
        `A missão "${removed.title}" marcada para ${removed.date} foi cancelada.`,
        '/'
      );
    }

    saveStateToFile(state);
    return res.json({ success: true, removedId: id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao excluir missão.' });
  }
});

// 6. Spiritual Directions (Direcionamento da Intercessão)
app.get('/api/directions', (req, res) => {
  res.json({ success: true, directions: state.directions || [] });
});

app.post('/api/directions', (req, res) => {
  try {
    const { weekId, weekNumber, periodLabel, title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Título e conteúdo do direcionamento são obrigatórios.' });
    }

    const nowIso = new Date().toISOString();
    const currentWeek = ensureCurrentWeek();

    const targetWeekNumber = weekNumber || currentWeek.weekNumber;
    const targetWeekId = weekId || currentWeek.id;
    const targetPeriod = periodLabel || `Semana ${targetWeekNumber} (${formatWeekPeriod(currentWeek.startDate, currentWeek.endDate)})`;

    const newDirection: SpiritualDirection = {
      id: `dir-${Date.now()}`,
      weekId: targetWeekId,
      weekNumber: targetWeekNumber,
      periodLabel: targetPeriod,
      title: title.trim(),
      content: content.trim(),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Remove any existing direction for this exact week
    state.directions = state.directions.filter(d => d.weekId !== targetWeekId);
    state.directions.unshift(newDirection);

    saveStateToFile(state);
    return res.json({ success: true, direction: newDirection });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao salvar direcionamento.' });
  }
});

app.put('/api/directions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const direction = state.directions.find(d => d.id === id);
    if (!direction) {
      return res.status(404).json({ error: 'Direcionamento não encontrado.' });
    }

    direction.title = title ? title.trim() : direction.title;
    direction.content = content ? content.trim() : direction.content;
    direction.updatedAt = new Date().toISOString();

    saveStateToFile(state);
    return res.json({ success: true, direction });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao atualizar direcionamento.' });
  }
});

app.delete('/api/directions/:id', (req, res) => {
  try {
    const { id } = req.params;
    state.directions = state.directions.filter(d => d.id !== id);
    saveStateToFile(state);
    return res.json({ success: true, removedId: id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao excluir direcionamento.' });
  }
});

// 7. Web Push Registration
app.get('/api/push/public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

app.post('/api/push/subscribe', (req, res) => {
  try {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Inscrição de push inválida.' });
    }

    const exists = pushSubscriptions.some(s => s.endpoint === subscription.endpoint);
    if (!exists) {
      pushSubscriptions.push(subscription);
      saveSubscriptions();
    }

    res.json({ success: true, count: pushSubscriptions.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 8. Notifications trigger test
app.post('/api/notifications/trigger', async (req, res) => {
  try {
    const { type, weekId } = req.body;
    const week = state.weeks.find(w => w.id === weekId) || ensureCurrentWeek();
    const activeMembers = state.intercessors.filter(i => i.active);
    const weekRecords = state.records.filter(r => r.weekId === week.id);

    let recipients: Intercessor[] = [];
    let messageText = '';

    if (type === 'monday_12h') {
      recipients = activeMembers;
      messageText = 'Não esqueça de registrar suas Ave-Marias desta semana. Que Nossa Senhora abençoe sua oração! 🙏';
    } else if (type === 'monday_18h') {
      recipients = activeMembers.filter(m => !weekRecords.some(r => r.intercessorId === m.id));
      messageText = 'Lembrete de intercessão: ainda não recebemos seu registro de Ave-Marias desta semana.';
    } else {
      recipients = activeMembers;
      messageText = 'Alerta de intercessão: que Nossa Senhora guie suas orações.';
    }

    const log: NotificationLog = {
      id: `notif-${Date.now()}`,
      weekId: week.id,
      type,
      sentAt: new Date().toISOString(),
      recipientsCount: recipients.length,
      recipientNames: recipients.map(r => r.name),
      message: messageText,
    };

    state.notifications.unshift(log);
    saveStateToFile(state);

    sendPushToAll(
      type === 'monday_12h' ? 'Ave-Marias · Lembrete das 12:00' : 'Ave-Marias · Lembrete das 18:00',
      messageText,
      '/'
    );

    return res.json({
      success: true,
      log,
      recipientsCount: recipients.length,
      recipientNames: recipients.map(r => r.name),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 9. Reset database
app.post('/api/reset-data', (req, res) => {
  state = getInitialAppState();
  saveStateToFile(state);
  return res.json({ success: true, state });
});

// ======================== AUTOMATED SCHEDULER (Brasília UTC-3) ========================
let lastCheckedHour = -1;
let lastCheckedDay = -1;

setInterval(() => {
  try {
    const brt = getBrasiliaNow();
    const day = brt.getDay(); // 1 = Monday
    const hour = brt.getHours();
    const minute = brt.getMinutes();

    ensureCurrentWeek();

    // Monday Automations:
    if (day === 1) {
      // 12:00 BRT: Reminder to all members
      if (hour === 12 && minute === 0 && (lastCheckedHour !== 12 || lastCheckedDay !== day)) {
        lastCheckedHour = 12;
        lastCheckedDay = day;
        console.log('[Scheduler] Triggering Monday 12:00 BRT notification');
        const currentWeek = ensureCurrentWeek();
        const activeMembers = state.intercessors.filter(i => i.active);
        const log: NotificationLog = {
          id: `notif-${Date.now()}`,
          weekId: currentWeek.id,
          type: 'monday_12h',
          sentAt: new Date().toISOString(),
          recipientsCount: activeMembers.length,
          recipientNames: activeMembers.map(i => i.name),
          message: 'Não esqueça de registrar suas Ave-Marias desta semana. Que Nossa Senhora abençoe sua oração! 🙏',
        };
        state.notifications.unshift(log);
        saveStateToFile(state);
        sendPushToAll('Ave-Marias · Lembrete das 12:00', log.message, '/');
      }

      // 18:00 BRT: Reminder to pending members
      if (hour === 18 && minute === 0 && (lastCheckedHour !== 18 || lastCheckedDay !== day)) {
        lastCheckedHour = 18;
        lastCheckedDay = day;
        console.log('[Scheduler] Triggering Monday 18:00 BRT notification for pending');
        const currentWeek = ensureCurrentWeek();
        const activeMembers = state.intercessors.filter(i => i.active);
        const weekRecords = state.records.filter(r => r.weekId === currentWeek.id);
        const pending = activeMembers.filter(m => !weekRecords.some(r => r.intercessorId === m.id));

        if (pending.length > 0) {
          const log: NotificationLog = {
            id: `notif-${Date.now()}`,
            weekId: currentWeek.id,
            type: 'monday_18h',
            sentAt: new Date().toISOString(),
            recipientsCount: pending.length,
            recipientNames: pending.map(i => i.name),
            message: 'Lembrete de intercessão: ainda não recebemos seu registro de Ave-Marias desta semana.',
          };
          state.notifications.unshift(log);
          saveStateToFile(state);
          sendPushToAll('Ave-Marias · Lembrete das 18:00', log.message, '/');
        }
      }

      // 20:00 BRT: Official Week Closure & Advance to next week! (Sections 7 & 8)
      if (hour === 20 && minute === 0 && (lastCheckedHour !== 20 || lastCheckedDay !== day)) {
        lastCheckedHour = 20;
        lastCheckedDay = day;
        console.log('[Scheduler] Executing Monday 20:00 BRT Week Closure & Transition');
        closeWeekAndAdvance();
      }
    }
  } catch (e) {
    console.error('Scheduler error:', e);
  }
}, 30000);

// Start server
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});

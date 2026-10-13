/**
 * Utilities for Dates in Brasília Timezone (UTC-3)
 * Monday to Sunday weeks.
 */

// Return current date components in America/Sao_Paulo (Brasília)
export function getBrasiliaNow(): Date {
  const now = new Date();
  const brasiliaString = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  return new Date(brasiliaString);
}

// Format Date object to YYYY-MM-DD
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Parse YYYY-MM-DD to a Date at midnight
export function parseDateISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // midday avoids DST shift anomalies
}

// Calculate the Monday and Sunday for any given date
export function getWeekBoundsForDate(referenceDate: Date = getBrasiliaNow()): {
  weekId: string;
  startDate: string; // YYYY-MM-DD (Monday)
  endDate: string; // YYYY-MM-DD (Sunday)
} {
  const day = referenceDate.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  
  // Calculate distance in days to Monday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() + diffToMonday);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const startDate = formatDateISO(monday);
  const endDate = formatDateISO(sunday);
  
  return {
    weekId: startDate, // ID is the Monday date
    startDate,
    endDate
  };
}

// Format week period for display: "21/09 a 27/09/2026"
export function formatWeekPeriod(startDateStr: string, endDateStr: string): string {
  const [sY, sM, sD] = startDateStr.split('-');
  const [eY, eM, eD] = endDateStr.split('-');
  
  if (sY === eY) {
    return `${sD}/${sM} a ${eD}/${eM}/${sY}`;
  }
  return `${sD}/${sM}/${sY} a ${eD}/${eM}/${eY}`;
}

// Format timestamp for display (e.g. "segunda, 21/09 às 14:32" or "26/09 às 09:30")
export function formatDateTimeBRT(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

// Get Brasília time diagnostic info (day of week, current hour)
export function getBrasiliaStatus(): {
  isMonday: boolean;
  hour: number;
  minute: number;
  timeString: string;
  dateString: string;
} {
  const brt = getBrasiliaNow();
  const day = brt.getDay();
  return {
    isMonday: day === 1,
    hour: brt.getHours(),
    minute: brt.getMinutes(),
    timeString: brt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    dateString: brt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  };
}

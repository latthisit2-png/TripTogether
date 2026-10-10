// src/utils/date.ts
import { format, parseISO, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { th } from 'date-fns/locale';

export function formatThaiDate(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, 'd MMM yyyy', { locale: th });
}

export function formatThaiDateShort(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, 'd MMM', { locale: th });
}

export function formatThaiDayOfWeek(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, 'EEEE', { locale: th });
}

export function getDatesInRange(startDate: string, endDate: string): string[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return eachDayOfInterval({ start, end }).map((d) =>
    format(d, 'yyyy-MM-dd')
  );
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function isDateInRange(dateStr: string, startStr: string, endStr: string): boolean {
  const date = parseISO(dateStr);
  return isWithinInterval(date, { start: parseISO(startStr), end: parseISO(endStr) });
}

export const TIME_SLOTS = [
  { key: 'morning', label: 'เช้า', time: '06:00–12:00', emoji: '🌅' },
  { key: 'afternoon', label: 'บ่าย', time: '12:00–17:00', emoji: '☀️' },
  { key: 'evening', label: 'เย็น', time: '17:00–21:00', emoji: '🌆' },
] as const;

export type TimeSlotKey = 'morning' | 'afternoon' | 'evening';

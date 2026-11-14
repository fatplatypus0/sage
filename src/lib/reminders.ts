/**
 * The plan's three hard boundaries, turned into real reminders.
 * Notifications only exist once the user grants permission; everything here degrades to
 * an in-app overlay, which still logs the habit when it is acknowledged.
 */
export type ReminderKey = 'windDown' | 'wake' | 'drill';

export const REMINDERS: Record<
  ReminderKey,
  { at: number; mins: number; label: string; title: string; body: string; cta: string; habit: 'up3am' | 'lightsOut' | null }
> = {
  wake: {
    at: 178,
    mins: 178,
    label: '3:00 AM',
    title: '3:00 AM — feet on the floor',
    body: 'No snooze. Concept block opens with today’s two units.',
    cta: "I'm up — start the concept block",
    habit: 'up3am',
  },
  drill: {
    at: 328,
    mins: 328,
    label: '5:30 AM',
    title: '5:30 AM — drill hour locked',
    body: 'Stop reading. Solve the 15, then log every miss by 6:30.',
    cta: 'Open the drill session',
    habit: null,
  },
  windDown: {
    at: 1225,
    mins: 1225,
    label: '8:25 PM',
    title: '8:25 PM — lights out in five',
    body: 'Phone off, bag packed. 6.5 hours of sleep before the alarm.',
    cta: 'Lights out — bank tonight',
    habit: 'lightsOut',
  },
};

export const reminderKeys = Object.keys(REMINDERS) as ReminderKey[];

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotifications(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/** Fire a system notification when allowed. Never throws — reminders are a courtesy. */
export function notify(title: string, body: string, tag: string): boolean {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  try {
    const n = new Notification(title, { body, tag, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', silent: false });
    window.setTimeout(() => n.close(), 18000);
    return true;
  } catch {
    return false;
  }
}

/** Is `mins` (minutes from midnight) inside its 40-minute reminder window right now? */
export function inWindow(now: Date, mins: number): boolean {
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= mins && cur < mins + 40;
}

/** Days since the plan started that a reminder is actually relevant (Mon–Thu engine). */
export function reminderApplies(key: ReminderKey, now: Date): boolean {
  const di = now.getDay();
  if (di === 0 || di === 6) return false;
  if (di === 5) return key === 'wake';
  return true;
}

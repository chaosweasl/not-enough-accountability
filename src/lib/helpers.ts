import { BlockRule, WebsiteBlockRule } from "@/types";

export function isRuleActive(rule: BlockRule | WebsiteBlockRule): boolean {
  if (!rule.isActive) return false;

  const now = Date.now();

  if (rule.type === "permanent") {
    return true;
  }

  if (rule.type === "timer") {
    if (!rule.startTime || !rule.duration) return false;
    const endTime = rule.startTime + rule.duration * 60 * 1000;
    return now >= rule.startTime && now <= endTime;
  }

  if (rule.type === "schedule") {
    const currentDate = new Date();
    const currentDay = currentDate.getDay();
    const currentMinutes =
      currentDate.getHours() * 60 + currentDate.getMinutes();

    // Check if today is a blocked day
    if (!rule.days?.includes(currentDay)) return false;

    // Check if current time is within blocked hours
    if (
      rule.startHour !== undefined &&
      rule.startMinute !== undefined &&
      rule.endHour !== undefined &&
      rule.endMinute !== undefined
    ) {
      const startMinutes = rule.startHour * 60 + rule.startMinute;
      const endMinutes = rule.endHour * 60 + rule.endMinute;

      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
  }

  return false;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatTimeRange(
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number
): string {
  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const displayMinute = minute.toString().padStart(2, "0");
    return `${displayHour}:${displayMinute} ${period}`;
  };

  return `${formatTime(startHour, startMinute)} - ${formatTime(
    endHour,
    endMinute
  )}`;
}

export function getDayName(day: number): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[day];
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

import { Lead, LeadStatus } from '../hooks/useLeads';

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isDateOverdue(dateStr: string): boolean {
  return dateStr < getTodayDateString();
}

export function isDateToday(dateStr: string): boolean {
  return dateStr === getTodayDateString();
}

export function addDaysToDate(fromDate: string, days: number): string {
  const d = new Date(fromDate + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function entry(message: string, daysAgo = 0): { id: string; date: string; message: string } {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return { id: crypto.randomUUID(), date: d.toISOString(), message };
}

export function getSeedLeads(): Lead[] {
  const today = getTodayDateString();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);

  const nextWeekDate = new Date();
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  const nextWeek = nextWeekDate.toISOString().slice(0, 10);

  return [
    {
      id: crypto.randomUUID(),
      name: "John Smith",
      phone: "555-0101",
      email: "john@example.com",
      service: "Brake pad replacement",
      source: "Walk-in",
      notes: "Dropped by yesterday, asked about pricing for front and rear pads on a 2018 Camry.",
      followUpDate: yesterday,
      status: "New",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      activity: [
        entry("Lead created", 2),
        entry("Note updated", 2),
      ],
    },
    {
      id: crypto.randomUUID(),
      name: "Sarah Chen",
      phone: "555-0102",
      service: "Deep house clean",
      source: "Referral",
      notes: "Referred by the Miller family. Needs a quote for a 3-bed 2-bath.",
      followUpDate: today,
      status: "Contacted",
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      activity: [
        entry("Lead created", 1),
        entry("Status changed to Contacted", 1),
      ],
    },
    {
      id: crypto.randomUUID(),
      name: "Marcus D.",
      phone: "555-0103",
      email: "marcus.d@example.com",
      service: "Driving lessons package",
      source: "Online",
      notes: "Wants to book a 10-lesson package for his son.",
      followUpDate: today,
      status: "Quote Sent",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date().toISOString(),
      activity: [
        entry("Lead created", 3),
        entry("Status changed to Contacted", 2),
        entry("Status changed to Quote Sent", 1),
        entry("Note updated", 1),
      ],
    },
    {
      id: crypto.randomUUID(),
      name: "Elena Rodriguez",
      phone: "555-0104",
      service: "Full detailing",
      source: "Social media",
      notes: "Saw our Instagram post about interior detailing.",
      followUpDate: tomorrow,
      status: "New",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activity: [
        entry("Lead created", 0),
      ],
    },
    {
      id: crypto.randomUUID(),
      name: "David Kim",
      phone: "555-0105",
      service: "Oil change and tire rotation",
      source: "Phone call",
      notes: "Regular customer.",
      followUpDate: nextWeek,
      status: "Won",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      activity: [
        entry("Lead created", 5),
        entry("Status changed to Contacted", 4),
        entry("Status changed to Quote Sent", 3),
        entry("Status changed to Won", 1),
      ],
    },
  ];
}

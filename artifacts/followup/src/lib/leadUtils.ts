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
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
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
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
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
      updatedAt: new Date().toISOString()
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
      updatedAt: new Date().toISOString()
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
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
    }
  ];
}

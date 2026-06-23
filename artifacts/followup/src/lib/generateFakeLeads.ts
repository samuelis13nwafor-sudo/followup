import { Lead, LeadStatus, LeadSource } from "../contexts/LeadsContext";
import { addDaysToDate } from "./leadUtils";

const FIRST_NAMES = [
  "James", "Maria", "Robert", "Linda", "Michael", "Barbara", "William", "Patricia",
  "David", "Jennifer", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah",
  "Charles", "Karen", "Christopher", "Lisa", "Daniel", "Nancy", "Matthew", "Betty",
  "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley", "Steven", "Dorothy",
  "Paul", "Kimberly", "Andrew", "Emily", "Joshua", "Donna", "Kenneth", "Michelle",
  "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa", "Timothy", "Deborah",
  "Ronald", "Stephanie",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen",
  "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera",
  "Campbell", "Mitchell", "Carter", "Roberts",
];

const SERVICES = [
  "Brake pad replacement",
  "Oil change and filter",
  "Tire rotation and balance",
  "Full vehicle inspection",
  "Engine diagnostic",
  "Air conditioning recharge",
  "Transmission service",
  "Battery replacement",
  "Windshield wiper replacement",
  "Wheel alignment",
  "Driving lesson — beginner package",
  "Driving lesson — highway session",
  "10-lesson driving package",
  "Theory test preparation",
  "House deep clean — 3 bed",
  "End of tenancy clean",
  "Office cleaning quote",
  "Carpet cleaning — living room",
  "Window cleaning — full house",
  "Oven cleaning service",
  "Haircut and beard trim",
  "Full barber service",
  "Hair colour and cut",
  "Kids haircut",
  "Fade and style",
  "Full body massage",
  "Deep tissue massage — 60 min",
  "Spray tan session",
  "Gel nail set",
  "Eyebrow threading",
];

const NOTES_POOL = [
  "Called to enquire about pricing. Seemed interested.",
  "Referred by a regular customer. Keen to book soon.",
  "Messaged via Instagram. Wants a quote.",
  "Walked in and asked about availability.",
  "Spoke briefly — said they'd call back.",
  "Sent a quote. Waiting on their decision.",
  "Left a voicemail. No response yet.",
  "Very interested, just needs to check with partner.",
  "Price was the main concern — offered a small discount.",
  "Repeat customer from last year.",
  "Said their car is making a noise — sounds urgent.",
  "Needs done before end of month.",
  "Asked about payment plans.",
  "Wants to book in for next week if possible.",
  "",
  "",
  "",
];

const SOURCES: LeadSource[] = [
  "Walk-in", "Referral", "Phone call", "Online", "Social media", "Other",
];

const STATUSES: LeadStatus[] = [
  "New", "New", "New",
  "Contacted", "Contacted",
  "Quote Sent",
  "Won",
  "Lost",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function phone(): string {
  const area = Math.floor(Math.random() * 900) + 100;
  const mid = Math.floor(Math.random() * 900) + 100;
  const end = Math.floor(Math.random() * 9000) + 1000;
  return `${area}-${mid}-${end}`;
}

function dateOffset(today: string, days: number): string {
  return addDaysToDate(today, days);
}

function followUpDate(today: string): string {
  const OFFSETS = [-7, -5, -3, -2, -1, -1, 0, 0, 0, 1, 1, 2, 3, 7, 14];
  return dateOffset(today, pick(OFFSETS));
}

function daysAgoISO(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function makeActivity(status: LeadStatus, daysAgo: number) {
  const entries = [
    { id: crypto.randomUUID(), date: daysAgoISO(daysAgo), message: "Lead created" },
  ];
  if (status === "Contacted" || status === "Quote Sent" || status === "Won" || status === "Lost") {
    entries.push({ id: crypto.randomUUID(), date: daysAgoISO(Math.max(0, daysAgo - 1)), message: "Status changed to Contacted" });
  }
  if (status === "Quote Sent" || status === "Won" || status === "Lost") {
    entries.push({ id: crypto.randomUUID(), date: daysAgoISO(Math.max(0, daysAgo - 2)), message: "Status changed to Quote Sent" });
  }
  if (status === "Won") {
    entries.push({ id: crypto.randomUUID(), date: daysAgoISO(Math.max(0, daysAgo - 3)), message: "Status changed to Won" });
  }
  if (status === "Lost") {
    entries.push({ id: crypto.randomUUID(), date: daysAgoISO(Math.max(0, daysAgo - 3)), message: "Status changed to Lost" });
  }
  return entries;
}

export function generateFakeLeads(count: number, today: string): Lead[] {
  const leads: Lead[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name: string;
    let attempts = 0;
    do {
      name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      attempts++;
    } while (usedNames.has(name) && attempts < 20);
    usedNames.add(name);

    const status = pick(STATUSES);
    const daysAgo = Math.floor(Math.random() * 30) + 1;

    leads.push({
      id: crypto.randomUUID(),
      name,
      phone: phone(),
      email: Math.random() > 0.5
        ? `${name.split(" ")[0].toLowerCase()}@example.com`
        : undefined,
      service: pick(SERVICES),
      source: pick(SOURCES),
      notes: pick(NOTES_POOL),
      followUpDate: followUpDate(today),
      status,
      createdAt: daysAgoISO(daysAgo),
      updatedAt: daysAgoISO(Math.floor(daysAgo / 2)),
      activity: makeActivity(status, daysAgo),
    });
  }

  return leads;
}

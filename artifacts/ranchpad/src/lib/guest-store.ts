const GUEST_ANIMALS_KEY = "ranchpad_guest_animals";
const GUEST_PROMPT_KEY = "ranchpad_guest_prompt_dismissed";

export interface GuestAnimal {
  id: string;
  name: string;
  tagNumber: string | null;
  species: string;
  breed: string | null;
  sex: string;
  dateOfBirth: string | null;
  expectedDueDate: string | null;
  damId: null;
  sireId: null;
  notes: string | null;
  latestHealthSeverity: null;
  createdAt: string;
}

export function getGuestAnimals(): GuestAnimal[] {
  try {
    const raw = localStorage.getItem(GUEST_ANIMALS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GuestAnimal[];
  } catch {
    return [];
  }
}

export function addGuestAnimal(animal: Omit<GuestAnimal, "id" | "createdAt" | "latestHealthSeverity" | "damId" | "sireId">): GuestAnimal {
  const animals = getGuestAnimals();
  const newAnimal: GuestAnimal = {
    ...animal,
    damId: null,
    sireId: null,
    latestHealthSeverity: null,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(GUEST_ANIMALS_KEY, JSON.stringify([...animals, newAnimal]));
  return newAnimal;
}

export function updateGuestAnimal(id: string, updates: Partial<GuestAnimal>): void {
  const animals = getGuestAnimals().map(a => a.id === id ? { ...a, ...updates } : a);
  localStorage.setItem(GUEST_ANIMALS_KEY, JSON.stringify(animals));
}

export function deleteGuestAnimal(id: string): void {
  const animals = getGuestAnimals().filter(a => a.id !== id);
  localStorage.setItem(GUEST_ANIMALS_KEY, JSON.stringify(animals));
}

export function clearGuestAnimals(): void {
  localStorage.removeItem(GUEST_ANIMALS_KEY);
}

export function isGuestPromptDismissed(): boolean {
  return sessionStorage.getItem(GUEST_PROMPT_KEY) === "1";
}

export function dismissGuestPrompt(): void {
  sessionStorage.setItem(GUEST_PROMPT_KEY, "1");
}

export function clearGuestPromptDismissal(): void {
  sessionStorage.removeItem(GUEST_PROMPT_KEY);
}

// ─── Client-side CSV parser for guest mode ─────────────────────────────────

export function importCsvToGuestStore(csvText: string): { animalsCreated: number; skipped: { row: number; reason: string }[] } {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { animalsCreated: 0, skipped: [] };

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const dataLines = lines.slice(1);

  const skipped: { row: number; reason: string }[] = [];
  let animalsCreated = 0;
  const seenTags = new Set<string>();
  const existingAnimals = getGuestAnimals();
  const existingTags = new Set(existingAnimals.map(a => a.tagNumber).filter(Boolean) as string[]);

  for (let i = 0; i < dataLines.length; i++) {
    const row = i + 2;
    const values = dataLines[i].split(",").map(v => v.trim());
    const get = (key: string): string | null => {
      const idx = headers.indexOf(key);
      return idx >= 0 ? (values[idx] || null) : null;
    };

    const name = get("name");
    const species = get("species");

    if (!name || !species) {
      skipped.push({ row, reason: "Missing required field: name or species" });
      continue;
    }

    const tagNumber = get("tag_number");
    if (tagNumber) {
      if (existingTags.has(tagNumber)) {
        skipped.push({ row, reason: `Duplicate tag number "${tagNumber}" already exists in your herd` });
        continue;
      }
      if (seenTags.has(tagNumber)) {
        skipped.push({ row, reason: `Duplicate tag number "${tagNumber}" appears more than once in this file` });
        continue;
      }
      seenTags.add(tagNumber);
    }

    addGuestAnimal({
      name,
      tagNumber,
      species,
      breed: get("breed"),
      sex: get("sex") || "Unknown",
      dateOfBirth: get("date_of_birth"),
      expectedDueDate: null,
      notes: null,
    });
    animalsCreated++;
  }

  return { animalsCreated, skipped };
}

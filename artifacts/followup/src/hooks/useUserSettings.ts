import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export interface UserSettings {
  businessName: string;
  businessType: string;
  reminderTime: string;
}

const DEFAULT: UserSettings = {
  businessName: "",
  businessType: "",
  reminderTime: "09:00",
};

function localKey(uid: string) { return `followup_settings_${uid}`; }

function readLocal(uid: string): UserSettings {
  try {
    const raw = localStorage.getItem(localKey(uid));
    return raw ? { ...DEFAULT, ...(JSON.parse(raw) as Partial<UserSettings>) } : { ...DEFAULT };
  } catch { return { ...DEFAULT }; }
}

function writeLocal(uid: string, s: UserSettings) {
  localStorage.setItem(localKey(uid), JSON.stringify(s));
}

interface SupabaseRow {
  business_name: string;
  business_type: string;
  reminder_time: string;
}

export function useUserSettings(userId: string | null | undefined) {
  const [settings, setSettings] = useState<UserSettings>({ ...DEFAULT });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setIsLoaded(true); return; }

    if (supabaseConfigured) {
      void (supabase.from("user_settings") as unknown as {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => Promise<{ data: SupabaseRow | null; error: unknown }>;
          };
        };
      })
        .select("business_name, business_type, reminder_time")
        .eq("user_id", userId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && data) {
            const loaded: UserSettings = {
              businessName: data.business_name ?? "",
              businessType: data.business_type ?? "",
              reminderTime: data.reminder_time ?? "09:00",
            };
            setSettings(loaded);
            writeLocal(userId, loaded);
          } else {
            setSettings(readLocal(userId));
          }
          setIsLoaded(true);
        });
    } else {
      setSettings(readLocal(userId));
      setIsLoaded(true);
    }
  }, [userId]);

  const save = useCallback(async (next: UserSettings): Promise<boolean> => {
    if (!userId) return false;
    setIsSaving(true);
    setSaveError(null);

    writeLocal(userId, next);
    setSettings(next);

    if (supabaseConfigured) {
      const { error } = await (supabase.from("user_settings") as unknown as {
        upsert: (
          row: Record<string, unknown>,
          opts: { onConflict: string }
        ) => Promise<{ error: unknown }>;
      }).upsert(
        {
          user_id: userId,
          business_name: next.businessName,
          business_type: next.businessType,
          reminder_time: next.reminderTime,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      if (error) {
        setSaveError("Could not save to cloud. Changes saved locally.");
        setIsSaving(false);
        return false;
      }
    }

    setIsSaving(false);
    return true;
  }, [userId]);

  return { settings, isLoaded, isSaving, saveError, save, setSettings };
}

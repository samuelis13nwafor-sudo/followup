import { createContext, useContext, useState, useCallback, useEffect } from "react";

interface DevDateContextValue {
  devModeEnabled: boolean;
  testDate: string;
  setDevModeEnabled: (enabled: boolean) => void;
  setTestDate: (date: string) => void;
  getToday: () => string;
}

const DevDateContext = createContext<DevDateContextValue | null>(null);

const STORAGE_KEY_ENABLED = "followup_devmode_enabled";
const STORAGE_KEY_DATE = "followup_devmode_date";

function getRealToday() {
  return new Date().toISOString().slice(0, 10);
}

export function DevDateProvider({ children }: { children: React.ReactNode }) {
  const [devModeEnabled, setDevModeEnabledState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_ENABLED) === "true";
  });

  const [testDate, setTestDateState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_DATE) || getRealToday();
  });

  const setDevModeEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem(STORAGE_KEY_ENABLED, String(enabled));
    setDevModeEnabledState(enabled);
  }, []);

  const setTestDate = useCallback((date: string) => {
    localStorage.setItem(STORAGE_KEY_DATE, date);
    setTestDateState(date);
  }, []);

  const getToday = useCallback((): string => {
    return devModeEnabled && testDate ? testDate : getRealToday();
  }, [devModeEnabled, testDate]);

  return (
    <DevDateContext.Provider value={{ devModeEnabled, testDate, setDevModeEnabled, setTestDate, getToday }}>
      {children}
    </DevDateContext.Provider>
  );
}

export function useDevDate() {
  const ctx = useContext(DevDateContext);
  if (!ctx) throw new Error("useDevDate must be used within DevDateProvider");
  return ctx;
}

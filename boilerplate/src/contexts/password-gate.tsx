import { createContext, useContext, useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

const PASSCODE = import.meta.env.VITE_GATE_CODE ?? "0000";
const STORAGE_KEY = "cipher-unlocked";

interface PasswordGateContextType {
  isUnlocked: boolean;
  lock: () => void;
}

const PasswordGateContext = createContext<PasswordGateContextType | undefined>(
  undefined
);

function PasswordGate({
  children,
  disabled = false,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return sessionStorage.getItem(STORAGE_KEY) === "true";
  });
  const [error, setError] = useState(false);
  const [value, setValue] = useState("");

  const handleComplete = (code: string) => {
    if (code === PASSCODE) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setValue("");
    }
  };

  const lock = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsUnlocked(false);
    setValue("");
  };

  if (disabled) {
    return (
      <PasswordGateContext.Provider value={{ isUnlocked: true, lock }}>
        {children}
      </PasswordGateContext.Provider>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-bold text-xl">Enter Passcode</h1>
          <p className="text-muted-foreground text-sm">
            Enter the 4-digit code to continue
          </p>
        </div>
        <InputOTP
          autoFocus
          maxLength={4}
          onChange={(v) => {
            setValue(v);
            setError(false);
          }}
          onComplete={handleComplete}
          value={value}
        >
          <InputOTPGroup>
            <InputOTPSlot
              aria-invalid={error}
              className={cn(error && "border-destructive")}
              index={0}
            />
            <InputOTPSlot
              aria-invalid={error}
              className={cn(error && "border-destructive")}
              index={1}
            />
            <InputOTPSlot
              aria-invalid={error}
              className={cn(error && "border-destructive")}
              index={2}
            />
            <InputOTPSlot
              aria-invalid={error}
              className={cn(error && "border-destructive")}
              index={3}
            />
          </InputOTPGroup>
        </InputOTP>
        {error && (
          <p className="text-destructive text-sm">Incorrect passcode</p>
        )}
      </div>
    );
  }

  return (
    <PasswordGateContext.Provider value={{ isUnlocked, lock }}>
      {children}
    </PasswordGateContext.Provider>
  );
}

function usePasswordGate() {
  const context = useContext(PasswordGateContext);
  if (context === undefined) {
    throw new Error("usePasswordGate must be used within a PasswordGate");
  }
  return context;
}

export { PasswordGate, usePasswordGate };

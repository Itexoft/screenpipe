// app/providers.tsx
"use client";
import { ChangelogDialogProvider } from "@/lib/hooks/use-changelog-dialog";
import { forwardRef } from "react";
import { store as SettingsStore } from "@/lib/hooks/use-settings";
import { profilesStore as ProfilesStore } from "@/lib/hooks/use-profiles";

export const Providers = forwardRef<
  HTMLDivElement,
  { children: React.ReactNode }
>(({ children }, ref) => {
  return (
    <SettingsStore.Provider>
      <ProfilesStore.Provider>
        <ChangelogDialogProvider>{children}</ChangelogDialogProvider>
      </ProfilesStore.Provider>
    </SettingsStore.Provider>
  );
});

Providers.displayName = "Providers";

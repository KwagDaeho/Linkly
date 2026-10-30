import { useEffect, useState } from "react";
import { migrateProfileInputs } from "@/domain/input";
import { normalizeTiltPanStreamFlags } from "@/domain/profile";
import * as tauri from "@/services/tauri";
import type { ButtonMeta, Profile, ProfileLoader } from "@/types";
export const useProfileLoader = (): ProfileLoader => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [catalog, setCatalog] = useState<ButtonMeta[]>([]);
  const [bootError, setBootError] = useState("");
  const refresh = async () => {
    try {
      const [loadedProfile, buttonCatalog] = await Promise.all([
        tauri.getProfile(),
        tauri.buttonCatalog(),
      ]);
      setProfile(loadedProfile);
      setCatalog(buttonCatalog);
      setBootError("");
      const normalizedProfile = normalizeTiltPanStreamFlags(
        migrateProfileInputs(loadedProfile),
      );
      if (normalizedProfile !== loadedProfile) {
        void tauri
          .saveProfile(normalizedProfile)
          .then(() => setProfile(normalizedProfile))
          .catch((error) => setBootError(String(error)));
      }
    } catch (error) {
      setBootError(String(error));
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  const persist = async (nextProfile: Profile): Promise<boolean> => {
    try {
      await tauri.saveProfile(nextProfile);
      setProfile(nextProfile);
      return true;
    } catch (error) {
      setBootError(String(error));
      return false;
    }
  };
  const mutateProfile = (applyPatch: (loadedProfile: Profile) => Profile) => {
    setProfile((current) => {
      if (current === null) {
        return null;
      }
      const next = applyPatch(current);
      void persist(next);
      return next;
    });
  };
  const lifecycle = {
    persist,
    setBootError,
    refresh,
  };
  return {
    profile,
    catalog,
    bootError,
    lifecycle,
    mutateProfile,
  };
};

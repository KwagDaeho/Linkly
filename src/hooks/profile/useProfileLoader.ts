import { useCallback, useEffect, useState } from "react";
import { migrateProfileInputs } from "@/domain/input";
import { normalizeTiltPanStreamFlags } from "@/domain/profile";
import * as tauri from "@/services/tauri";
import type { ButtonMeta, Profile, ProfileLoader } from "@/types";

const BOOT_LOAD_TIMEOUT_MS = 25_000;

const withBootTimeout = <T>(promise: Promise<T>, label: string): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} (${BOOT_LOAD_TIMEOUT_MS / 1000}s)`));
    }, BOOT_LOAD_TIMEOUT_MS);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });

export const useProfileLoader = (): ProfileLoader => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [catalog, setCatalog] = useState<ButtonMeta[]>([]);
  const [bootError, setBootError] = useState("");
  const refresh = useCallback(async () => {
    setBootError("");
    try {
      const [loadedProfile, buttonCatalog] = await Promise.all([
        withBootTimeout(tauri.getProfile(), "getProfile"),
        withBootTimeout(tauri.buttonCatalog(), "buttonCatalog"),
      ]);
      const normalizedProfile = normalizeTiltPanStreamFlags(
        migrateProfileInputs(loadedProfile),
      );
      setProfile(loadedProfile);
      setCatalog(buttonCatalog);
      setBootError("");
      if (normalizedProfile !== loadedProfile) {
        void tauri
          .saveProfile(normalizedProfile)
          .then(() => setProfile(normalizedProfile))
          .catch((error) => setBootError(String(error)));
      }
    } catch (error) {
      setBootError(String(error));
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
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

import type { ProfileState } from "@/types";
import { useProfileLoader } from "./useProfileLoader";
import { useProfileMutations } from "./useProfileMutations";

export const useProfileState = (): ProfileState => {
  const { profile, catalog, bootError, lifecycle, mutateProfile } =
    useProfileLoader();
  const mutations = useProfileMutations(profile, mutateProfile, lifecycle.persist);
  return {
    profile,
    catalog,
    bootError,
    lifecycle,
    ...mutations,
    mutateProfile,
  };
};

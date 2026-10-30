import type { ProfileState } from "@/types";
import { useProfileLoader } from "./useProfileLoader";
import { useProfileMutations } from "./useProfileMutations";

export const useProfileState = (): ProfileState => {
  const { profile, catalog, bootError, lifecycle, mutateProfile } =
    useProfileLoader();
  const {
    mappings,
    buttonMappings,
    customMappings,
    pointer,
    ballScroll,
    catalogSelection,
  } = useProfileMutations(profile, mutateProfile, lifecycle.persist);
  return {
    profile,
    catalog,
    bootError,
    lifecycle,
    mappings,
    buttonMappings,
    customMappings,
    pointer,
    ballScroll,
    catalogSelection,
  };
};

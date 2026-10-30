import { createContext, useContext, type ReactNode } from "react";

import type { TriggerScope } from "@/domain/profile/triggerScope";
import { useTriggerScopeMutations } from "@/hooks/trigger/useTriggerScopeMutations";

const TriggerScopeContext = createContext<TriggerScope>({ kind: "common" });

export const TriggerScopeProvider = ({
  scope,
  children,
}: {
  scope: TriggerScope;
  children: ReactNode;
}) => (
  <TriggerScopeContext.Provider value={scope}>
    {children}
  </TriggerScopeContext.Provider>
);

export const useTriggerScope = (): TriggerScope =>
  useContext(TriggerScopeContext);

export const useScopedTriggerApi = () => {
  const scope = useTriggerScope();
  return useTriggerScopeMutations(scope);
};

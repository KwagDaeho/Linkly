/** Replace `{name}` placeholders in a locale string. */
export const fillTemplate = (
  template: string,
  vars: Record<string, string>,
): string =>
  Object.entries(vars).reduce(
    (text, [name, value]) => text.replace(`{${name}}`, value),
    template,
  );

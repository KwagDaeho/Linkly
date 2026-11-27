export type InputEventLine = {
  tsMs: number;
  source: "os" | "hid" | string;
  kind: string;
  summary: string;
  detail: string;
  /** Physical device the input came from ("Linkly" = injected by Linkly), if known. */
  device?: string;
};

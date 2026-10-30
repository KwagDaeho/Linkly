export type InputEventLine = {
  tsMs: number;
  source: "os" | "hid" | string;
  kind: string;
  summary: string;
  detail: string;
};

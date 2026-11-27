export const formatSpeedPair = (mult: number, base: number): string => {
  return `(${mult.toFixed(2)}×, ${Math.round(base * mult)})`;
};
export const hexPid = (id: number) => {
  return `0x${id.toString(16).toUpperCase().padStart(4, "0")}`;
};

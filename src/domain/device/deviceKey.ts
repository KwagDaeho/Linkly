export const deviceKeyFromIds = (
  vendorId: number,
  productId: number,
): string => `${vendorId}-${productId}`;

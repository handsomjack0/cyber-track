
/**
 * Calculate the number of days remaining until the target date.
 * Returns 9999 if no date is provided (treated as lifetime/infinite).
 */
export const getDaysRemaining = (expiryDate?: string | null): number => {
  if (!expiryDate) return 9999; 
  const today = new Date();
  const target = new Date(expiryDate);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

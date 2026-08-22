/**
 * Centralized Price and Currency formatting utilities for Radio Doble C Store.
 */

/**
 * Safely parses any price representation (e.g. "S/.129.90", "129,90", "$50.00", 129.9) into a number.
 */
export const parsePrice = (priceVal: string | number | undefined | null): number => {
  if (priceVal === undefined || priceVal === null || priceVal === "") return 0;
  if (typeof priceVal === "number") return isNaN(priceVal) ? 0 : priceVal;

  // Replace comma with period for decimal handling ("129,90" -> "129.90")
  let str = priceVal.toString().replace(",", ".");

  // Remove leading non-digit characters (e.g., "S/.", "S/", "$", " ")
  str = str.replace(/^[^0-9]*/, "").trim();

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

/**
 * Formats any price input into a clean, uniform Peruvian Soles display string (e.g. "S/. 129.90").
 */
export const formatPrice = (priceVal: string | number | undefined | null): string => {
  const num = parsePrice(priceVal);
  return `S/. ${num.toFixed(2)}`;
};

/**
 * Sanitizes user input in price fields to allow only digits and at most one decimal separator (period or comma).
 */
export const sanitizePriceInput = (val: string): string => {
  // Allow only digits, periods and commas
  let clean = val.replace(/[^0-9.,]/g, "");
  
  // Replace comma with dot
  clean = clean.replace(",", ".");

  // Keep only the first dot
  const parts = clean.split(".");
  if (parts.length > 2) {
    clean = parts[0] + "." + parts.slice(1).join("");
  }

  return clean;
};

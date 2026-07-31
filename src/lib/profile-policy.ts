export const JAMLY_FOUNDER_EMAIL = "koraykurt.vrdn@gmail.com";
export const JAMLY_FOUNDER_HEADLINE = "Founder of Jamly";

export function isJamlyFounderAccount(email: string | null | undefined) {
  return email?.trim().toLowerCase() === JAMLY_FOUNDER_EMAIL;
}

export function isReservedFounderHeadline(headline: string | null | undefined) {
  return headline?.trim().toLowerCase() === JAMLY_FOUNDER_HEADLINE.toLowerCase();
}

export function canUseProfileHeadline(
  headline: string | null | undefined,
  email: string | null | undefined
) {
  return !isReservedFounderHeadline(headline) || isJamlyFounderAccount(email);
}

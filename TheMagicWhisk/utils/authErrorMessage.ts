// Supabase returns generic/technical messages for auth errors. Map the ones users
// actually hit to plain language; anything unrecognized is shown as-is so it's
// never silently hidden.
const KNOWN_MESSAGES: Array<{ pattern: RegExp; friendly: string }> = [
  { pattern: /invalid login credentials/i, friendly: 'Wrong password or email.' },
  { pattern: /email not confirmed/i, friendly: 'Please verify your email before logging in.' },
  { pattern: /user not found/i, friendly: 'Wrong password or email.' },
];

export const getAuthErrorMessage = (
  error?: { message?: string } | null,
  fallback = 'Authentication failed'
): string => {
  const message = error?.message;

  if (!message) {
    return fallback;
  }

  const known = KNOWN_MESSAGES.find(({ pattern }) => pattern.test(message));
  return known ? known.friendly : message;
};

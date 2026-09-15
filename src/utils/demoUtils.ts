import { User } from '../types';

/**
 * Checks whether a given user is using a preloaded sample demo account.
 * Standard sample datasets (e.g. simulated classes, historical diagnostic reports,
 * sample sessions, preloaded XP/hours) are only shown for demo accounts.
 * New user-created accounts start clean with zero standard sample records.
 */
export function isDemoAccount(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.isDemo) return true;
  const email = (user.email || '').toLowerCase().trim();
  return (
    email === 'student@cognilearn.com' ||
    email === 'teacher@cognilearn.com' ||
    email.startsWith('demo-')
  );
}

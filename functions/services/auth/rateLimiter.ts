
import { Env, getDb } from '../../utils/storage';
import { authLogs } from '../../db/schema';
import { eq, lt } from 'drizzle-orm';

/**
 * Clean up old logs to keep DB size manageable
 */
async function cleanupOldLogs(db: any) {
  // Remove logs that are not blocked and haven't been touched in 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  try {
    // Drizzle doesn't support complex delete w/ where easily in all drivers, but let's try standard approach
    await db.delete(authLogs)
      .where(lt(authLogs.lastAttemptAt, oneDayAgo))
      .execute();
  } catch (e) {
    // Ignore cleanup errors to prevent blocking main flow
    console.warn('Auth log cleanup failed', e);
  }
}

export const checkRateLimit = async (env: Env, ip: string): Promise<{ blocked: boolean; message?: string }> => {
  const db = getDb(env);
  
  // 1. Get Log for IP
  const log = await db.select().from(authLogs).where(eq(authLogs.ip, ip)).get();

  if (!log) {
    return { blocked: false };
  }

  // 2. Check if Blocked
  if (log.blockedUntil && new Date() < log.blockedUntil) {
    const remainingSeconds = Math.ceil((log.blockedUntil.getTime() - Date.now()) / 1000);
    return { 
      blocked: true, 
      message: `Too many failed attempts. Please try again in ${remainingSeconds} seconds.` 
    };
  }

  return { blocked: false };
};

export const registerAttempt = async (env: Env, ip: string, success: boolean): Promise<void> => {
  const db = getDb(env);
  
  // 1. Get existing log
  const log = await db.select().from(authLogs).where(eq(authLogs.ip, ip)).get();
  
  const now = new Date();

  if (success) {
    // If success, reset counters (delete the record or reset to 0)
    if (log) {
      await db.delete(authLogs).where(eq(authLogs.ip, ip)).execute();
    }
    // Async cleanup
    cleanupOldLogs(db);
    return;
  }

  // Handle Failure Logic
  let newAttempts = 1;
  let blockedUntil = null;

  if (log) {
    // If blocked time has passed, treat as a fresh attempt (or keep counting depending on strictness)
    // Here we reset if the block has expired to be user friendly
    if (log.blockedUntil && new Date() > log.blockedUntil) {
       newAttempts = 1;
    } else {
       newAttempts = log.attempts + 1;
    }
  }

  // Determine Block Duration
  // 5 attempts = 15 mins block
  // 10 attempts = 1 hour block
  // 20 attempts = 24 hours block
  if (newAttempts >= 20) {
    blockedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  } else if (newAttempts >= 10) {
    blockedUntil = new Date(now.getTime() + 60 * 60 * 1000);
  } else if (newAttempts >= 5) {
    blockedUntil = new Date(now.getTime() + 15 * 60 * 1000);
  }

  // Upsert
  await db.insert(authLogs)
    .values({
      ip,
      attempts: newAttempts,
      lastAttemptAt: now,
      blockedUntil: blockedUntil
    })
    .onConflictDoUpdate({
      target: authLogs.ip,
      set: {
        attempts: newAttempts,
        lastAttemptAt: now,
        blockedUntil: blockedUntil
      }
    })
    .execute();
};

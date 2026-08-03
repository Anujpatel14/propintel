import { randomUUID } from 'crypto';
import { readdir, readFile, appendFile, mkdir } from 'fs/promises';
import path from 'path';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'REQUEST';
export type LogCategory = 'REQUEST' | 'ERROR' | 'AUTH' | 'DB' | 'ACTION' | 'SYSTEM';

export type LogEntryInput = {
  level: LogLevel;
  category: LogCategory;
  message: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  stack?: string | null;
  meta?: Record<string, unknown> | null;
  requestId?: string | null;
  dayKey?: string;
};

export type FileLogEntry = LogEntryInput & {
  id: string;
  dayKey: string;
  createdAt: string;
};

function dayKeyFrom(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function logsDir() {
  return path.join(process.cwd(), 'logs');
}

function serializeLine(entry: FileLogEntry) {
  return JSON.stringify(entry) + '\n';
}

/** Append JSON line to logs/YYYY-MM-DD.log only (never the database). */
async function writeDayFile(entry: FileLogEntry) {
  try {
    const dir = logsDir();
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${entry.dayKey}.log`);
    await appendFile(file, serializeLine(entry), 'utf8');
  } catch (err) {
    console.error('[logger] file write failed:', err);
  }
}

export async function writeLog(input: LogEntryInput): Promise<string> {
  const id = randomUUID();
  const dayKey = input.dayKey || dayKeyFrom();
  const createdAt = new Date().toISOString();
  const entry: FileLogEntry = { ...input, id, dayKey, createdAt };

  const prefix = `[${entry.level}][${entry.category}]`;
  if (entry.level === 'ERROR') {
    console.error(prefix, entry.message, entry.path || '', entry.stack || '');
  } else if (entry.level === 'WARN') {
    console.warn(prefix, entry.message);
  } else if (process.env.LOG_VERBOSE === '1' || entry.level === 'REQUEST') {
    console.info(prefix, entry.method || '', entry.path || '', entry.message);
  }

  await writeDayFile(entry);
  return id;
}

export function logInfo(message: string, meta?: Record<string, unknown>, category: LogCategory = 'SYSTEM') {
  return writeLog({ level: 'INFO', category, message, meta });
}

export function logWarn(message: string, meta?: Record<string, unknown>, category: LogCategory = 'SYSTEM') {
  return writeLog({ level: 'WARN', category, message, meta });
}

export function logError(message: string, error?: unknown, extra?: Partial<LogEntryInput>) {
  const err = error instanceof Error ? error : null;
  const stack = err?.stack || (typeof error === 'string' ? error : null);
  const detail =
    err?.message ||
    (error && typeof error === 'object' ? JSON.stringify(error) : String(error ?? ''));

  return writeLog({
    level: 'ERROR',
    category: extra?.category || 'ERROR',
    message: detail ? `${message}: ${detail}` : message,
    stack,
    meta: {
      ...(extra?.meta || {}),
      errorName: err?.name,
    },
    method: extra?.method,
    path: extra?.path,
    statusCode: extra?.statusCode,
    userId: extra?.userId,
    ip: extra?.ip,
    userAgent: extra?.userAgent,
    requestId: extra?.requestId,
    durationMs: extra?.durationMs,
  });
}

export function logRequest(input: {
  method: string;
  path: string;
  statusCode?: number;
  durationMs?: number;
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  meta?: Record<string, unknown>;
}) {
  return writeLog({
    level: 'REQUEST',
    category: 'REQUEST',
    message: `${input.method} ${input.path}${input.statusCode ? ` → ${input.statusCode}` : ''}`,
    method: input.method,
    path: input.path,
    statusCode: input.statusCode,
    durationMs: input.durationMs,
    userId: input.userId,
    ip: input.ip,
    userAgent: input.userAgent,
    requestId: input.requestId,
    meta: input.meta,
  });
}

export function withLoggedAction<TArgs extends unknown[], TResult>(
  actionName: string,
  fn: (...args: TArgs) => Promise<TResult>
) {
  return async (...args: TArgs): Promise<TResult> => {
    const started = Date.now();
    try {
      return await fn(...args);
    } catch (error) {
      await logError(`Action failed: ${actionName}`, error, {
        category: 'ACTION',
        path: actionName,
        durationMs: Date.now() - started,
      });
      throw error;
    }
  };
}

/** List available day log files under /logs */
export async function listLogDays(): Promise<Array<{ dayKey: string; count: number }>> {
  try {
    const dir = logsDir();
    const files = await readdir(dir);
    const days: Array<{ dayKey: string; count: number }> = [];

    for (const file of files) {
      if (!file.endsWith('.log')) continue;
      const dayKey = file.replace(/\.log$/, '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) continue;
      try {
        const raw = await readFile(path.join(dir, file), 'utf8');
        const count = raw.split('\n').filter((l) => l.trim()).length;
        days.push({ dayKey, count });
      } catch {
        days.push({ dayKey, count: 0 });
      }
    }

    return days.sort((a, b) => b.dayKey.localeCompare(a.dayKey));
  } catch {
    return [];
  }
}

/** Read and filter entries from logs/YYYY-MM-DD.log */
export async function readDayLogs(filters?: {
  dayKey?: string;
  level?: string;
  category?: string;
  search?: string;
  take?: number;
}): Promise<FileLogEntry[]> {
  const dayKey = filters?.dayKey || dayKeyFrom();
  const take = filters?.take ?? 250;

  try {
    const raw = await readFile(path.join(logsDir(), `${dayKey}.log`), 'utf8');
    const lines = raw.split('\n').filter((l) => l.trim());
    const entries: FileLogEntry[] = [];

    for (let i = lines.length - 1; i >= 0 && entries.length < take * 3; i--) {
      try {
        const parsed = JSON.parse(lines[i]) as FileLogEntry;
        if (filters?.level && filters.level !== 'all' && parsed.level !== filters.level) continue;
        if (filters?.category && filters.category !== 'all' && parsed.category !== filters.category) {
          continue;
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          const hay = [
            parsed.message,
            parsed.path,
            parsed.requestId,
            parsed.userId,
            parsed.method,
            parsed.stack,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) continue;
        }
        entries.push(parsed);
        if (entries.length >= take) break;
      } catch {
        // skip malformed lines
      }
    }

    return entries;
  } catch {
    return [];
  }
}

/**
 * Persist an audit / auth event to ActivityLog in the database.
 * Use for user-facing operations: LOGIN, CREATE_*, UPDATE_*, DELETE_*, etc.
 * Do NOT use for HTTP request traffic or stack traces — those go to files via writeLog.
 */
export async function recordAudit(input: {
  userId: string;
  action: string;
  details?: string;
}) {
  try {
    const { prisma, withDbRetry } = await import('@/lib/db');
    await withDbRetry(() =>
      prisma.activityLog.create({
        data: {
          userId: input.userId,
          action: input.action,
          details: input.details?.slice(0, 2000) || null,
        },
      })
    );
  } catch (err) {
    console.error('[logger] audit write failed:', err);
    // Also mirror to file so we don't lose the event if DB is down
    void writeLog({
      level: 'WARN',
      category: 'AUTH',
      message: `Audit fallback: ${input.action} for ${input.userId}`,
      userId: input.userId,
      meta: { details: input.details },
    });
  }
}

export { dayKeyFrom };

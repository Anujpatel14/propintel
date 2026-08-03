import { NextRequest, NextResponse } from 'next/server';
import { logError, logRequest, writeLog, type LogLevel, type LogCategory } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * Internal ingest for Edge middleware + client diagnostics.
 * Accepts a single log event or a batch.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = Array.isArray(body) ? body : [body];

    for (const event of events) {
      const level = (event.level || 'INFO') as LogLevel;
      const category = (event.category || 'SYSTEM') as LogCategory;

      if (category === 'REQUEST' || level === 'REQUEST') {
        await logRequest({
          method: event.method || 'GET',
          path: event.path || '/',
          statusCode: event.statusCode,
          durationMs: event.durationMs,
          userId: event.userId,
          ip: event.ip,
          userAgent: event.userAgent,
          requestId: event.requestId,
          meta: event.meta,
        });
      } else if (level === 'ERROR') {
        await logError(event.message || 'Unknown error', event.stack || event.error, {
          category,
          method: event.method,
          path: event.path,
          statusCode: event.statusCode,
          userId: event.userId,
          ip: event.ip,
          userAgent: event.userAgent,
          requestId: event.requestId,
          durationMs: event.durationMs,
          meta: event.meta,
        });
      } else {
        await writeLog({
          level,
          category,
          message: event.message || 'log',
          method: event.method,
          path: event.path,
          statusCode: event.statusCode,
          durationMs: event.durationMs,
          userId: event.userId,
          ip: event.ip,
          userAgent: event.userAgent,
          requestId: event.requestId,
          meta: event.meta,
          stack: event.stack,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/log] failed', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

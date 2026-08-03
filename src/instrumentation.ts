export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { logError, logInfo } = await import('@/lib/logger');

    await logInfo('PropIntel server instrumentation registered', {
      nodeEnv: process.env.NODE_ENV,
      runtime: 'nodejs',
    });

    process.on('uncaughtException', (err) => {
      void logError('Uncaught exception', err, { category: 'SYSTEM' });
    });

    process.on('unhandledRejection', (reason) => {
      void logError('Unhandled promise rejection', reason, { category: 'SYSTEM' });
    });
  }
}

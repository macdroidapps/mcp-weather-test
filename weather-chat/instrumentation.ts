/**
 * Next.js Instrumentation - выполняется при запуске сервера
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Инициализация только на сервере (не в edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Динамический импорт для серверного кода
    const { initScheduler } = await import('@/lib/scheduler/weather-cron');
    
    console.log('[Instrumentation] Initializing weather scheduler...');
    
    // Запускаем планировщик с небольшой задержкой, 
    // чтобы дать серверу полностью инициализироваться
    setTimeout(() => {
      initScheduler().catch(err => {
        console.error('[Instrumentation] Failed to initialize scheduler:', err);
      });
    }, 5000);
  }
}

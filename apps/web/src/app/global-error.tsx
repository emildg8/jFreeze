"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body className="flex min-h-screen items-center justify-center bg-slate-100 p-6 font-sans">
        <div className="max-w-md rounded-xl bg-white p-6 shadow-lg text-center">
          <h1 className="text-lg font-bold text-slate-900">jFreeze</h1>
          <p className="mt-2 text-sm text-slate-600">Критическая ошибка приложения</p>
          <button
            type="button"
            className="mt-4 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => reset()}
          >
            Перезагрузить
          </button>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-4 max-h-32 overflow-auto text-left text-xs text-red-700">
              {error.message}
            </pre>
          )}
        </div>
      </body>
    </html>
  );
}

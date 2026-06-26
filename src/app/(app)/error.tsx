"use client";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center animate-fade-in">
      <p className="text-lg font-bold text-brand mb-2">حدث خطأ في تحميل الصفحة</p>
      <p className="text-sm text-gray-400 mb-6 max-w-sm leading-relaxed">
        قد يكون التطبيق يحتاج تحديث بعد الرفع على السيرفر. اضغط إعادة التحميل.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex-1 min-h-[48px] rounded-2xl bg-accent text-white font-semibold shadow-md shadow-accent/25"
        >
          إعادة التحميل
        </button>
        <a
          href="/dashboard"
          className="flex-1 min-h-[48px] rounded-2xl border border-border bg-white text-brand font-semibold flex items-center justify-center"
        >
          الرئيسية
        </a>
      </div>
      <button
        type="button"
        onClick={reset}
        className="mt-4 text-xs text-gray-400 underline"
      >
        Try again
      </button>
    </div>
  );
}

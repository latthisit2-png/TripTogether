'use client';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
      <span className="text-red-500 text-xl flex-shrink-0">⚠️</span>
      <div className="flex-1">
        <p className="text-red-700 text-sm">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm text-red-600 underline hover:no-underline"
          >
            ลองใหม่
          </button>
        )}
      </div>
    </div>
  );
}

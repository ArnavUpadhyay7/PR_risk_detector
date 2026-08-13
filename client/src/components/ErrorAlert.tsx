interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className="mt-8 w-full max-w-2xl mx-auto rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-300"
    >
      {message}
    </div>
  );
}

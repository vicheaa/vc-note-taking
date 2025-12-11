import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-slate-200 border-t-slate-600",
          sizeClasses[size]
        )}
      />
      {text && (
        <p className="text-sm text-slate-500 animate-pulse">{text}</p>
      )}
    </div>
  );
}

interface LoadingPageProps {
  text?: string;
}

export function LoadingPage({ text = "Loading..." }: LoadingPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

interface LoadingContentProps {
  text?: string;
}

export function LoadingContent({ text = "Loading..." }: LoadingContentProps) {
  return (
    <div className="flex justify-center py-20">
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}

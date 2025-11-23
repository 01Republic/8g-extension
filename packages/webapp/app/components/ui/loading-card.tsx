import { cn } from "~/lib/utils";

interface LoadingCardProps extends React.ComponentProps<"div"> {
  message?: string;
  icon?: React.ReactNode;
  center?: boolean;
}

export function LoadingCard({
  message,
  icon,
  className,
  center = true,
  ...props
}: LoadingCardProps) {
  return (
    <div
      className={cn(
        "p-4 border rounded-lg text-gray-700 min-h-[56px]",
        center
          ? "flex items-center justify-center gap-2"
          : "flex items-center gap-2",
        className,
      )}
      {...props}
    >
      {icon}
      {message && <span className="text-sm">{message}</span>}
    </div>
  );
}

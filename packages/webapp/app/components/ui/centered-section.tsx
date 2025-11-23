import { cn } from "~/lib/utils";

interface CenteredSectionProps extends React.ComponentProps<"div"> {}

export function CenteredSection({
  className,
  children,
  ...props
}: CenteredSectionProps) {
  return (
    <div
      className={cn("space-y-3 max-w-md mx-auto w-full", className)}
      {...props}
    >
      {children}
    </div>
  );
}

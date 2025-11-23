import * as React from "react";
import { cn } from "~/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex w-full min-w-0 rounded-md border border-gray-200 bg-transparent px-3 py-2 shadow-xs ",
        "placeholder:text-muted-foreground text-base",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:text-gray-900  file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "selection:bg-primary-bg dark:bg-input/30 transition-[color,box-shadow] outline-none md:text-sm",
        "focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-[2px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "[&:-webkit-autofill]:[box-shadow:inset_0_0_0_1000px_var(--color-primary-bg)]",
        "[&:-webkit-autofill]:[-webkit-text-fill-color:var(--color-gray-900)]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

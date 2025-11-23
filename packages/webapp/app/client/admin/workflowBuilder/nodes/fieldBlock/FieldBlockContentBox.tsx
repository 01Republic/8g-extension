import type { ReactNode } from "react";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

interface FieldBlockContentBoxProps {
  children: ReactNode;
  label?: string;
  location?: "top" | "center" | "bottom";
}

export const FieldBlockContentBox = (props: FieldBlockContentBoxProps) => {
  const { children, label, location = "center" } = props;
  return (
    <section
      className={cn("flex gap-2 ", {
        "items-start": location === "top",
        "items-center": location === "center",
        "items-end": location === "bottom",
      })}
    >
      <span className="whitespace-nowrap w-44 text-base shrink-0">{label}</span>
      {children}
    </section>
  );
};

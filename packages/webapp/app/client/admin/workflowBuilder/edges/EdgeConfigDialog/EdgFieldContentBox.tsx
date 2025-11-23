import type { ReactNode } from "react";
import { Label } from "~/components/ui/label";

interface EdgFieldContentBoxProps {
  label: string;
  children: ReactNode;
  helperText?: string;
}

export const EdgFieldContentBox = (props: EdgFieldContentBoxProps) => {
  const { label, children, helperText } = props;
  return (
    <Label className="flex items-center">
      <span className="w-30 shrink-0 text-gray-500">{label}</span>
      <div className="w-full space-y-1">
        {children}
        {helperText && (
          <span className="text-xs text-gray-400">{helperText}</span>
        )}
      </div>
    </Label>
  );
};

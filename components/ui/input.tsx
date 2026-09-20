import * as React from "react";
import {
  Input as InputPrimitive,
} from "@base-ui/react/input";
import { cn } from "cn";

function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        [
          "h-9 w-full min-w-0",
          "rounded-lg",
          "border border-input",
          "bg-background",
          "px-3 py-1.5",
          "text-sm",
          "text-foreground",
          "shadow-sm",
          "transition-colors",
          "outline-none",
          "placeholder:text-muted-foreground",
          "focus-visible:border-ring",
          "focus-visible:ring-2",
          "focus-visible:ring-ring/25",
          "disabled:pointer-events-none",
          "disabled:cursor-not-allowed",
          "disabled:bg-muted",
          "disabled:opacity-60",
          "aria-invalid:border-destructive",
          "aria-invalid:ring-2",
          "aria-invalid:ring-destructive/20",
          "dark:bg-input/20",
          "dark:disabled:bg-input/40",
        ].join(" "),
        className,
      )}
      {...props}
    />
  );
}

export { Input };
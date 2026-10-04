import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full resize-y rounded-lg border border-[#D0D5DD] bg-white px-3 py-2.5 text-sm text-[#101828] outline-none transition placeholder:text-[#98A2B3] focus:border-[#84ADFF] focus:ring-3 focus:ring-[#D1E9FF] disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold leading-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#E7F3FF] text-[#1877F2]",
        secondary: "border-transparent bg-[#F2F4F7] text-[#475467]",
        success: "border-transparent bg-[#ECFDF3] text-[#027A48]",
        warning: "border-transparent bg-[#FFFAEB] text-[#B54708]",
        destructive: "border-transparent bg-[#FEF3F2] text-[#B42318]",
        outline: "border-[#D0D5DD] bg-white text-[#475467]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

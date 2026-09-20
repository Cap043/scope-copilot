import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  cva,
  type VariantProps,
} from "class-variance-authority";
import { cn } from "cn";

const badgeVariants = cva(
  [
    "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center",
    "gap-1 overflow-hidden rounded-full",
    "border border-transparent px-2 py-0.5",
    "text-xs font-medium whitespace-nowrap",
    "transition-colors duration-150",
    "focus-visible:border-ring",
    "focus-visible:ring-2 focus-visible:ring-ring/30",
    "aria-invalid:border-destructive",
    "aria-invalid:ring-destructive/20",
    "dark:aria-invalid:ring-destructive/40",
    "[&>svg]:pointer-events-none",
    "[&>svg]:size-3!",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground [a]:hover:bg-primary/90",

        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",

        destructive:
          "border-destructive/10 bg-destructive/10 text-destructive [a]:hover:bg-destructive/15",

        outline:
          "border-border bg-background text-foreground [a]:hover:bg-muted",

        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground",

        link:
          "text-primary underline-offset-4 hover:underline",

        success:
          "border-success/15 bg-success/10 text-success [a]:hover:bg-success/15",

        warning:
          "border-warning/15 bg-warning/10 text-warning [a]:hover:bg-warning/15",

        info:
          "border-info/15 bg-info/10 text-info [a]:hover:bg-info/15",

        ai:
          "border-ai/15 bg-ai/10 text-ai [a]:hover:bg-ai/15",

        scopeInScope:
          "border-success/15 bg-success/10 text-success [a]:hover:bg-success/15",

        scopeCourtesy:
          "border-border bg-muted text-muted-foreground [a]:hover:bg-muted/80",

        scopeReview:
          "border-warning/15 bg-warning/10 text-warning [a]:hover:bg-warning/15",

        scopeMaterial:
          "border-scope-material/15 bg-scope-material/10 text-scope-material [a]:hover:bg-scope-material/15",

        scopeMajor:
          "border-scope-major/15 bg-scope-major/10 text-scope-major [a]:hover:bg-scope-major/15",
      },
    },

    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(
          badgeVariants({ variant }),
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
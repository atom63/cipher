import { ScrollableList } from "@/components/ui/scrollable-list";
import { cn } from "@/lib/utils";
import { CATEGORIES, type Category } from "./data/cards";

interface CardFilterProps {
  className?: string;
  onChange: (category: Category | null) => void;
  value: Category | null;
}

const filterButtonBase =
  "cursor-pointer shrink-0 rounded-full px-3 py-1 font-medium text-sm transition-colors";

export function CardFilter({ value, onChange, className }: CardFilterProps) {
  return (
    <ScrollableList className={className} wrapLayoutBreakpoint={640}>
      <button
        className={cn(
          filterButtonBase,
          value === null
            ? "bg-foreground text-background"
            : "bg-secondary text-secondary-foreground hover:bg-accent"
        )}
        onClick={() => onChange(null)}
        type="button"
      >
        All
      </button>
      {CATEGORIES.map((category) => (
        <button
          className={cn(
            filterButtonBase,
            value === category
              ? "bg-foreground text-background"
              : "bg-secondary text-secondary-foreground hover:bg-accent"
          )}
          key={category}
          onClick={() => onChange(category)}
          type="button"
        >
          {category}
        </button>
      ))}
    </ScrollableList>
  );
}

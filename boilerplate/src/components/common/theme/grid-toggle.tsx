import { Grid3x3 } from "lucide-react";
import { Toggle, ToggleHighlight, ToggleItem } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGrid } from "@/contexts/grid-context";

interface GridToggleProps {
  size?: number;
}

export function GridToggle({ size = 16 }: GridToggleProps) {
  const { showGrid, toggleGrid } = useGrid();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Toggle
            aria-label={showGrid ? "Hide grid" : "Show grid"}
            className="relative flex size-8 cursor-pointer items-center justify-center overflow-hidden rounded-sm"
            onPressedChange={toggleGrid}
            pressed={showGrid}
          />
        }
      >
        <ToggleHighlight className="rounded-sm bg-accent" />
        <ToggleItem>
          <Grid3x3
            className="relative z-10 transition-colors"
            size={size}
            style={{ opacity: showGrid ? 1 : 0.5 }}
          />
        </ToggleItem>
      </TooltipTrigger>
      <TooltipContent side="right">
        {showGrid ? "Hide grid" : "Show grid"}
      </TooltipContent>
    </Tooltip>
  );
}

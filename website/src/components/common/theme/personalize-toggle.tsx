import { Dices, Palette, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BRAND_OPTIONS,
  SURFACE_OPTIONS,
  usePersonalization,
  type BrandId,
  type SurfaceId,
} from "@/contexts/personalization-context";
import { useTheme } from "@/contexts/theme-context";

function Swatch({
  active,
  cssVar,
  label,
  onClick,
}: {
  active: boolean;
  cssVar: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className="group relative size-7 shrink-0 cursor-pointer rounded-full border-2 transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onClick}
      style={{
        backgroundColor: `var(${cssVar})`,
        borderColor: active ? "var(--foreground)" : "transparent",
      }}
      title={label}
      type="button"
    >
      {active && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="size-2 rounded-full bg-foreground" />
        </span>
      )}
    </button>
  );
}

interface PersonalizeToggleProps {
  size?: "icon" | "icon-xs" | "icon-sm" | "icon-lg";
}

function pickRandom<T>(arr: readonly T[], exclude: T): T {
  const others = arr.filter((v) => v !== exclude);
  return others[Math.floor(Math.random() * others.length)];
}

export function PersonalizeToggle({ size = "icon" }: PersonalizeToggleProps) {
  const { brand, surfaceLight, surfaceDark, dirty, reset, setBrand, setSurfaceLight, setSurfaceDark } =
    usePersonalization();
  const { isDark } = useTheme();

  const shuffle = () => {
    setBrand(pickRandom(BRAND_OPTIONS, brand));
    setSurfaceLight(pickRandom(SURFACE_OPTIONS, surfaceLight));
    setSurfaceDark(pickRandom(SURFACE_OPTIONS, surfaceDark));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button aria-label="Personalize" size={size} variant="ghost">
          <Palette className="size-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-56 space-y-4 p-3" side="bottom" sideOffset={8}>
        {/* Brand color */}
        <div className="space-y-1.5">
          <span className="text-muted-foreground text-xs font-medium">Primary</span>
          <div className="flex gap-2">
            {BRAND_OPTIONS.map((id) => (
              <Swatch
                active={brand === id}
                cssVar={`--color-${id}-500`}
                key={id}
                label={id}
                onClick={() => setBrand(id as BrandId)}
              />
            ))}
          </div>
        </div>

        {/* Surface — show the active mode, control both */}
        <div className="space-y-1.5">
          <span className="text-muted-foreground text-xs font-medium">
            Surface {isDark ? "(dark)" : "(light)"}
          </span>
          <div className="flex gap-2">
            {SURFACE_OPTIONS.map((id) => (
              <Swatch
                active={isDark ? surfaceDark === id : surfaceLight === id}
                cssVar={`--color-${id}-${isDark ? "dark" : "light"}-6`}
                key={id}
                label={id}
                onClick={() => (isDark ? setSurfaceDark : setSurfaceLight)(id as SurfaceId)}
              />
            ))}
          </div>
        </div>
        {/* Actions */}
        <div className="flex gap-2">
          {dirty && (
            <Button className="flex-1" onClick={reset} size="sm" variant="ghost">
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          )}
          <Button className="flex-1" onClick={shuffle} size="sm" variant="outline">
            <Dices className="size-3.5" />
            Shuffle
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

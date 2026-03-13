const radiusTokens = [
  { name: "radius", label: "base", cssVar: "--radius", defaultValue: "4px" },
  { name: "2xs", label: "2xs", cssVar: "--radius-2xs", defaultValue: "2px" },
  { name: "xs", label: "xs", cssVar: "--radius-xs", defaultValue: "4px" },
  { name: "sm", label: "sm", cssVar: "--radius-sm", defaultValue: "6px" },
  { name: "md", label: "md", cssVar: "--radius-md", defaultValue: "8px" },
  { name: "lg", label: "lg", cssVar: "--radius-lg", defaultValue: "10px" },
  { name: "xl", label: "xl", cssVar: "--radius-xl", defaultValue: "14px" },
  { name: "2xl", label: "2xl", cssVar: "--radius-2xl", defaultValue: "18px" },
  { name: "3xl", label: "3xl", cssVar: "--radius-3xl", defaultValue: "22px" },
  { name: "4xl", label: "4xl", cssVar: "--radius-4xl", defaultValue: "26px" },
  {
    name: "full",
    label: "full",
    cssVar: "--radius-full",
    defaultValue: "9999px",
  },
] as const;

export function RadiusScale() {
  return (
    <div className="flex flex-wrap gap-6">
      {radiusTokens.map((token) => (
        <div className="flex flex-col items-center gap-2" key={token.name}>
          <div
            className="size-20 border-2 border-foreground/15 bg-foreground/5"
            style={{ borderRadius: `var(${token.cssVar})` }}
          />
          <span className="font-medium font-mono text-foreground text-xs">
            {token.label}
          </span>
          <span className="font-mono text-muted-foreground text-xs">
            {token.defaultValue}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Slide Templates — high-level patterns composed from primitives.
 * Use for quick, consistent slides. Use primitives for custom layouts.
 */

import { Center, Columns, Row, Spacer, Stack } from "../primitives/layout";
import { Avatar, Image, Video } from "../primitives/media";
import {
  Body,
  Display,
  Headline,
  Label,
  Quote,
  Subtitle,
  Title,
} from "../primitives/typography";
import { Badge, Box, Divider, Item, List } from "../primitives/visual";

// --- Helpers ----------------------------------------------------------------

const VIDEO_EXT = /\.(webm|mp4|mov|ogg)(\?|$)/i;

function MediaElement({
  mediaSrc,
  mediaAlt,
  mediaType,
  aspectRatio = "auto",
  fit = "cover",
}: {
  mediaSrc: string;
  mediaAlt: string;
  mediaType?: "image" | "video";
  aspectRatio?: "16/9" | "4/3" | "1" | "auto";
  fit?: "cover" | "contain";
}) {
  const isVideo = mediaType ? mediaType === "video" : VIDEO_EXT.test(mediaSrc);
  return isVideo ? (
    <Video aspectRatio={aspectRatio} fit={fit} src={mediaSrc} />
  ) : (
    <Image alt={mediaAlt} aspectRatio={aspectRatio} fit={fit} src={mediaSrc} />
  );
}

// =============================================================================
// COVER — bold opening. Title anchors bottom-left, image fills right column.
// =============================================================================

export function CoverSlide({
  label,
  title,
  subtitle,
  badges,
  imageSrc,
  imageAlt = "Cover",
  font = "sans",
  italic = false,
}: {
  label?: string;
  title: string;
  subtitle?: string;
  badges?: string[];
  imageSrc?: string;
  imageAlt?: string;
  font?: "sans" | "serif";
  italic?: boolean;
}) {
  const text = (
    <Stack className="flex-1 min-h-0" gap="none" justify="end">
      {label && (
        <>
          <Label>{label}</Label>
          <Spacer size="lg" />
        </>
      )}
      <Display size="lg" font={font} italic={italic}>{title}</Display>
      {subtitle && (
        <>
          <Spacer size="md" />
          <Body size="lg" color="secondary">{subtitle}</Body>
        </>
      )}
      {badges && badges.length > 0 && (
        <>
          <Spacer size="xl" />
          <Row gap="sm" wrap>
            {badges.map((b) => (
              <Badge key={b} variant="accent">
                {b}
              </Badge>
            ))}
          </Row>
        </>
      )}
    </Stack>
  );

  if (imageSrc) {
    return (
      <div className="grid min-h-0 flex-1 grid-cols-[3fr_2fr] gap-16 *:min-h-0">
        {text}
        <div className="min-h-0 overflow-hidden rounded-2xl border border-border/20">
          <img
            alt={imageAlt}
            className="size-full object-cover"
            src={imageSrc}
          />
        </div>
      </div>
    );
  }

  return text;
}

// =============================================================================
// SPLIT — text + media side by side
// =============================================================================

type SplitRatio = "equal" | "wide-media" | "narrow-media";

interface SplitProps {
  label?: string;
  title: string;
  body?: string;
  bullets?: string[];
  mediaSrc: string;
  mediaAlt?: string;
  mediaType?: "image" | "video";
  aspectRatio?: "16/9" | "4/3" | "1" | "auto";
  fit?: "cover" | "contain";
  ratio?: SplitRatio;
}

function SplitTextColumn({
  label,
  title,
  body,
  bullets,
}: {
  label?: string;
  title: string;
  body?: string;
  bullets?: string[];
}) {
  return (
    <div className="flex min-h-0 flex-col justify-center">
      <Stack gap="none">
        {label && (
          <>
            <Label>{label}</Label>
            <Spacer size="sm" />
          </>
        )}
        <Title>{title}</Title>
        {body && (
          <>
            <Spacer size="md" />
            <Body>{body}</Body>
          </>
        )}
        {bullets && bullets.length > 0 && (
          <>
            <Spacer size="lg" />
            <List marker="dash">
              {bullets.map((b) => (
                <Item key={b}>{b}</Item>
              ))}
            </List>
          </>
        )}
      </Stack>
    </div>
  );
}

const splitGridMap: Record<SplitRatio, string> = {
  equal: "grid-cols-2",
  "wide-media": "grid-cols-[2fr_3fr]",
  "narrow-media": "grid-cols-[3fr_2fr]",
};

function SplitMediaColumn({
  mediaSrc,
  mediaAlt,
  mediaType,
  aspectRatio,
  fit,
}: {
  mediaSrc: string;
  mediaAlt: string;
  mediaType?: "image" | "video";
  aspectRatio: "16/9" | "4/3" | "1" | "auto";
  fit: "cover" | "contain";
}) {
  return (
    <div className="flex min-h-0 w-full items-center justify-center overflow-hidden rounded-2xl border border-border/15">
      <MediaElement
        aspectRatio={aspectRatio}
        fit={fit}
        mediaAlt={mediaAlt}
        mediaSrc={mediaSrc}
        mediaType={mediaType}
      />
    </div>
  );
}

export function SplitTextMedia({
  label,
  title,
  body,
  bullets,
  mediaSrc,
  mediaAlt = "Visual",
  mediaType,
  aspectRatio = "4/3",
  fit = "cover",
  ratio = "equal",
}: SplitProps) {
  return (
    <div className={`grid min-h-0 flex-1 gap-16 ${splitGridMap[ratio]} *:min-h-0`}>
      <SplitTextColumn body={body} bullets={bullets} label={label} title={title} />
      <SplitMediaColumn aspectRatio={aspectRatio} fit={fit} mediaAlt={mediaAlt} mediaSrc={mediaSrc} mediaType={mediaType} />
    </div>
  );
}

export function SplitMediaText({
  label,
  title,
  body,
  bullets,
  mediaSrc,
  mediaAlt = "Visual",
  mediaType,
  aspectRatio = "4/3",
  fit = "cover",
  ratio = "equal",
}: SplitProps) {
  const gridCols =
    ratio === "wide-media"
      ? "grid-cols-[3fr_2fr]"
      : ratio === "narrow-media"
        ? "grid-cols-[2fr_3fr]"
        : "grid-cols-2";
  return (
    <div className={`grid min-h-0 flex-1 gap-16 ${gridCols} *:min-h-0`}>
      <SplitMediaColumn aspectRatio={aspectRatio} fit={fit} mediaAlt={mediaAlt} mediaSrc={mediaSrc} mediaType={mediaType} />
      <SplitTextColumn body={body} bullets={bullets} label={label} title={title} />
    </div>
  );
}

// =============================================================================
// FULL BLEED — edge-to-edge media with gradient text overlay
// =============================================================================

export function FullBleedSlide({
  mediaSrc,
  mediaAlt = "Visual",
  mediaType,
  label,
  title,
}: {
  mediaSrc: string;
  mediaAlt?: string;
  mediaType?: "image" | "video";
  label?: string;
  title?: string;
}) {
  const isVideo = mediaType ? mediaType === "video" : VIDEO_EXT.test(mediaSrc);
  return (
    <div className="absolute inset-0 flex-1">
      {isVideo ? (
        <video
          autoPlay
          className="absolute inset-0 size-full object-cover"
          loop
          muted
          playsInline
        >
          <source src={mediaSrc} />
        </video>
      ) : (
        <img
          alt={mediaAlt}
          className="absolute inset-0 size-full object-cover"
          src={mediaSrc}
        />
      )}
      {(label ?? title) && (
        <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/80 via-black/40 to-transparent px-20 pt-40 pb-16">
          <Stack gap="xs">
            {label && (
              <span className="font-medium font-mono text-white/50 text-xl uppercase tracking-[0.12em]">
                {label}
              </span>
            )}
            {title && (
              <h2 className="font-semibold text-[44px] text-white leading-[1.1] tracking-[-0.02em]">
                {title}
              </h2>
            )}
          </Stack>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// STATS — big numbers in cards
// =============================================================================

interface StatItem {
  label: string;
  value: string;
  description?: string;
}

export function StatsSlide({
  label,
  title,
  stats,
}: {
  label?: string;
  title?: string;
  stats: StatItem[];
}) {
  const count = Math.min(stats.length, 4) as 2 | 3 | 4;
  return (
    <Stack className="flex-1" gap="xl" justify="center">
      {(label ?? title) && (
        <Stack gap="sm">
          {label && <Label>{label}</Label>}
          {title && <Title>{title}</Title>}
        </Stack>
      )}
      <Columns count={count} gap="lg">
        {stats.slice(0, 4).map((s) => (
          <Box
            className="flex flex-col items-center justify-center"
            key={s.label}
            padding="lg"
            variant="muted"
          >
            <Stack align="center" gap="md">
              <Display color="accent" size="md">
                {s.value}
              </Display>
              <Divider color="accent" />
              <Label color="secondary">{s.label}</Label>
              {s.description && (
                <Body align="center" size="sm" color="muted">
                  {s.description}
                </Body>
              )}
            </Stack>
          </Box>
        ))}
      </Columns>
    </Stack>
  );
}

// =============================================================================
// QUOTE — centered, large, with prominent decorative mark
// =============================================================================

export function QuoteSlide({
  quote,
  attribution,
}: {
  quote: string;
  attribution?: string;
}) {
  return (
    <Center>
      <Stack align="center" className="max-w-[1100px]" gap="xl">
        <Quote attribution={attribution}>{quote}</Quote>
      </Stack>
    </Center>
  );
}

// =============================================================================
// CONTENT — title + divider + body/bullets
// =============================================================================

export function ContentSlide({
  label,
  title,
  body,
  bullets,
  markerStyle = "dash",
}: {
  label?: string;
  title: string;
  body?: string;
  bullets?: string[];
  markerStyle?: "dash" | "number" | "bullet";
}) {
  return (
    <Stack className="min-h-0 flex-1" gap="none">
      <div className="shrink-0">
        <Stack gap="sm">
          {label && <Label>{label}</Label>}
          <Title>{title}</Title>
        </Stack>
        <Spacer size="md" />
        <Divider color="accent" />
        <Spacer size="lg" />
      </div>
      <div className="min-h-0 flex-1">
        <Stack gap="lg">
          {body && <Body>{body}</Body>}
          {bullets && bullets.length > 0 && (
            <List marker={markerStyle}>
              {bullets.map((b) => (
                <Item key={b}>{b}</Item>
              ))}
            </List>
          )}
        </Stack>
      </div>
    </Stack>
  );
}

// =============================================================================
// COMPARISON — two columns, accent wins visually
// =============================================================================

interface ComparisonColumn {
  title: string;
  items: string[];
  variant?: "outline" | "accent";
}

export function ComparisonSlide({
  label,
  title,
  left,
  right,
}: {
  label?: string;
  title?: string;
  left: ComparisonColumn;
  right: ComparisonColumn;
}) {
  const renderCol = (col: ComparisonColumn) => {
    const isAccent = col.variant === "accent";
    return (
      <Box
        className="flex min-h-0 flex-col"
        padding="lg"
        variant={isAccent ? "accent" : "outline"}
      >
        <div className="shrink-0">
          <Stack gap="md">
            <Subtitle color={isAccent ? "accent" : "secondary"}>
              {col.title}
            </Subtitle>
            <Divider color={isAccent ? "accent" : "muted"} />
          </Stack>
        </div>
        <Spacer size="md" />
        <div className="min-h-0 flex-1">
          <List
            gap="sm"
            marker={isAccent ? "bullet" : "dash"}
          >
            {col.items.map((item) => (
              <Item key={item}>{item}</Item>
            ))}
          </List>
        </div>
      </Box>
    );
  };

  return (
    <Stack className="flex-1" gap="lg">
      {(label ?? title) && (
        <Stack gap="sm">
          {label && <Label>{label}</Label>}
          {title && <Title>{title}</Title>}
        </Stack>
      )}
      <Columns count={2} gap="lg">
        {renderCol(left)}
        {renderCol(right)}
      </Columns>
    </Stack>
  );
}

// =============================================================================
// PROFILE
// =============================================================================

export function ProfileSlide({
  avatarSrc,
  name,
  role,
  badges,
}: {
  avatarSrc: string;
  name: string;
  role?: string;
  badges?: string[];
}) {
  return (
    <Center>
      <Stack align="center" gap="xl">
        <Avatar alt={name} size="xl" src={avatarSrc} />
        <Stack align="center" gap="sm">
          <Title align="center">{name}</Title>
          {role && (
            <Body align="center" color="muted">
              {role}
            </Body>
          )}
        </Stack>
        {badges && badges.length > 0 && (
          <Row gap="sm" wrap>
            {badges.map((b) => (
              <Badge key={b} variant="accent">
                {b}
              </Badge>
            ))}
          </Row>
        )}
      </Stack>
    </Center>
  );
}

// =============================================================================
// SECTION — big centered title with optional large number
// =============================================================================

export function SectionSlide({
  number,
  title,
  subtitle,
}: {
  number?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <Center>
      <Stack align="center" gap="none">
        {number && (
          <>
            <span className="font-light font-mono text-[160px] text-primary/12 leading-none tracking-[-0.04em]">
              {number}
            </span>
            <Spacer size="lg" />
          </>
        )}
        <Headline align="center">{title}</Headline>
        {subtitle && (
          <>
            <Spacer size="lg" />
            <Body align="center" color="muted" size="lg">
              {subtitle}
            </Body>
          </>
        )}
      </Stack>
    </Center>
  );
}

// =============================================================================
// CLOSING — cinematic ending with accent line and layered typography
// =============================================================================

export function ClosingSlide({
  title,
  subtitle,
  font = "sans",
  footerItems,
}: {
  title: string;
  subtitle?: string;
  font?: "sans" | "serif";
  footerItems?: Array<{ label: string; value: string } | string>;
}) {
  const items = footerItems?.map((f) =>
    typeof f === "string" ? { label: f, value: f } : f,
  );
  return (
    <Stack align="center" className="flex-1 relative" gap="none" justify="center">
      {/* Decorative accent line */}
      <div className="w-16 h-[3px] rounded-full bg-primary/40 mb-12" />

      <Display align="center" size="lg" font={font}>
        {title}
      </Display>

      {subtitle && (
        <>
          <Spacer size="xl" />
          <Body align="center" color="muted" size="lg">
            {subtitle}
          </Body>
        </>
      )}

      {items && items.length > 0 && (
        <>
          <Spacer size="2xl" />
          <div className="h-px w-24 bg-foreground/8" />
          <Spacer size="lg" />
          <Row gap="lg" justify="center" wrap>
            {items.map((i, idx) => (
              <span key={`${i.label}-${i.value}`} className="flex items-center gap-4">
                {idx > 0 && <span className="text-foreground/10">·</span>}
                <span className="font-medium font-mono text-foreground/30 text-lg uppercase tracking-[0.12em]">
                  {i.value}
                </span>
              </span>
            ))}
          </Row>
        </>
      )}
    </Stack>
  );
}

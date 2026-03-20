/**
 * Slide Templates — high-level patterns composed from primitives.
 * Use for quick, consistent slides. Use primitives for custom layouts.
 */

import type { ReactNode } from "react";
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
// COVER
// =============================================================================

export function CoverSlide({
  label,
  title,
  subtitle,
  badges,
  imageSrc,
  imageAlt = "Cover",
}: {
  label?: string;
  title: string;
  subtitle?: string;
  badges?: string[];
  imageSrc?: string;
  imageAlt?: string;
}) {
  const text = (
    <Stack className="flex-1 min-h-0" gap="none" justify="end">
      {label && (
        <>
          <Label>{label}</Label>
          <Spacer size="lg" />
        </>
      )}
      <Display size="lg">{title}</Display>
      {subtitle && (
        <>
          <Spacer size="lg" />
          <Body size="lg">{subtitle}</Body>
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
        <div className="min-h-0 overflow-hidden rounded-2xl">
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
// SPLIT
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
    <div
      className={`grid min-h-0 flex-1 gap-16 ${splitGridMap[ratio]} *:min-h-0`}
    >
      <SplitTextColumn
        body={body}
        bullets={bullets}
        label={label}
        title={title}
      />
      <div className="flex min-h-0 w-full items-center justify-center">
        <MediaElement
          aspectRatio={aspectRatio}
          fit={fit}
          mediaAlt={mediaAlt}
          mediaSrc={mediaSrc}
          mediaType={mediaType}
        />
      </div>
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
    <div
      className={`grid min-h-0 flex-1 gap-16 ${gridCols} *:min-h-0`}
    >
      <div className="flex min-h-0 w-full items-center justify-center">
        <MediaElement
          aspectRatio={aspectRatio}
          fit={fit}
          mediaAlt={mediaAlt}
          mediaSrc={mediaSrc}
          mediaType={mediaType}
        />
      </div>
      <SplitTextColumn
        body={body}
        bullets={bullets}
        label={label}
        title={title}
      />
    </div>
  );
}

// =============================================================================
// FULL BLEED
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
        <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/70 to-transparent px-16 pt-32 pb-14">
          <Stack gap="xs">
            {label && (
              <Label color="inherit">
                <span className="text-white/60">{label}</span>
              </Label>
            )}
            {title && (
              <Title color="inherit">
                <span className="text-white">{title}</span>
              </Title>
            )}
          </Stack>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// STATS
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
              <Label>{s.label}</Label>
              {s.description && (
                <Body align="center" size="sm">
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
// QUOTE
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
// CONTENT
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
// COMPARISON
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
  const renderCol = (col: ComparisonColumn) => (
    <Box
      className="flex min-h-0 flex-col"
      padding="lg"
      variant={col.variant ?? "outline"}
    >
      <div className="shrink-0">
        <Stack gap="md">
          <Subtitle color={col.variant === "accent" ? "accent" : "muted"}>
            {col.title}
          </Subtitle>
          <Divider color={col.variant === "accent" ? "accent" : "muted"} />
        </Stack>
      </div>
      <Spacer size="md" />
      <div className="min-h-0 flex-1">
        <List
          gap="sm"
          marker={col.variant === "accent" ? "bullet" : "dash"}
        >
          {col.items.map((item) => (
            <Item key={item}>{item}</Item>
          ))}
        </List>
      </div>
    </Box>
  );

  return (
    <Stack className="flex-1" gap="lg">
      {(label ?? title) && (
        <Stack gap="sm">
          {label && <Label>{label}</Label>}
          {title && <Title>{title}</Title>}
        </Stack>
      )}
      <Columns count={2} gap="xl">
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
// SECTION
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
            <span className="font-extralight font-mono text-[160px] text-primary/15 leading-none tracking-[-0.04em]">
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
// CLOSING
// =============================================================================

export function ClosingSlide({
  title,
  subtitle,
  footerItems,
}: {
  title: string;
  subtitle?: string;
  footerItems?: Array<{ label: string; value: string } | string>;
}) {
  const items = footerItems?.map((f) =>
    typeof f === "string" ? { label: f, value: f } : f,
  );
  return (
    <Stack align="center" className="flex-1" gap="none" justify="center">
      <Display align="center" size="lg">
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
          <Row gap="lg" justify="center" wrap>
            {items.map((i) => (
              <span
                className="font-medium font-mono text-muted-foreground/40 text-sm uppercase tracking-[0.15em]"
                key={`${i.label}-${i.value}`}
              >
                {i.value}
              </span>
            ))}
          </Row>
        </>
      )}
    </Stack>
  );
}

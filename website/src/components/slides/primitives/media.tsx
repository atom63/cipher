import type { ReactNode } from "react";

type ObjectFit = "cover" | "contain" | "fill";
type AspectRatio = "16/9" | "4/3" | "1" | "auto";

const aspectRatioClasses: Record<Exclude<AspectRatio, "auto">, string> = {
  "16/9": "aspect-video",
  "4/3": "aspect-[4/3]",
  "1": "aspect-square",
};

export function Image({
  src,
  alt,
  fit = "contain",
  rounded = true,
  aspectRatio,
  className,
}: {
  src: string;
  alt: string;
  fit?: ObjectFit;
  rounded?: boolean;
  aspectRatio?: AspectRatio;
  className?: string;
}) {
  const fitClasses: Record<ObjectFit, string> = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
  };

  const useFixedRatio = aspectRatio && aspectRatio !== "auto";
  const sizeClasses = useFixedRatio ? "size-full" : "max-h-full max-w-full";

  const img = (
    <img
      alt={alt}
      className={`${sizeClasses} ${fitClasses[fit]} ${rounded ? "rounded-xl" : ""} ${className ?? ""}`}
      height={800}
      src={src}
      width={1200}
    />
  );

  if (useFixedRatio) {
    return (
      <div
        className={`min-h-0 w-full overflow-hidden ${aspectRatioClasses[aspectRatio]} ${rounded ? "rounded-xl" : ""}`}
      >
        {img}
      </div>
    );
  }

  return img;
}

export function Video({
  src,
  fit = "contain",
  rounded = true,
  aspectRatio,
  autoPlay = true,
  loop = true,
  muted = true,
}: {
  src: string;
  fit?: ObjectFit;
  rounded?: boolean;
  aspectRatio?: AspectRatio;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
}) {
  const fitClasses: Record<ObjectFit, string> = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
  };

  const useFixedRatio = aspectRatio && aspectRatio !== "auto";
  const sizeClasses = useFixedRatio ? "size-full" : "max-h-full max-w-full";

  const video = (
    <video
      autoPlay={autoPlay}
      className={`${sizeClasses} ${fitClasses[fit]} ${rounded ? "rounded-xl" : ""}`}
      loop={loop}
      muted={muted}
      playsInline
    >
      <source src={src} />
    </video>
  );

  if (useFixedRatio) {
    return (
      <div
        className={`min-h-0 w-full overflow-hidden ${aspectRatioClasses[aspectRatio]} ${rounded ? "rounded-xl" : ""}`}
      >
        {video}
      </div>
    );
  }

  return video;
}

export function Avatar({
  src,
  alt,
  size = "md",
}: {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClasses = { sm: "size-16", md: "size-24", lg: "size-32", xl: "size-48" };
  return (
    <img
      alt={alt}
      className={`rounded-full object-cover ${sizeClasses[size]}`}
      height={192}
      src={src}
      width={192}
    />
  );
}

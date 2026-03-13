import { forwardRef, useState } from "react";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";

import { cn } from "@/lib/utils";
import { ChevronHandle } from "./custom-handles";

interface CompareProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Alt text for the after image
   */
  afterAlt?: string;
  /**
   * The second (right/bottom) image URL
   */
  afterImage: string;
  /**
   * Aspect ratio for the images (e.g., "16/9", "4/3", "1/1")
   */
  aspectRatio?: string;
  /**
   * Alt text for the before image
   */
  beforeAlt?: string;
  /**
   * The first (left/top) image URL
   */
  beforeImage: string;
  /**
   * Show border around the compare slider
   * @default true
   */
  bordered?: boolean;
  /**
   * Whether the slider position changes on hover
   * @default false
   */
  changePositionOnHover?: boolean;
  /**
   * Custom handle component
   */
  handle?: React.ReactNode;
  /**
   * Object fit for the images
   * @default "cover"
   */
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  /**
   * Callback when the position changes
   */
  onPositionChange?: (position: number) => void;
  /**
   * The position of the slider (0-100)
   * @default 50
   */
  position?: number;
  /**
   * Delay in milliseconds before resetting position
   * @default 500
   */
  resetDelay?: number;
  /**
   * Whether to reset position to center on mouse leave
   * @default false
   */
  resetOnLeave?: boolean;
  /**
   * CSS transition for smooth slider movement
   * @default "0.25s cubic-bezier(.17,.67,.83,.67)"
   */
  transition?: string;
  /**
   * Whether the slider should be vertical
   * @default false
   */
  vertical?: boolean;
}

const Compare = forwardRef<HTMLDivElement, CompareProps>(
  (
    {
      className,
      beforeImage,
      afterImage,
      beforeAlt = "Before",
      afterAlt = "After",
      position: controlledPosition,
      vertical = false,
      handle,
      aspectRatio,
      objectFit = "cover",
      onPositionChange,
      resetOnLeave = false,
      resetDelay = 500,
      transition = "0.25s cubic-bezier(.17,.67,.83,.67)",
      changePositionOnHover = false,
      bordered = true,
      ...props
    },
    ref
  ) => {
    const [internalPosition, setInternalPosition] = useState(50);
    const position = controlledPosition ?? internalPosition;

    const handlePositionChange = (newPosition: number) => {
      setInternalPosition(newPosition);
      onPositionChange?.(newPosition);
    };

    const handleMouseLeave = () => {
      if (resetOnLeave) {
        setTimeout(() => {
          setInternalPosition(50);
          onPositionChange?.(50);
        }, resetDelay);
      }
    };

    const aspectRatioStyle = aspectRatio ? { aspectRatio } : undefined;

    return (
      <div
        className={cn(
          "relative w-full overflow-hidden",
          bordered ? "rounded-lg border border-border" : "rounded-sm",
          className
        )}
        ref={ref}
        style={aspectRatioStyle}
        {...props}
        {...(resetOnLeave && { onMouseLeave: handleMouseLeave })}
      >
        <ReactCompareSlider
          changePositionOnHover={changePositionOnHover}
          handle={
            handle !== undefined ? (
              handle
            ) : (
              <ChevronHandle size="sm" vertical={vertical} />
            )
          }
          itemOne={
            <ReactCompareSliderImage
              alt={beforeAlt}
              src={beforeImage}
              style={{ objectFit }}
            />
          }
          itemTwo={
            <ReactCompareSliderImage
              alt={afterAlt}
              src={afterImage}
              style={{ objectFit }}
            />
          }
          onPositionChange={handlePositionChange}
          portrait={vertical}
          position={position}
          style={{ height: "100%", width: "100%" }}
          transition={transition}
        />
      </div>
    );
  }
);

Compare.displayName = "Compare";

export { Compare };
export type { CompareProps };

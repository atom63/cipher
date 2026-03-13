import { useState } from "react";
import { Compare } from "./compare";
import {
  BoldHandle,
  ChevronHandle,
  GlassHandle,
  MinimalHandle,
  RainbowHandle,
} from "./custom-handles";

/**
 * Basic usage example of the Compare component
 */
export function CompareExample() {
  return (
    <div className="space-y-8 p-8">
      {/* Basic usage */}
      <div>
        <h3 className="mb-4 font-semibold text-lg">Basic Compare</h3>
        <Compare
          afterAlt="Dark theme"
          afterImage="/images/featured/wip-dark.png"
          beforeAlt="Light theme"
          beforeImage="/images/featured/wip-light.png"
        />
      </div>

      {/* With aspect ratio */}
      <div>
        <h3 className="mb-4 font-semibold text-lg">With Aspect Ratio</h3>
        <Compare
          afterAlt="After"
          afterImage="/images/featured/wip-dark.png"
          aspectRatio="16/9"
          beforeAlt="Before"
          beforeImage="/images/featured/wip-light.png"
        />
      </div>

      {/* Vertical slider */}
      <div>
        <h3 className="mb-4 font-semibold text-lg">Vertical Slider</h3>
        <Compare
          afterAlt="After"
          afterImage="/images/featured/wip-dark.png"
          beforeAlt="Before"
          beforeImage="/images/featured/wip-light.png"
          vertical
        />
      </div>

      {/* With custom position */}
      <div>
        <h3 className="mb-4 font-semibold text-lg">Custom Starting Position</h3>
        <Compare
          afterAlt="After"
          afterImage="/images/featured/wip-dark.png"
          beforeAlt="Before"
          beforeImage="/images/featured/wip-light.png"
          position={75}
        />
      </div>

      {/* With position change handler */}
      <CompareWithPositionTracking />

      {/* With reset on mouse leave */}
      <div>
        <h3 className="mb-4 font-semibold text-lg">Reset on Mouse Leave</h3>
        <p className="mb-4 text-muted-foreground text-sm">
          Drag the slider, then move your mouse away - it will reset to center
          after 500ms
        </p>
        <Compare
          afterAlt="Dark theme"
          afterImage="/images/featured/wip-dark.png"
          beforeAlt="Light theme"
          beforeImage="/images/featured/wip-light.png"
          resetDelay={500}
          resetOnLeave
        />
      </div>

      {/* With change position on hover */}
      <div>
        <h3 className="mb-4 font-semibold text-lg">Change Position on Hover</h3>
        <p className="mb-4 text-muted-foreground text-sm">
          Hover over the image to change the slider position automatically
        </p>
        <Compare
          afterAlt="Dark theme"
          afterImage="/images/featured/wip-dark.png"
          beforeAlt="Light theme"
          beforeImage="/images/featured/wip-light.png"
          changePositionOnHover
        />
      </div>

      {/* Custom Handles */}
      <div className="space-y-6">
        <h2 className="font-bold text-xl">Custom Handles</h2>

        {/* Rainbow Handle */}
        <div>
          <h3 className="mb-4 font-semibold text-lg">Rainbow Handle</h3>
          <Compare
            afterAlt="Dark theme"
            afterImage="/images/featured/wip-dark.png"
            beforeAlt="Light theme"
            beforeImage="/images/featured/wip-light.png"
            handle={<RainbowHandle />}
          />
        </div>

        {/* Minimal Handle */}
        <div>
          <h3 className="mb-4 font-semibold text-lg">Minimal Handle</h3>
          <Compare
            afterAlt="Dark theme"
            afterImage="/images/featured/wip-dark.png"
            beforeAlt="Light theme"
            beforeImage="/images/featured/wip-light.png"
            handle={<MinimalHandle color="cyan" width="3px" />}
          />
        </div>

        {/* Glass Handle */}
        <div>
          <h3 className="mb-4 font-semibold text-lg">Glass Handle</h3>
          <Compare
            afterAlt="Dark theme"
            afterImage="/images/featured/wip-dark.png"
            beforeAlt="Light theme"
            beforeImage="/images/featured/wip-light.png"
            handle={<GlassHandle />}
          />
        </div>

        {/* Bold Handle */}
        <div>
          <h3 className="mb-4 font-semibold text-lg">Bold Handle</h3>
          <Compare
            afterAlt="Dark theme"
            afterImage="/images/featured/wip-dark.png"
            beforeAlt="Light theme"
            beforeImage="/images/featured/wip-light.png"
            handle={<BoldHandle color="#ef4444" />}
          />
        </div>

        {/* Chevron Handle */}
        <div>
          <h3 className="mb-4 font-semibold text-lg">Chevron Handle</h3>
          <Compare
            afterAlt="Dark theme"
            afterImage="/images/featured/wip-dark.png"
            beforeAlt="Light theme"
            beforeImage="/images/featured/wip-light.png"
            handle={<ChevronHandle />}
          />
        </div>
      </div>
    </div>
  );
}

function CompareWithPositionTracking() {
  const [position, setPosition] = useState(50);

  return (
    <div>
      <h3 className="mb-4 font-semibold text-lg">
        With Position Tracking: {position.toFixed(0)}%
      </h3>
      <Compare
        afterAlt="After"
        afterImage="/images/featured/wip-dark.png"
        beforeAlt="Before"
        beforeImage="/images/featured/wip-light.png"
        onPositionChange={setPosition}
        position={position}
      />
    </div>
  );
}

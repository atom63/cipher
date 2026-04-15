import { motion } from 'motion/react'
import { memo, useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useLazyMedia } from '@/hooks/use-lazy-media'
import { useIsMobile } from '@/hooks/use-mobile'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

// Module-level cache to track which images have been animated
// This persists across component re-renders, remounts, and even window minimize/restore
// Once an image fades in, it will never fade in again during the session
// This prevents annoying re-animations when changing window focus or restoring minimized windows
const animatedImagesCache = new Set<string>()

// Optional: Export function to clear cache if needed (e.g., on route change)
export const clearImageAnimationCache = () => animatedImagesCache.clear()

// Supported aspect ratios for the Image component
export type AspectRatio =
  | 'auto'
  | '1/1'
  | '4/3'
  | '3/4'
  | '16/9'
  | '9/16'
  | '2/3'
  | '3/2'
  | '5/4'
  | '21/9'
  | '9/21'

export interface ImageProps extends React.HTMLAttributes<HTMLDivElement> {
  alt?: string
  aspectRatio?: AspectRatio
  className?: string
  containerClassName?: string
  decoding?: 'async' | 'sync' | 'auto' // Image decoding hint for browser
  errorText?: string
  fallbackText?: string
  fetchPriority?: 'high' | 'low' | 'auto' // Fetch priority hint
  forceNoLazy?: boolean // Force disable lazy loading (for UI components)
  imageClassName?: string
  lazy?: boolean
  onLoad?: () => void // Callback when image loads successfully
  priority?: boolean // Disable lazy loading for above-the-fold images
  rootMargin?: string
  showSkeleton?: boolean
  skeletonClassName?: string
  src?: string
}

export const Image = ({
  src,
  alt,
  className,
  imageClassName,
  aspectRatio = '16/9',
  fallbackText = 'No image provided',
  errorText = 'Failed to load image',
  showSkeleton = true,
  skeletonClassName,
  containerClassName,
  lazy = true,
  rootMargin = '100px',
  priority = false,
  forceNoLazy = false,
  onLoad,
  decoding = 'async',
  fetchPriority = 'auto',
  ...props
}: ImageProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{
    width: number
    height: number
  } | null>(null)
  const isMobile = useIsMobile()
  const reducedMotion = useReducedMotion()

  // Use lazy loading only for MDX content, not UI components
  const shouldUseLazy = lazy && !priority && !forceNoLazy
  const { ref: lazyRef, shouldLoad } = useLazyMedia({
    rootMargin: shouldUseLazy ? rootMargin : '0px', // Reduce unnecessary triggering
    enabled: shouldUseLazy,
  })

  useEffect(() => {
    if (!src) {
      setHasError(true)
      setIsLoading(false)
      return
    }

    // Only load image if lazy loading is disabled or if it should load
    // Don't reset states if image is already loaded to prevent flashing
    if (!shouldUseLazy || shouldLoad) {
      if (imageSrc === src) {
        return // Already loaded this image
      }

      setIsLoading(true)
      setHasError(false)
      // Don't reset imageSrc to null to prevent flash

      const img = new window.Image()

      // Set decoding attribute for async image decoding
      if (decoding) {
        img.decoding = decoding
      }

      // Set fetchpriority for resource prioritization (Chrome/Edge)
      if (fetchPriority && 'fetchPriority' in img) {
        ;(img as HTMLImageElement & { fetchPriority: string }).fetchPriority = fetchPriority
      }

      // Use decode() API for better performance (non-blocking)
      const loadImage = () => {
        if ('decode' in img && decoding === 'async') {
          img
            .decode()
            .then(() => {
              setImageSrc(src)
              setImageDimensions({
                width: img.naturalWidth,
                height: img.naturalHeight,
              })
              setIsLoading(false)
              onLoad?.()
            })
            .catch(() => {
              // decode() failed, fall back to regular onload
              setImageSrc(src)
              setImageDimensions({
                width: img.naturalWidth,
                height: img.naturalHeight,
              })
              setIsLoading(false)
              onLoad?.()
            })
        } else {
          // Fallback for browsers without decode() or sync decoding
          img.onload = () => {
            setImageSrc(src)
            setImageDimensions({
              width: img.naturalWidth,
              height: img.naturalHeight,
            })
            setIsLoading(false)
            onLoad?.()
          }
        }
      }

      img.onerror = () => {
        setHasError(true)
        setIsLoading(false)
      }

      img.src = src
      loadImage()
    }
  }, [src, shouldUseLazy, shouldLoad, imageSrc, onLoad, decoding, fetchPriority])

  // Get aspect ratio class based on prop
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'auto': {
        // Use 4/3 as fallback while loading to prevent skeleton collapse
        // Once loaded, natural dimensions will be used via inline style
        if (isLoading && !imageDimensions) {
          return 'aspect-[4/3]'
        }
        return '' // No aspect ratio constraint - use natural dimensions
      }
      case '1/1': {
        return 'aspect-square'
      }
      case '4/3': {
        return 'aspect-[4/3]'
      }
      case '3/4': {
        return 'aspect-[3/4]'
      }
      case '16/9': {
        return 'aspect-video'
      }
      case '9/16': {
        return 'aspect-[9/16]'
      }
      case '2/3': {
        return 'aspect-[2/3]'
      }
      case '3/2': {
        return 'aspect-[3/2]'
      }
      case '5/4': {
        return 'aspect-[5/4]'
      }
      case '21/9': {
        return 'aspect-[21/9]'
      }
      case '9/21': {
        return 'aspect-[9/21]'
      }
      default: {
        return 'aspect-video'
      }
    }
  }

  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted p-8',
          getAspectRatioClass(),
          containerClassName,
          className
        )}
        {...props}
      >
        <span className="text-muted-foreground text-sm">{fallbackText}</span>
      </div>
    )
  }

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted p-8',
          getAspectRatioClass(),
          containerClassName,
          className
        )}
        {...props}
      >
        <span className="text-muted-foreground text-sm">{errorText}</span>
      </div>
    )
  }

  // Calculate inline aspect ratio style for 'auto' mode when dimensions are known
  const aspectRatioStyle =
    aspectRatio === 'auto' && imageDimensions
      ? { aspectRatio: `${imageDimensions.width} / ${imageDimensions.height}` }
      : undefined

  return (
    <div
      className={cn('relative', getAspectRatioClass(), className, containerClassName)}
      ref={shouldUseLazy ? lazyRef : undefined}
      style={aspectRatioStyle}
      {...props}
    >
      {isLoading && showSkeleton && (
        <Skeleton className={cn('absolute inset-0 h-full w-full', skeletonClassName)} />
      )}
      {imageSrc && (
        <ImageDisplay
          alt={alt}
          aspectRatio={aspectRatio}
          imageClassName={imageClassName}
          imageDimensions={imageDimensions}
          imageSrc={imageSrc}
          isMobile={isMobile}
          reducedMotion={reducedMotion}
        />
      )}
    </div>
  )
}

// Separate component to reduce complexity
interface ImageDisplayProps {
  alt?: string
  aspectRatio: AspectRatio
  imageClassName?: string
  imageDimensions: { width: number; height: number } | null
  imageSrc: string
  isMobile: boolean
  reducedMotion: boolean
}

const ImageDisplayComponent = ({
  imageSrc,
  alt,
  imageClassName,
  aspectRatio,
  imageDimensions,
  isMobile,
  reducedMotion,
}: ImageDisplayProps) => {
  // Check if this image has already been animated using module-level cache
  const hasAnimatedBefore = animatedImagesCache.has(imageSrc)
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // If not animated before, mark it as animated after the animation duration
    if (!hasAnimatedBefore) {
      animationTimerRef.current = setTimeout(() => {
        animatedImagesCache.add(imageSrc)
      }, 500) // Match animation duration
    }

    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current)
      }
    }
  }, [imageSrc, hasAnimatedBefore])

  // Determine if we should skip animation
  // Skip if: already animated before, reduced motion enabled, or on mobile
  const skipAnimation = hasAnimatedBefore || reducedMotion || isMobile

  // For auto aspect ratio, use native img element for natural sizing
  if (aspectRatio === 'auto') {
    return skipAnimation ? (
      <img
        alt={alt || 'Image'}
        className={cn('h-auto w-full object-cover', imageClassName)}
        decoding="async"
        height={imageDimensions?.height}
        src={imageSrc}
        style={{ pointerEvents: 'none' }}
        width={imageDimensions?.width}
      />
    ) : (
      <motion.img
        alt={alt || 'Image'}
        animate={{ opacity: 1, scale: 1 }}
        className={cn('h-auto w-full object-cover', imageClassName)}
        decoding="async"
        height={imageDimensions?.height}
        initial={{ opacity: 0, scale: 1.02 }}
        src={imageSrc}
        style={{ pointerEvents: 'none' }}
        transition={{
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        width={imageDimensions?.width}
      />
    )
  }

  // For fixed aspect ratios, use background image approach
  return (
    <div aria-label={alt || 'Image'} className="absolute inset-0 overflow-hidden" role="img">
      {skipAnimation ? (
        // Static for mobile/reduced motion/already animated - no animation conflicts
        <div
          className={cn('absolute inset-0 bg-center bg-cover bg-no-repeat', imageClassName)}
          style={{
            backgroundImage: `url("${imageSrc}")`,
            pointerEvents: 'none',
          }}
        />
      ) : (
        // Framer Motion for desktop - but only animate on initial load
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className={cn('absolute inset-0 bg-center bg-cover bg-no-repeat', imageClassName)}
          initial={{ opacity: 0, scale: 1.02 }}
          style={{
            backgroundImage: `url("${imageSrc}")`,
            pointerEvents: 'none',
          }}
          transition={{
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      )}
    </div>
  )
}

// Memoize ImageDisplay to prevent re-renders when parent re-renders
const ImageDisplay = memo(ImageDisplayComponent, (prevProps, nextProps) => {
  // Only re-render if imageSrc actually changed
  return (
    prevProps.imageSrc === nextProps.imageSrc &&
    prevProps.aspectRatio === nextProps.aspectRatio &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.reducedMotion === nextProps.reducedMotion
  )
})

// Export a default version for easier imports
export default Image

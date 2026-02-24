import type { CSSProperties } from 'react'
import styles from './Skeleton.module.css'

// ============================================================================
// SKELETON BASE
// ============================================================================

export interface SkeletonProps {
  /** Width of skeleton (number = px, string = any CSS value) */
  width?: number | string
  /** Height of skeleton (number = px, string = any CSS value) */
  height?: number | string
  /** Border radius variant */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  /** Animation style */
  animation?: 'pulse' | 'shimmer' | 'none'
  className?: string
}

export function Skeleton({
  width,
  height,
  radius = 'md',
  animation = 'shimmer',
  className = '',
}: SkeletonProps) {
  const style: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div
      className={`${styles.skeleton} ${styles[radius]} ${styles[animation]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

// ============================================================================
// SKELETON PRESETS
// ============================================================================

/** Text line skeleton */
export function SkeletonText({
  lines = 1,
  className = '',
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={`${styles.textContainer} ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === lines - 1 && lines > 1 ? '70%' : '100%'}
          radius="sm"
        />
      ))}
    </div>
  )
}

/** Avatar/profile image skeleton */
export function SkeletonAvatar({
  size = 40,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      radius="full"
      className={className}
    />
  )
}

/** Card skeleton with header, content, footer */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.cardHeader}>
        <SkeletonAvatar size={32} />
        <div className={styles.cardHeaderText}>
          <Skeleton height={14} width={120} radius="sm" />
          <Skeleton height={10} width={80} radius="sm" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className={styles.cardFooter}>
        <Skeleton height={32} width={80} radius="md" />
        <Skeleton height={32} width={80} radius="md" />
      </div>
    </div>
  )
}

/** Table row skeleton */
export function SkeletonTableRow({
  columns = 4,
  className = '',
}: {
  columns?: number
  className?: string
}) {
  return (
    <div className={`${styles.tableRow} ${className}`}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          width={i === 0 ? '30%' : '20%'}
          radius="sm"
        />
      ))}
    </div>
  )
}

/** List item skeleton */
export function SkeletonListItem({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.listItem} ${className}`}>
      <Skeleton width={20} height={20} radius="sm" />
      <div className={styles.listItemContent}>
        <Skeleton height={14} width="60%" radius="sm" />
        <Skeleton height={10} width="40%" radius="sm" />
      </div>
      <Skeleton width={24} height={24} radius="sm" />
    </div>
  )
}

/** Token/variable row skeleton (specific to this plugin) */
export function SkeletonTokenRow({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.tokenRow} ${className}`}>
      <Skeleton width={16} height={16} radius="sm" />
      <Skeleton height={14} width="35%" radius="sm" />
      <Skeleton height={12} width="25%" radius="sm" />
      <Skeleton height={20} width={60} radius="md" />
    </div>
  )
}

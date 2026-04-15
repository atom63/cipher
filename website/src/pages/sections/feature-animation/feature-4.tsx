import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useTokenColors } from './use-token-color'
import { useVisible } from './use-visible'

type Phase = 'idle' | 'extract' | 'compile' | 'build' | 'done'

export function ModernCssAnimation() {
  const { ref, visible } = useVisible()
  const c = useTokenColors({
    primary: 'var(--color-b1-500)',
    info: 'var(--color-info-500)',
  })

  const [phase, setPhase] = useState<Phase>('idle')

  useEffect(() => {
    let mounted = true
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

    const run = async () => {
      while (mounted) {
        setPhase('idle')
        await sleep(1200)
        if (!mounted) {
          break
        }
        setPhase('extract')
        await sleep(900)
        if (!mounted) {
          break
        }
        setPhase('compile')
        await sleep(1200)
        if (!mounted) {
          break
        }
        setPhase('build')
        await sleep(900)
        if (!mounted) {
          break
        }
        setPhase('done')
        await sleep(2800)
        if (!mounted) {
          break
        }
      }
    }

    if (visible) {
      run()
    }
    return () => {
      mounted = false
    }
  }, [visible])

  const draw = { duration: 0.8, ease: 'easeInOut' as const }
  const fade = { duration: 0.4 }
  const isActive = phase === 'compile' || phase === 'build'
  const isDone = phase === 'done'

  return (
    <div className="relative size-full overflow-hidden" ref={ref}>
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          backgroundPosition: 'center',
        }}
      />

      <svg
        className="relative z-10 h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 400 240"
      >
        {/* LEFT: Design Tokens */}
        <rect
          fill="var(--card)"
          height="180"
          rx="12"
          stroke="var(--border)"
          strokeWidth="1.5"
          width="110"
          x="20"
          y="30"
        />
        <text fill="var(--foreground)" fontSize="12" fontWeight="600" x="36" y="54">
          Tokens
        </text>
        <path d="M 20 66 L 130 66" stroke="var(--border)" strokeWidth="1" />

        {/* Token rows */}
        <rect
          fill="var(--secondary)"
          height="24"
          rx="4"
          stroke="var(--border)"
          strokeWidth="1"
          width="94"
          x="28"
          y="83"
        />
        <circle cx="42" cy="95" fill="var(--primary)" r="5" />
        <text
          fill="var(--muted-foreground)"
          fontFamily="var(--font-family-mono)"
          fontSize="9"
          x="54"
          y="98"
        >
          color.brand
        </text>

        <rect
          fill="var(--secondary)"
          height="24"
          rx="4"
          stroke="var(--border)"
          strokeWidth="1"
          width="94"
          x="28"
          y="111"
        />
        <rect
          fill="none"
          height="10"
          rx="3"
          stroke="var(--foreground)"
          strokeWidth="1.5"
          width="10"
          x="37"
          y="118"
        />
        <text
          fill="var(--muted-foreground)"
          fontFamily="var(--font-family-mono)"
          fontSize="9"
          x="54"
          y="126"
        >
          radius.md
        </text>

        <rect
          fill="var(--secondary)"
          height="24"
          rx="4"
          stroke="var(--border)"
          strokeWidth="1"
          width="94"
          x="28"
          y="139"
        />
        <text
          fill="var(--foreground)"
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
          x="42"
          y="155"
        >
          Aa
        </text>
        <text
          fill="var(--muted-foreground)"
          fontFamily="var(--font-family-mono)"
          fontSize="9"
          x="54"
          y="154"
        >
          font.sans
        </text>

        {/* CENTER: Tailwind v4 */}
        <motion.rect
          animate={{
            strokeWidth: isActive ? 2 : 1,
            opacity: isActive ? 1 : 0.6,
          }}
          fill="var(--secondary)"
          height="85"
          initial={{ strokeWidth: 1, opacity: 0.6 }}
          rx="12"
          stroke={c.info}
          transition={fade}
          width="70"
          x="165"
          y="80"
        />

        <motion.g
          animate={{
            opacity: isActive || isDone ? 1 : 0,
            y: isActive || isDone ? 0 : 5,
          }}
          initial={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.4, delay: phase === 'compile' ? 0.2 : 0 }}
        >
          <text fill={c.info} fontFamily="var(--font-family-mono)" fontSize="9" x="172" y="100">
            @theme {'{'}
          </text>
          <text
            fill="var(--primary)"
            fontFamily="var(--font-family-mono)"
            fontSize="9"
            x="178"
            y="118"
          >
            --color
          </text>
          <text
            fill="var(--primary)"
            fontFamily="var(--font-family-mono)"
            fontSize="9"
            x="178"
            y="132"
          >
            --radius
          </text>
          <text fill={c.info} fontFamily="var(--font-family-mono)" fontSize="9" x="172" y="150">
            {'}'}
          </text>
        </motion.g>

        {/* RIGHT: shadcn/ui */}
        <rect
          fill="var(--card)"
          height="180"
          rx="12"
          stroke="var(--border)"
          strokeWidth="1.5"
          width="110"
          x="270"
          y="30"
        />
        <text fill="var(--foreground)" fontSize="12" fontWeight="600" x="286" y="54">
          shadcn/ui
        </text>
        <path d="M 270 66 L 380 66" stroke="var(--border)" strokeWidth="1" />

        {/* Card skeleton */}
        <motion.rect
          animate={{ rx: isDone ? 8 : 0 }}
          fill="var(--secondary)"
          height="105"
          initial={{ rx: 0 }}
          stroke="var(--border)"
          strokeWidth="1"
          transition={{ duration: 0.6, ease: 'easeOut' }}
          width="80"
          x="285"
          y="85"
        />
        <rect fill="var(--muted)" height="6" rx="2" width="40" x="295" y="100" />
        <rect fill="var(--border)" height="4" rx="2" width="60" x="295" y="112" />
        <rect fill="var(--border)" height="4" rx="2" width="50" x="295" y="120" />

        {/* Styled button */}
        <motion.rect
          animate={{
            rx: isDone ? 6 : 0,
            fill: isDone ? c.primary : 'var(--muted)',
          }}
          height="24"
          initial={{ rx: 0, fill: 'var(--muted)' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          width="60"
          x="295"
          y="145"
        />
        <text fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" x="325" y="160">
          Button
        </text>

        {/* Button glow — scales from button center */}
        <motion.rect
          animate={{
            opacity: isDone ? [0, 0.5, 0] : 0,
            scaleX: isDone ? 1.125 : 1,
            scaleY: isDone ? 1.35 : 1,
          }}
          fill="none"
          height="24"
          initial={{ opacity: 0, scaleX: 1, scaleY: 1 }}
          rx="6"
          stroke={c.primary}
          strokeWidth="2"
          style={{
            transformOrigin: '325px 157px',
            transformBox: 'fill-box' as never,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          width="60"
          x="295"
          y="145"
        />

        {/* DATA FLOW PATHS */}
        {/* L1: Color token → Tailwind */}
        <path
          d="M 130 95 C 147 95, 147 122, 165 122"
          fill="none"
          stroke="var(--border)"
          strokeDasharray="3 3"
          strokeWidth="1.5"
        />
        <motion.path
          animate={{
            pathLength: phase === 'extract' ? 1 : 0,
            opacity: phase === 'extract' ? [0, 1, 1, 0] : 0,
          }}
          d="M 130 95 C 147 95, 147 122, 165 122"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          stroke={c.primary}
          strokeLinecap="round"
          strokeWidth="2"
          transition={{
            pathLength: {
              duration: phase === 'extract' ? draw.duration : 0,
              ease: draw.ease,
            },
            opacity: {
              duration: phase === 'extract' ? draw.duration : 0,
              times: [0, 0.1, 0.8, 1],
            },
          }}
        />

        {/* L2: Radius token → Tailwind */}
        <path
          d="M 130 123 L 165 122"
          fill="none"
          stroke="var(--border)"
          strokeDasharray="3 3"
          strokeWidth="1.5"
        />
        <motion.path
          animate={{
            pathLength: phase === 'extract' ? 1 : 0,
            opacity: phase === 'extract' ? [0, 1, 1, 0] : 0,
          }}
          d="M 130 123 L 165 122"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          stroke="var(--foreground)"
          strokeLinecap="round"
          strokeWidth="2"
          transition={{
            pathLength: {
              duration: phase === 'extract' ? draw.duration : 0,
              ease: draw.ease,
            },
            opacity: {
              duration: phase === 'extract' ? draw.duration : 0,
              times: [0, 0.1, 0.8, 1],
            },
          }}
        />

        {/* L3: Font token → Tailwind */}
        <path
          d="M 130 151 C 147 151, 147 122, 165 122"
          fill="none"
          stroke="var(--border)"
          strokeDasharray="3 3"
          strokeWidth="1.5"
        />
        <motion.path
          animate={{
            pathLength: phase === 'extract' ? 1 : 0,
            opacity: phase === 'extract' ? [0, 1, 1, 0] : 0,
          }}
          d="M 130 151 C 147 151, 147 122, 165 122"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          stroke="var(--foreground)"
          strokeLinecap="round"
          strokeWidth="2"
          transition={{
            pathLength: {
              duration: phase === 'extract' ? draw.duration : 0,
              ease: draw.ease,
            },
            opacity: {
              duration: phase === 'extract' ? draw.duration : 0,
              times: [0, 0.1, 0.8, 1],
            },
          }}
        />

        {/* R1: Tailwind → shadcn */}
        <path
          d="M 235 122 L 270 122"
          fill="none"
          stroke="var(--border)"
          strokeDasharray="3 3"
          strokeWidth="1.5"
        />
        <motion.path
          animate={{
            pathLength: phase === 'build' ? 1 : 0,
            opacity: phase === 'build' ? [0, 1, 1, 0] : 0,
          }}
          d="M 235 122 L 270 122"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          stroke={c.info}
          strokeLinecap="round"
          strokeWidth="2.5"
          transition={{
            pathLength: {
              duration: phase === 'build' ? draw.duration : 0,
              ease: draw.ease,
            },
            opacity: {
              duration: phase === 'build' ? draw.duration : 0,
              times: [0, 0.1, 0.8, 1],
            },
          }}
        />
        <motion.circle
          animate={{
            cx: phase === 'build' ? 270 : 235,
            opacity: phase === 'build' ? [0, 1, 1, 0] : 0,
          }}
          cy="122"
          fill="var(--foreground)"
          initial={{ cx: 235, opacity: 0 }}
          r="4"
          transition={{
            cx: {
              duration: phase === 'build' ? draw.duration : 0,
              ease: draw.ease,
            },
            opacity: {
              duration: phase === 'build' ? draw.duration : 0,
              times: [0, 0.1, 0.8, 1],
            },
          }}
        />
      </svg>
    </div>
  )
}

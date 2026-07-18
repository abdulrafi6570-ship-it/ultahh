import * as React from "react"
import { cn } from "@/lib/utils"
import { balloons, textBalloons } from "balloons-js"

export interface BalloonsProps {
  type?: "default" | "text"
  text?: string
  fontSize?: number
  color?: string
  className?: string
  onLaunch?: () => void
}

const Balloons = React.forwardRef<HTMLDivElement, BalloonsProps>(
  ({ type = "default", text, fontSize = 120, color = "#FFB6D9", className, onLaunch }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null)

    const launchAnimation = React.useCallback(() => {
      if (type === "default") {
        balloons()
      } else if (type === "text" && text) {
        textBalloons([
          {
            text,
            fontSize,
            color,
          },
        ])
      }

      if (onLaunch) {
        onLaunch()
      }
    }, [type, text, fontSize, color, onLaunch])

    React.useImperativeHandle(ref, () => ({
      launchAnimation,
      ...(containerRef.current || {})
    } as HTMLDivElement & { launchAnimation: () => void }), [launchAnimation])

    return <div ref={containerRef} className={cn("balloons-container", className)} />
  }
)
Balloons.displayName = "Balloons"

export { Balloons }

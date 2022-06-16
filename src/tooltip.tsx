import React from 'react'
import classNames from 'classnames'

import type { Coords } from './types'

type TooltipProps = {
  className?: string
  coords: Coords
  children: React.ReactNode
}

const Tooltip: React.FC<TooltipProps> = ({
  className,
  coords,
  children,
}) => (
  <div
    className={classNames('RCMAP-tooltip', className)}
    data-x={coords.x}
    data-y={coords.y}
  >
    <span className="RCMAP-tooltip-arrow-outer" />
    <span className="RCMAP-tooltip-arrow-inner" />
    <div className="RCMAP-tooltip-body">
      {children}
    </div>
  </div>
)

export { Tooltip }
export type { TooltipProps }

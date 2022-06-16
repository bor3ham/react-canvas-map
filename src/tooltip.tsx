import React from 'react'

import type { Coords } from './types'

type TooltipProps = {
  coords: Coords
  children: React.ReactNode
  style?: React.CSSProperties
  arrowSize?: number
  tooltipStyle?: React.CSSProperties
  width?: string
  height?: string
}

const Tooltip: React.FC<TooltipProps> = ({
  coords,
  children,
  style,
  arrowSize = 8,
  tooltipStyle,
  width = '20rem',
  height,
}) => (
  <div
    style={{
      position: 'absolute',
      width,
      height,
      transform: 'translateX(-50%)',
      userSelect: 'text',
      marginTop: `-${arrowSize}px`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      ...style,
    }}
    data-x={coords.x}
    data-y={coords.y}
  >
    {arrowSize > 0 && (
      <>
        <span
          style={{
            display: 'inline-block',
            alignSelf: 'center',
            borderColor: 'transparent transparent #ddd',
            borderWidth: `${arrowSize + 2}px`,
            borderStyle: 'solid',
          }}
        />
        <span
          style={{
            alignSelf: 'center',
            display: 'inline-block',
            marginTop: `-${arrowSize * 2}px`,
            borderColor: 'transparent transparent #fff',
            borderWidth: `${arrowSize}px`,
            borderStyle: 'solid',
            zIndex: '1',
          }}
        />
      </>
    )}
    <div style={{
      background: '#fff',
      border: '1px solid #ddd',
      padding: '0.5rem',
      boxSizing: 'border-box',
      marginTop: '-1px',
      ...tooltipStyle,
    }}>
      {children}
    </div>
  </div>
)

export { Tooltip }
export type { TooltipProps }

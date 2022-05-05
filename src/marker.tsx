import React from 'react'

import type { Coords } from './types'

type Props = {
  markerKey: string
  coords: Coords

  image: File
  inCircle: boolean
  circleColour: string
  size: number
  scaleWithZoom: boolean

  onClick?(): void
  onDoubleClick?(): void

  dragZoneScale: number
  onDragTick?(coords: Coords): void
  onDragEnd?(coords: Coords): void
  onDragCancel?(): void
}

const Marker: React.FC<Props> = () => null

export { Marker }

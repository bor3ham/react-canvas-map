import React from 'react'

type DropZoneProps = {
  right?: number
  left?: number
  top?: number
  bottom?: number
  width: number
  height: number

  label?: string
  colour?: string,
  backgroundColour?: string,
  fontSize?: number,
  image?: File,

  onDrop(): void,
}

const DropZone: React.FC<DropZoneProps> = () => null

export { DropZone }
export type { DropZoneProps }

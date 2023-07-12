interface ExtendedContext extends CanvasRenderingContext2D {
  transformedPoint(x: number, y: number): DOMPoint
  untransformedPoint(x: number, y: number): DOMPoint
}

export type { ExtendedContext }

export function extendContext(ctx: CanvasRenderingContext2D | null): ExtendedContext | null {
  if (!ctx) return ctx
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const extended = ctx as ExtendedContext
  extended.transformedPoint = (x: number, y: number) => {
    const pt = svg.createSVGPoint()
    pt.x = x
    pt.y = y
    return pt.matrixTransform(extended.getTransform().inverse())
  }
  extended.untransformedPoint = (x: number, y: number) => {
    const pt = svg.createSVGPoint()
    pt.x = x
    pt.y = y
    return pt.matrixTransform(extended.getTransform())
  }
  return extended
}

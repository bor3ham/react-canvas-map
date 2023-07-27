interface ExtendedContext extends CanvasRenderingContext2D {
  transformedPoint(x: number, y: number): DOMPoint
  untransformedPoint(x: number, y: number): DOMPoint
}

export type { ExtendedContext }

export function extendContext(ctx: CanvasRenderingContext2D | null): ExtendedContext | null {
  if (!ctx) return ctx
  const extended = ctx as ExtendedContext
  extended.transformedPoint = (x: number, y: number) => {
    const pt = new DOMPoint(x, y)
    const transform = extended.getTransform()
    return pt.matrixTransform(transform.inverse())
  }
  extended.untransformedPoint = (x: number, y: number) => {
    const pt = new DOMPoint(x, y)
    const transform = extended.getTransform()
    return pt.matrixTransform(transform)
  }
  return extended
}

interface TrackedContext extends CanvasRenderingContext2D {
  getTransform(): DOMMatrix
  transformedPoint(x: number, y: number): DOMPoint
  untransformedPoint(x: number, y: number): DOMPoint
}

export type { TrackedContext }

/*
  Wrapper to track matrix transforms on a 2d canvas
 */
function trackTransforms(ctx) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  let xform = svg.createSVGMatrix()
  ctx.getTransform = () => xform

  const savedTransforms: DOMMatrix[] = []
  const { save } = ctx
  ctx.save = () => {
    savedTransforms.push(xform.translate(0, 0))
    return save.call(ctx)
  }

  const { restore } = ctx
  ctx.restore = () => {
    if (savedTransforms.length > 0) {
      xform = savedTransforms.pop()!
    }
    return restore.call(ctx)
  }

  const { scale } = ctx
  ctx.scale = (sx, sy) => {
    xform = xform.scaleNonUniform(sx, sy)
    return scale.call(ctx, sx, sy)
  }

  const { rotate } = ctx
  ctx.rotate = (radians) => {
    xform = xform.rotate(radians * 180 / Math.PI)
    return rotate.call(ctx, radians)
  }

  const { translate } = ctx
  ctx.translate = (dx, dy) => {
    xform = xform.translate(dx, dy)
    return translate.call(ctx, dx, dy)
  }

  const { transform } = ctx
  ctx.transform = (a, b, c, d, e, f) => {
    const m2 = svg.createSVGMatrix()
    m2.a = a
    m2.b = b
    m2.c = c
    m2.d = d
    m2.e = e
    m2.f = f
    xform = xform.multiply(m2)
    return transform.call(ctx, a, b, c, d, e, f)
  }

  const { setTransform } = ctx
  ctx.setTransform = (a, b, c, d, e, f) => {
    xform.a = a
    xform.b = b
    xform.c = c
    xform.d = d
    xform.e = e
    xform.f = f
    return setTransform.call(ctx, a, b, c, d, e, f)
  }

  ctx.transformedPoint = (x, y) => {
    const pt = svg.createSVGPoint()
    pt.x = x
    pt.y = y
    return pt.matrixTransform(xform.inverse())
  }

  ctx.untransformedPoint = (x, y) => {
    const pt = svg.createSVGPoint()
    pt.x = x
    pt.y = y
    return pt.matrixTransform(xform)
  }
}

export { trackTransforms }

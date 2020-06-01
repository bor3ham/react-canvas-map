import React from 'react'
import PropTypes from 'prop-types'

import trackTransforms from './track-transforms.js'
import Marker from './marker.js'
import DropZone from './drop-zone.js'

const SCALE_FACTOR = 1.1

const CROSSHAIR_IMAGE = 'http://www.pngpix.com/wp-content/uploads/2016/10/PNGPIX-COM-Crosshair-PNG-Transparent-Image-1-500x500.png'
const CROSSHAIR_SIZE = 100

const KEYDOWN_ESCAPE = 27

export default class Map extends React.Component {
  static propTypes = {
    image: PropTypes.string,
    children: PropTypes.node,
    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func,
    minZoom: PropTypes.number,
    maxZoom: PropTypes.number,
    overpan: PropTypes.number,
    minDragTime: PropTypes.number,
  }

  static defaultProps = {
    minZoom: 0.2,
    maxZoom: 5,
    overpan: 30,
    minDragTime: 500,
  }

  constructor(props) {
    super(props)

    this.canvasRef = React.createRef()
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.image !== prevProps.image) {
      this.mapImage = new Image()
      this.mapImage.src = this.props.image
      this.mapImage.onload = this.redraw
      this.resetView()
    } else {
      this.redraw()
    }
  }

  componentDidMount() {
    this.crosshairPoint = null

    this.mapImage = new Image()
    this.mapImage.src = this.props.image
    this.mapImage.onload = this.redraw

    this.crosshairImage = new Image()
    this.crosshairImage.src = CROSSHAIR_IMAGE
    this.crosshairImage.onload = this.redraw

    this.dragged = false
    this.draggingMarkerKey = null
    this.clickPoint = null
    this.clickTime = +(new Date())

    const canvas = this.canvasRef.current
    if (canvas) {
      const context = canvas.getContext('2d')
      trackTransforms(context)
      canvas.addEventListener('mousedown', this.canvasMouseDownListener, false)
      canvas.addEventListener('mouseup', this.canvasMouseUp)
      canvas.addEventListener('dblclick', this.handleDoubleClick)
      canvas.addEventListener('DOMMouseScroll', this.handleScroll, false)
      canvas.addEventListener('mousewheel', this.handleScroll, false)
    }

    window.addEventListener('resize', this.resize)
    document.addEventListener('mousemove', this.documentMouseMoveListener, false)
    document.addEventListener('drag', this.documentMouseMoveListener, false)
    document.addEventListener('mouseup', this.documentMouseUpListener, false)
    document.addEventListener('keydown', this.documentKeyDownListener, false)

    this.resize()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize)
    document.removeEventListener('mousemove', this.documentMouseMoveListener, false)
    document.removeEventListener('drag', this.documentMouseMoveListener, false)
    document.removeEventListener('mouseup', this.documentMouseUpListener, false)
    document.removeEventListener('keydown', this.documentKeyDownListener, false)

    const canvas = this.canvasRef.current
    if (canvas) {
      canvas.removeEventListener('mousedown', this.canvasMouseDownListener, false)
      canvas.removeEventListener('mouseup', this.canvasMouseUp)
      canvas.removeEventListener('dblclick', this.handleDoubleClick)
      canvas.removeEventListener('DOMMouseScroll', this.handleScroll, false)
      canvas.removeEventListener('mousewheel', this.handleScroll, false)
    }
  }

  getCursorCoords = () => {
    const canvas = this.canvasRef.current
    if (!canvas) {
      return {x: 0, y: 0}
    }
    const context = canvas.getContext('2d')
    return context.transformedPoint(this.cursorX, this.cursorY)
  }

  getFlatChildren = () => {
    const children = []
    const getChildren = (child) => {
      if (Array.isArray(child)) {
        child.map(getChildren)
      } else if (child) {
        children.push(child)
      }
    }
    getChildren(this.props.children)
    return children
  }

  getMarkerChildren = () => {
    return this.getFlatChildren().filter(child => {
      return child.type && child.type === Marker
    })
  }

  getMarkerChild = (key) => {
    return this.getMarkerChildren().find(child => {
      return child && child.props.markerKey === key
    })
  }

  getDropZoneChildren = () => {
    return this.getFlatChildren().filter(child => {
      return child.type && child.type === DropZone
    })
  }

  canvasMouseDownListener = () => {
    this.animationCancel = true

    document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none'
    this.clickPoint = this.getCursorCoords()
    this.dragTimeout = window.setTimeout(this.documentMouseMoveListener, this.props.minDragTime)
    this.clickTime = +(new Date())
    this.dragged = false
    this.draggingMarkerKey = this.getMarkerTouchingCursor()
  }

  documentMouseMoveListener = (event) => {
    const canvas = this.canvasRef.current
    if (!canvas) {
      return
    }
    const context = canvas.getContext('2d')

    const lastPt = this.getCursorCoords()
    const rect = canvas.getBoundingClientRect()
    if (event) {
      this.cursorX = event.clientX - rect.x
      this.cursorY = event.clientY - rect.y
    }

    if (!this.clickPoint) {
      this.updateCursor()
      return
    }

    this.dragged = true
    if (this.draggingMarkerKey) {
      if (new Date() > this.clickTime + this.props.minDragTime) {
        this.dragTick(this.draggingMarkerKey)
      }
    } else {
      const pt = this.getCursorCoords()
      const transform = context.getTransform()
      let translateX = pt.x - lastPt.x
      let translateY = pt.y - lastPt.y
      if (translateX > 0) {
        const xLimit = rect.width - this.props.overpan
        if (transform.e > xLimit) {
          translateX = 0
        } else if (transform.e + translateX > xLimit) {
          translateX = xLimit - transform.e
        }
      } else if (translateX < 0) {
        const xLimit = -(this.mapImage.width * transform.a) + this.props.overpan
        if (transform.e < xLimit) {
          translateX = 0
        } else if (transform.e + translateX < xLimit) {
          translateX = xLimit - transform.e
        }
      }
      if (translateY > 0) {
        const yLimit = rect.height - this.props.overpan
        if (transform.f > yLimit) {
          translateY = 0
        } else if (transform.f + translateY > yLimit) {
          translateY = yLimit - transform.f
        }
      } else if (translateY < 0) {
        const yLimit = -(this.mapImage.height * transform.d) + this.props.overpan
        if (transform.f < yLimit) {
          translateY = 0
        } else if (transform.f + translateY < yLimit) {
          translateY = yLimit - transform.f
        }
      }
      context.translate(translateX, translateY)
      this.redraw()
    }
  }

  documentMouseUpListener = (event) => {
    if (this.dragTimeout) {
      window.clearTimeout(this.dragTimeout)
    }
    if (
      this.draggingMarkerKey &&
      this.dragged &&
      new Date() > this.clickTime + this.props.minDragTime
    ) {
      this.dragEnd(this.draggingMarkerKey)
      this.draggingMarkerKey = null
    }
    this.clickPoint = null
    this.dragged = false
    this.redraw()
  }

  documentKeyDownListener = (event) => {
    if (event.which === KEYDOWN_ESCAPE) {
      const draggingMarker = this.getMarkerChild(this.draggingMarkerKey)
      if (draggingMarker && typeof draggingMarker.props.onDragCancel === 'function') {
        draggingMarker.props.onDragCancel()
      }
      this.clickPoint = null
      this.dragged = false
      this.redraw()
    }
  }

  canvasMouseUp = () => {
    if (!this.dragged) {
      this.handleClick()
    }
  }

  resize = () => {
    const canvas = this.canvasRef.current
    if (!canvas) {
      return
    }
    const cursorXProportion = this.cursorX / canvas.clientWidth
    const cursorYProportion = this.cursorY / canvas.clientHeight

    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    this.cursorX = cursorXProportion * canvas.width
    this.cursorY = cursorYProportion * canvas.height

    // reset the transforms
    // todo: rescale the transforms to match the new size instead
    this.resetView()
  }

  resetView = () => {
    const canvas = this.canvasRef.current
    if (!canvas) {
      return
    }
    const context = canvas.getContext('2d')

    const transform = context.getTransform()
    const maxScale = Math.max(transform.a, transform.d)
    context.setTransform(maxScale, 0, 0, maxScale, transform.e, transform.f)
    this.redraw()
  }

  updateCursor = () => {
    const canvas = this.canvasRef.current

    const hovered = this.getMarkerTouchingCursor()
    if (hovered) {
      canvas.style.cursor = 'pointer'
    } else {
      canvas.style.cursor = 'auto'
    }
  }

  getScreenPositionCoords = (position) => {
    const canvas = this.canvasRef.current
    if (!canvas) {
      return [{}, {}, false]
    }
    const rect = canvas.getBoundingClientRect()
    const context = canvas.getContext('2d')

    let topLeft = {x: 0, y: 0}
    let bottomRight = {x: 100, y: 100}
    if (typeof position.top === 'number') {
      topLeft.y = position.top
      bottomRight.y = topLeft.y + position.height
    } else if (typeof position.bottom === 'number') {
      topLeft.y = rect.height - position.bottom - position.height
      bottomRight.y = topLeft.y + position.height
    } else {
      return [{}, {}, false] // no valid top/bottom dimensions
    }
    if (typeof position.left === 'number') {
      topLeft.x = position.left
      bottomRight.x = topLeft.x + position.width
    } else if (typeof position.right === 'number') {
      topLeft.x = rect.width - position.right - position.width
      bottomRight.x = topLeft.x + position.width
    } else {
      return [{}, {}, false] // no valid left/right dimensions
    }
    topLeft = context.transformedPoint(topLeft.x, topLeft.y)
    bottomRight = context.transformedPoint(bottomRight.x, bottomRight.y)
    return [topLeft, bottomRight, true]
  }

  redraw = () => {
    const canvas = this.canvasRef.current
    if (!canvas) {
      return
    }
    const context = canvas.getContext('2d')

    // Clear the entire canvas
    const p1 = context.transformedPoint(0, 0)
    const p2 = context.transformedPoint(canvas.width, canvas.height)
    context.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y)

    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.restore()

    context.drawImage(this.mapImage, 0, 0)
    if (this.crosshairPoint) {
      context.drawImage(
        this.crosshairImage,
        this.crosshairPoint.x - (CROSSHAIR_SIZE / 2),
        this.crosshairPoint.y - (CROSSHAIR_SIZE / 2),
        CROSSHAIR_SIZE,
        CROSSHAIR_SIZE
      )
    }

    const scale = Math.min(context.getTransform().a, context.getTransform().d)
    const renderMarkers = (child) => {
      if (!child.props.image) {
        console.error('error: no image on child', child)
        return
      }

      let coverWidthScale = 1
      let coverHeightScale = 1
      if (child.props.image.width > child.props.image.height) {
        coverHeightScale = child.props.image.height / child.props.image.width
      } else {
        coverWidthScale = child.props.image.width / child.props.image.height
      }

      const scaledSize = child.props.scaleWithZoom ? child.props.size : child.props.size / scale
      const centreX = child.props.coords.x
      const centreY = child.props.coords.y
      if (child.props.inCircle) {
        const imageSize = scaledSize * 0.55
        const renderWidth = imageSize * coverWidthScale
        const renderHeight = imageSize * coverHeightScale

        context.beginPath()
        context.arc(centreX, centreY, scaledSize / 2, 0, 2 * Math.PI, false)
        context.fillStyle = child.props.circleColour
        context.fill()
        context.drawImage(
          child.props.image,
          centreX - (renderWidth / 2),
          centreY - (renderHeight / 2),
          renderWidth,
          renderHeight
        )
      } else {
        const renderWidth = scaledSize * coverWidthScale
        const renderHeight = scaledSize * coverHeightScale
        context.drawImage(
          child.props.image,
          centreX - (renderWidth / 2),
          centreY - (renderHeight / 2),
          renderWidth,
          renderHeight
        )
      }
    }

    const draggingMarker = this.getMarkerChild(this.draggingMarkerKey)
    this.getMarkerChildren().filter(child => {
      return child !== draggingMarker
    }).map(renderMarkers)
    if (draggingMarker && this.dragged) {
      const hoverDropZone = this.getDropZoneTouchingCursor()
      const renderDropZones = (child) => {
        const [topLeft, bottomRight, valid] = this.getScreenPositionCoords(child.props)
        if (!valid) {
          return
        }
        context.globalAlpha = child === hoverDropZone ? 1 : 0.7
        context.beginPath()
        context.fillStyle = child.props.backgroundColour
        context.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y)
        if (child.props.image) {
          context.drawImage(
            child.props.image,
            topLeft.x,
            topLeft.y,
            bottomRight.x - topLeft.x,
            bottomRight.y - topLeft.y
          )
        }
        context.textAlign = 'center'
        context.fillStyle = child.props.colour
        context.font = `${child.props.fontSize / scale}px Arial`
        context.fillText(
          child.props.label,
          (bottomRight.x + topLeft.x) / 2,
          (bottomRight.y + topLeft.y) / 2 + (child.props.fontSize / 4) / scale
        )
        context.globalAlpha = 1
      }
      this.getDropZoneChildren().map(renderDropZones)
    }
    this.getMarkerChildren().filter(child => {
      return child === draggingMarker
    }).map(renderMarkers)
    this.updateCursor()
  }

  getMarkerTouchingCursor = () => {
    const canvas = this.canvasRef.current
    if (!canvas) {
      return null
    }
    const context = canvas.getContext('2d')

    const close = {}

    this.getMarkerChildren().map(child => {
      if (!(
        typeof child.props.onClick === 'function' ||
        typeof child.props.onDoubleClick === 'function' ||
        typeof child.props.onDragTick === 'function' ||
        typeof child.props.onDragEnd === 'function'
      )) {
        return
      }
      const HOVER_DIST = (child.props.size / 2) * child.props.dragZoneScale
      const HOVER_DIST_SQ = HOVER_DIST * HOVER_DIST

      let distSq
      if (child.props.scaleWithZoom) {
        const cursorPt = this.getCursorCoords()
        distSq = (
          Math.pow(child.props.coords.x - cursorPt.x, 2) +
          Math.pow(child.props.coords.y - cursorPt.y, 2)
        )
      } else {
        const beaconScreenPt = context.untransformedPoint(
          child.props.coords.x,
          child.props.coords.y
        )
        distSq = (
          Math.pow(beaconScreenPt.x - this.cursorX, 2) +
          Math.pow(beaconScreenPt.y - this.cursorY, 2)
        )
      }

      if (distSq < HOVER_DIST_SQ) {
        close[child.props.markerKey] = distSq
      }
    })
    let closestDist = -1
    let closest = []
    for (const key in close) {
      const distSq = close[key]
      if (closestDist === -1 || distSq < closestDist) {
        closestDist = distSq
        closest = []
        closest.push(key)
      } else if (distSq === closestDist) {
        closest.push(key)
      }
    }
    return closest[0]
  }

  zoom = (clicks) => {
    const canvas = this.canvasRef.current
    if (!canvas) {
      return
    }
    const context = canvas.getContext('2d')

    const pt = this.getCursorCoords()
    context.translate(pt.x, pt.y)
    let factor = Math.pow(SCALE_FACTOR, clicks)
    // limit zoom to given ranges in props
    const transform = context.getTransform()
    if (factor > 1) {
      const maxScale = Math.max(transform.a, transform.d)
      if (maxScale * factor > this.props.maxZoom) {
        factor = this.props.maxZoom / maxScale
      }
    } else {
      const minScale = Math.max(transform.a, transform.d)
      if (minScale * factor < this.props.minZoom) {
        factor = this.props.minZoom / minScale
      }
    }
    context.scale(factor, factor)
    context.translate(-pt.x, -pt.y)
    this.redraw()
  }

  handleScroll = (event) => {
    this.animationCancel = true

    const delta = event.wheelDelta ? event.wheelDelta / 40 : event.detail ? -event.detail : 0
    if (delta) {
      this.zoom(delta)
    }
    return event.preventDefault() && false
  }

  handleClick = (event) => {
    const pt = this.getCursorCoords()

    let clickedMarker = null
    if (this.draggingMarkerKey) {
      clickedMarker = this.getMarkerChild(this.draggingMarkerKey)
    }
    if (clickedMarker) {
      if (typeof clickedMarker.props.onClick === 'function') {
        clickedMarker.props.onClick()
      }
    } else {
      if (typeof this.props.onClick === 'function') {
        this.props.onClick(pt)
      }
    }
  }

  handleDoubleClick = (event) => {
    const canvas = this.canvasRef.current
    if (!canvas) {
      return
    }
    const context = canvas.getContext('2d')

    let clickedMarker = null
    if (this.draggingMarkerKey) {
      clickedMarker = this.getMarkerChild(this.draggingMarkerKey)
    }
    if (clickedMarker) {
      if (typeof clickedMarker.props.onDoubleClick === 'function') {
        clickedMarker.props.onDoubleClick()
      }
    } else {
      if (typeof this.props.onDoubleClick === 'function') {
        const pt = context.transformedPoint(this.cursorX, this.cursorY)
        this.props.onDoubleClick(pt)
      }
    }
  }

  dragTick = (draggingMarkerKey) => {
    const pt = this.getCursorCoords()
    const draggingMarker = this.getMarkerChild(draggingMarkerKey)
    if (draggingMarker && typeof draggingMarker.props.onDragTick === 'function') {
      draggingMarker.props.onDragTick(pt)
    }
  }

  getDropZoneTouchingCursor = () => {
    const pt = this.getCursorCoords()
    // go through dropzones and see if it has landed in any
    let droppedZone = null
    this.getDropZoneChildren().map(dropZone => {
      const [topLeft, bottomRight, valid] = this.getScreenPositionCoords(dropZone.props)
      if (!valid) {
        return
      }
      if (
        pt.x >= topLeft.x &&
        pt.x <= bottomRight.x &&
        pt.y >= topLeft.y &&
        pt.y <= bottomRight.y
      ) {
        droppedZone = dropZone
      }
    })
    return droppedZone
  }

  dragEnd = (draggingMarkerKey) => {
    const pt = this.getCursorCoords()
    const draggedMarker = this.getMarkerChild(draggingMarkerKey)
    if (!draggedMarker) {
      return
    }

    const droppedZone = this.getDropZoneTouchingCursor()
    if (droppedZone) {
      if (typeof draggedMarker.props.onDragCancel === 'function') {
        draggedMarker.props.onDragCancel()
      }
      if (typeof droppedZone.props.onDrop === 'function') {
        droppedZone.props.onDrop(draggedMarker.props)
      }
    } else if (typeof draggedMarker.props.onDragEnd === 'function') {
      draggedMarker.props.onDragEnd(pt)
    }
  }

  panTo = (coords) => {
    this.animationCancel = false
    this.animationStart = null
    this.animationCoords = coords
    window.requestAnimationFrame(this.animate)
  }

  animate = (timestamp) => {
    if (this.animationCancel) {
      this.animationStart = null
      this.animationCancel = false
      return
    }

    const canvas = this.canvasRef.current
    if (!canvas) {
      // abort and try later
      window.requestAnimationFrame(this.animate)
      return
    }
    const rect = canvas.getBoundingClientRect()
    const context = canvas.getContext('2d')
    const transform = context.getTransform()

    if (!this.animationStart) {
      this.animationStart = timestamp
      this.animationLastTimestamp = timestamp
    }

    const deltaMs = timestamp - this.animationLastTimestamp
    this.animationLastTimestamp = timestamp

    let panDone = true
    if (this.animationCoords) {
      const current = {
        x: ((rect.width / 2) - transform.e) / transform.a,
        y: ((rect.height / 2) - transform.f) / transform.d,
      }
      const desired = this.animationCoords

      const diff = {
        x: desired.x - current.x,
        y: desired.y - current.y,
      }
      const dist = Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2))
      panDone = dist < 1
      if (!panDone) {
        const delta = Math.min(Math.max(deltaMs * 0.005, 0), 1)
        context.translate(-diff.x * delta, -diff.y * delta)
      } else {
        context.translate(-diff.x, -diff.y)
        this.animationCoords = null
      }
    }

    this.redraw()

    if (!panDone) {
      window.requestAnimationFrame(this.animate)
    }
  }

  render() {
    return (<canvas ref={this.canvasRef} style={{width: '100%', height: '100%'}} />)
  }
}

import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react'

import { extendContext } from './extend-context'
import { Marker } from './marker'
import { DropZone } from './drop-zone'
import { Tooltip } from './tooltip'
import type { Coords } from './types'

const SCALE_FACTOR = 1.1
const KEYDOWN_ESCAPE = 27

type MapProps = {
  image: string
  children?: React.ReactNode

  onClick?(pt: Coords): void
  onDoubleClick?(pt: Coords): void
  onCursorMove?(pt: Coords): void

  minZoom?: number
  maxZoom?: number
  overpan?: number

  minDragTime?: number
  clickGraceTime?: number

  containInitialImage?: boolean // begin with zoom/translation that contains initial image
  containUpdatedImage?: boolean // update zoom/translation to contain a change of image
  allowContainmentZoom?: boolean // allow zooming beyond min/max if image is not contained

  panTo?: Coords
}

type ScreenPositionCoords = {
  topLeft?: Coords
  bottomRight?: Coords
  valid: boolean
}

const Map = React.forwardRef<HTMLCanvasElement, MapProps>(({
  image,
  children,

  onClick,
  onDoubleClick,
  onCursorMove,

  minZoom = 0.2,
  maxZoom = 5,
  overpan = 30,

  minDragTime = 300,
  clickGraceTime = 100,

  containInitialImage = true,
  containUpdatedImage = true,
  allowContainmentZoom = true,

  panTo,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mapImage = useRef<HTMLImageElement>()
  const mapImageValid = useRef<boolean>(false)

  const dragged = useRef(false)
  const draggingMarkerKey = useRef<string | null>(null)
  const dragTimeout = useRef<number | undefined>(undefined)
  const clickPoint = useRef<DOMPoint | null>(null)
  const clickTime = useRef(+(new Date()))
  const cursor = useRef<Coords | null>(null)
  const updateMouseCoords = useCallback(() => {
    if (!canvasRef.current) {
      return
    }
    const context = extendContext(canvasRef.current.getContext('2d'))
    if (!context) {
      return
    }
    if (
      cursor.current &&
      typeof onCursorMove === 'function'
    ) {
      onCursorMove(context.transformedPoint(cursor.current.x, cursor.current.y))
    }
  }, [onCursorMove])

  const animationActive = useRef(false)
  const animationCancel = useRef(false)
  const animationStart = useRef<number | null>(null)
  const animationCoords = useRef<Coords | null>(null)
  const animationLastTimestamp = useRef(+(new Date()))

  const markers = useRef<React.ReactElement[]>([])
  const dropZones = useRef<React.ReactElement[]>([])
  const flatChildren = useMemo(() => {
    const allChildren: React.ReactElement[] = []
    const getChildren = (child: React.ReactNode) => {
      if (Array.isArray(child)) {
        child.forEach(getChildren)
      } else {
        const asElement = child as React.ReactElement
        if (asElement) {
          if (asElement.props && asElement.props.children && asElement.type !== Tooltip) {
            getChildren(asElement.props.children)
          } else {
            allChildren.push(asElement)
          }
        }
      }
    }
    getChildren(children)
    return allChildren
  }, [children])
  markers.current = flatChildren.filter(child => (child.type && child.type === Marker))
  const getMarkerChild = (key: string) : React.ReactElement | undefined => (
    markers.current.find(child => (
      child && child.props.markerKey === key
    ))
  )
  dropZones.current = flatChildren.filter(child => (
    child.type && child.type === DropZone
  ))
  const tooltipChildren = useMemo(() => (
    flatChildren.filter(child => (
      child.type && child.type === Tooltip
    ))
  ), [flatChildren])

  const getCursorCoords = () => {
    if (!canvasRef.current) {
      return null
    }
    const context = extendContext(canvasRef.current.getContext('2d'))
    if (!context) {
      return null
    }
    if (cursor.current) {
      return context.transformedPoint(cursor.current.x, cursor.current.y)
    }
    return null
  }
  const getScreenPositionCoords = ({
    right,
    left,
    top,
    bottom,
    width,
    height,
  }: {
    right?: number
    left?: number
    top?: number
    bottom?: number
    width: number
    height: number
  }) => {
    if (!canvasRef.current) {
      return {valid: false} as ScreenPositionCoords
    }
    const rect = canvasRef.current.getBoundingClientRect()
    const context = extendContext(canvasRef.current.getContext('2d'))
    if (!context) {
      return {valid: false} as ScreenPositionCoords
    }

    let topLeft = {x: 0, y: 0}
    let bottomRight = {x: 100, y: 100}
    if (typeof top === 'number') {
      topLeft.y = top
      bottomRight.y = topLeft.y + height
    } else if (typeof bottom === 'number') {
      topLeft.y = rect.height - bottom - height
      bottomRight.y = topLeft.y + height
    } else {
      return {valid: false} as ScreenPositionCoords // no valid top/bottom dimensions
    }
    if (typeof left === 'number') {
      topLeft.x = left
      bottomRight.x = topLeft.x + width
    } else if (typeof right === 'number') {
      topLeft.x = rect.width - right - width
      bottomRight.x = topLeft.x + width
    } else {
      return {valid: false} as ScreenPositionCoords // no valid left/right dimensions
    }
    topLeft = context.transformedPoint(topLeft.x, topLeft.y)
    bottomRight = context.transformedPoint(bottomRight.x, bottomRight.y)
    return {topLeft, bottomRight, valid: true} as ScreenPositionCoords
  }
  const getDropZoneTouchingCursor = useCallback(() : React.ReactElement | undefined => {
    const pt = getCursorCoords()
    if (pt === null) {
      return undefined
    }
    // go through dropzones and see if it has landed in any
    let droppedZone: React.ReactElement | undefined
    dropZones.current.forEach(dropZone => {
      const {
        right,
        left,
        top,
        bottom,
        width,
        height,
      } = dropZone.props
      const {topLeft, bottomRight, valid} = getScreenPositionCoords({
        right,
        left,
        top,
        bottom,
        width,
        height,
      })
      if (!valid) {
        return
      }
      if (
        pt.x >= topLeft!.x &&
        pt.x <= bottomRight!.x &&
        pt.y >= topLeft!.y &&
        pt.y <= bottomRight!.y
      ) {
        droppedZone = dropZone
      }
    })
    return droppedZone
  }, [])
  const getMarkerTouchingCursor = useCallback(() => {
    if (!canvasRef.current) {
      return null
    }
    const context = extendContext(canvasRef.current.getContext('2d'))
    if (!context) {
      return null
    }

    type DistanceLookup = {
      [key: string]: number
    }

    const close: DistanceLookup = {}

    const cursorPt = getCursorCoords()
    if (cursorPt === null) {
      return null
    }

    markers.current.forEach(child => {
      const {
        markerKey,
        coords,

        size = 100,
        scaleWithZoom = true,

        onClick: onMarkerClick,
        onDoubleClick: onMarkerDoubleClick,

        dragZoneScale = 1,
        onDragTick,
        onDragEnd,
      } = child.props
      if (!(
        typeof onMarkerClick === 'function' ||
        typeof onMarkerDoubleClick === 'function' ||
        typeof onDragTick === 'function' ||
        typeof onDragEnd === 'function'
      )) {
        return
      }
      const HOVER_DIST = (size / 2) * dragZoneScale
      const HOVER_DIST_SQ = HOVER_DIST * HOVER_DIST

      let distSq
      if (scaleWithZoom) {
        distSq = (
          ((coords.x - cursorPt.x) ** 2) +
          ((coords.y - cursorPt.y) ** 2)
        )
      } else {
        const beaconScreenPt = context.untransformedPoint(
          coords.x,
          coords.y
        )
        distSq = (
          ((beaconScreenPt.x - cursor.current!.x) ** 2) +
          ((beaconScreenPt.y - cursor.current!.y) ** 2)
        )
      }

      if (distSq < HOVER_DIST_SQ) {
        close[markerKey] = distSq
      }
    })
    let closestDist = -1
    let closest: string[] = []
    Object.keys(close).forEach(key => {
      const distSq = close[key]
      if (closestDist === -1 || distSq < closestDist) {
        closestDist = distSq
        closest = []
        closest.push(key)
      } else if (distSq === closestDist) {
        closest.push(key)
      }
    })
    return closest[0] || null
  }, [])
  const updateCursor = useCallback(() => {
    if (!canvasRef.current) {
      return
    }
    const hovered = getMarkerTouchingCursor()
    if (hovered) {
      canvasRef.current.style.cursor = 'pointer'
    } else {
      canvasRef.current.style.cursor = 'auto'
    }
  }, [getMarkerTouchingCursor])

  const tooltipsRef = useRef<HTMLDivElement>(null)
  const updateTooltips = () => {
    if (!canvasRef.current || !tooltipsRef.current) {
      return
    }
    const canvasRect = canvasRef.current.getBoundingClientRect()
    const context = extendContext(canvasRef.current.getContext('2d'))
    if (!context) {
      return
    }
    Array.from(tooltipsRef.current.children).forEach((child) => {
      const domChild = child as HTMLElement
      const tooltipX = Number(domChild.dataset['x'])
      const tooltipY = Number(domChild.dataset['y'])

      const screenCoords = context.untransformedPoint(tooltipX, tooltipY)
      const relativeX = screenCoords.x / canvasRect.width
      const relativeY = screenCoords.y / canvasRect.height
      domChild.style.setProperty('left', `${relativeX * 100}%`)
      domChild.style.setProperty('top', `${relativeY * 100}%`)
    })
  }

  const lastRedraw = useRef(+(new Date()))
  const logRedraw = (reason: string) => {
    return
    const nowMs = +(new Date())
    const idleMs = nowMs - lastRedraw.current
    lastRedraw.current = nowMs
    console.log(`redrawing for ${reason} after ${idleMs}`)
  }
  const redraw = useCallback((reason: string) => {
    if (!canvasRef.current) {
      return
    }
    logRedraw(reason)
    const context = extendContext(canvasRef.current.getContext('2d'))
    if (!context) {
      return
    }

    // Clear the entire canvas
    const p1 = context.transformedPoint(0, 0)
    const p2 = context.transformedPoint(canvasRef.current.width, canvasRef.current.height)
    context.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y)

    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    context.restore()

    if (mapImage.current && mapImageValid.current) {
      context.drawImage(mapImage.current, 0, 0, mapImage.current.width, mapImage.current.height)
    }

    const scale = Math.min(context.getTransform().a, context.getTransform().d)
    const renderMarkers = (child: React.ReactElement) => {
      const {
        coords,
        image: markerImage,

        inCircle = false,
        circleColour = '#337ab7',
        size = 100,
        scaleWithZoom = true,
      } = child.props

      if (!markerImage) {
        return
      }

      let coverWidthScale = 1
      let coverHeightScale = 1
      if (markerImage.width > markerImage.height) {
        coverHeightScale = markerImage.height / markerImage.width
      } else {
        coverWidthScale = markerImage.width / markerImage.height
      }

      const scaledSize = scaleWithZoom ? size : size / scale
      const centreX = coords.x
      const centreY = coords.y
      if (inCircle) {
        const imageSize = scaledSize * 0.55
        const renderWidth = imageSize * coverWidthScale
        const renderHeight = imageSize * coverHeightScale

        context.beginPath()
        context.arc(centreX, centreY, scaledSize / 2, 0, 2 * Math.PI, false)
        context.fillStyle = circleColour
        context.fill()
        context.drawImage(
          markerImage,
          centreX - (renderWidth / 2),
          centreY - (renderHeight / 2),
          renderWidth,
          renderHeight
        )
      } else {
        const renderWidth = scaledSize * coverWidthScale
        const renderHeight = scaledSize * coverHeightScale
        context.drawImage(
          markerImage,
          centreX - (renderWidth / 2),
          centreY - (renderHeight / 2),
          renderWidth,
          renderHeight
        )
      }
    }

    const draggingMarker = getMarkerChild(draggingMarkerKey.current || '')
    markers.current.filter(child => (
      child !== draggingMarker
    )).map(renderMarkers)
    if (draggingMarker && dragged.current) {
      const hoverDropZone = getDropZoneTouchingCursor()
      const renderDropZones = (child: React.ReactElement) => {
        const {
          right,
          left,
          top,
          bottom,
          width,
          height,

          label,
          colour = '#fff',
          backgroundColour = '#0f0',
          fontSize = 24,
          image: dropZoneImage,
        } = child.props
        const {topLeft, bottomRight, valid} = getScreenPositionCoords({
          right,
          left,
          top,
          bottom,
          width,
          height,
        })
        if (!valid) {
          return
        }

        context.globalAlpha = child === hoverDropZone ? 1 : 0.7
        context.beginPath()
        context.fillStyle = backgroundColour
        context.fillRect(topLeft!.x, topLeft!.y, bottomRight!.x - topLeft!.x, bottomRight!.y - topLeft!.y)
        if (dropZoneImage) {
          context.drawImage(
            dropZoneImage,
            topLeft!.x,
            topLeft!.y,
            bottomRight!.x - topLeft!.x,
            bottomRight!.y - topLeft!.y
          )
        }
        context.textAlign = 'center'
        context.fillStyle = colour
        context.font = `${fontSize / scale}px Arial`
        if (label) {
          context.fillText(
            label,
            (bottomRight!.x + topLeft!.x) / 2,
            (bottomRight!.y + topLeft!.y) / 2 + (fontSize / 4) / scale
          )
        }
        context.globalAlpha = 1
      }
      dropZones.current.map(renderDropZones)
    }
    markers.current.filter(child => (
      child === draggingMarker
    )).map(renderMarkers)
    updateTooltips()
    updateCursor()
  }, [getDropZoneTouchingCursor, updateCursor])
  useEffect(() => {
    redraw('new children')
  }, [flatChildren, redraw])

  // scale at which the provided image totally covers the canvas
  const [containmentScale, setContainmentScale] = useState(1)

  const maxImageZoom = useMemo(() => {
    if (allowContainmentZoom) {
      return Math.max(maxZoom, containmentScale)
    }
    return maxZoom
  }, [allowContainmentZoom, maxZoom, containmentScale])
  const minImageZoom = useMemo(() => {
    if (allowContainmentZoom) {
      return Math.min(minZoom, containmentScale)
    }
    return minZoom
  }, [allowContainmentZoom, minZoom, containmentScale])

  const updateContainmentScale = useCallback(() => {
    if (!canvasRef.current || !mapImage.current) {
      return
    }
    const imgWidth = mapImage.current.width
    const imgHeight = mapImage.current.height
    if (imgWidth && imgHeight) {
      const widthScaledHeight = (imgHeight / imgWidth) * canvasRef.current.width
      let updatedScale = 1
      if (widthScaledHeight > canvasRef.current.height) {
        updatedScale = canvasRef.current.height / imgHeight
      }
      else {
        updatedScale = canvasRef.current.width / imgWidth
      }
      setContainmentScale(updatedScale)
    }
  }, [])
  const [imageInitialised, setImageInitialised] = useState(false)
  const handleImageLoad = useMemo(() => (
    () => {
      mapImageValid.current = true
      if (!canvasRef.current || !mapImage.current) {
        return
      }
      const context = canvasRef.current.getContext('2d')
      if (!context) {
        return
      }
      const imgWidth = mapImage.current.width
      const imgHeight = mapImage.current.height
      if (imgWidth && imgHeight) {
        const containing = (
          (!imageInitialised && containInitialImage) ||
          (imageInitialised && containUpdatedImage)
        )
        const widthScaledHeight = (imgHeight / imgWidth) * canvasRef.current.width
        const heightScaledWidth = (imgWidth / imgHeight) * canvasRef.current.height
        let newContainmentScale = 1
        if (widthScaledHeight > canvasRef.current.height) {
          newContainmentScale = canvasRef.current.height / imgHeight
          if (containing) {
            let transform = context.getTransform()
            const scaleAdjust = newContainmentScale / transform.d
            context.scale(scaleAdjust, scaleAdjust)
            transform = context.getTransform()
            context.translate(
              (-transform.e + (canvasRef.current.width / 2) - (heightScaledWidth / 2)) / transform.a,
              -transform.f / transform.d
            )
            }
        }
        else {
          newContainmentScale = canvasRef.current.width / imgWidth
          if (containing) {
            let transform = context.getTransform()
            const scaleAdjust =  newContainmentScale / transform.a
            context.scale(scaleAdjust, scaleAdjust)
            transform = context.getTransform()
            context.translate(
              -transform.e / transform.a,
              (-transform.f + (canvasRef.current.height / 2) - (widthScaledHeight / 2)) / transform.d
            )
          }
        }
        updateContainmentScale()
        redraw('image load')
        if (!imageInitialised) {
          setImageInitialised(true)
        }
      }
    }
  ), [])

  const resize = useCallback(() => {
    if (!canvasRef.current) {
      return
    }

    if (cursor.current !== null)
    {
      const cursorXProportion = cursor.current.x / canvasRef.current.clientWidth
      const cursorYProportion = cursor.current.y / canvasRef.current.clientHeight

      cursor.current = {
        x: cursorXProportion * canvasRef.current.width,
        y: cursorYProportion * canvasRef.current.height,
      }
      updateMouseCoords()
    }

    const context = canvasRef.current.getContext('2d')
    let transBefore: DOMMatrix | undefined = undefined
    if (context) {
      transBefore = context.getTransform()
    }
    if (containerRef.current) {
      canvasRef.current.width = containerRef.current.clientWidth
      canvasRef.current.height = containerRef.current.clientHeight
    }
    if (context && transBefore) {
      context.setTransform(transBefore)
    }

    updateContainmentScale()
    redraw('resize')
  }, [updateMouseCoords])
  useEffect(() => {
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [resize])

  const handleClick = useCallback(() => {
    const pt = getCursorCoords()
    if (pt === null) {
      return
    }

    let clickedMarker: React.ReactElement | undefined
    if (draggingMarkerKey.current) {
      clickedMarker = getMarkerChild(draggingMarkerKey.current)
    }
    if (clickedMarker) {
      if (typeof clickedMarker.props.onClick === 'function') {
        clickedMarker.props.onClick()
      }
    } else if (typeof onClick === 'function') {
      onClick(pt)
    }
  }, [onClick])
  const dragTick = useCallback((markerKey: string) => {
    const pt = getCursorCoords()
    if (pt === null) {
      return
    }
    const draggingMarker = getMarkerChild(markerKey)
    if (draggingMarker && typeof draggingMarker.props.onDragTick === 'function') {
      draggingMarker.props.onDragTick(pt)
    }
  }, [])
  const dragEnd = useCallback((markerKey: string) => {
    const pt = getCursorCoords()
    if (pt === null) {
      return
    }
    const draggedMarker = getMarkerChild(markerKey)
    if (!draggedMarker) {
      return
    }

    const droppedZone = getDropZoneTouchingCursor()
    if (droppedZone) {
      if (typeof draggedMarker.props.onDragCancel === 'function') {
        draggedMarker.props.onDragCancel()
      }
      if (typeof droppedZone.props.onDrop === 'function') {
        droppedZone.props.onDrop(draggedMarker.props.markerKey)
      }
    } else if (typeof draggedMarker.props.onDragEnd === 'function') {
      draggedMarker.props.onDragEnd(pt)
    }
  }, [getDropZoneTouchingCursor])

  const handleDocumentMouseMove = useCallback((event: MouseEvent) => {
    if (!canvasRef.current) {
      return
    }
    const context = canvasRef.current.getContext('2d')
    if (!context) {
      return
    }

    const lastPt = getCursorCoords()
    const rect = canvasRef.current.getBoundingClientRect()
    if (event) {
      cursor.current = {
        x: event.clientX - rect.x,
        y: event.clientY - rect.y,
      }
      updateMouseCoords()
    }

    if (!clickPoint.current) {
      updateCursor()
      return
    }

    if (+(new Date()) > clickTime.current + clickGraceTime) {
      dragged.current = true
    }

    if (draggingMarkerKey.current) {
      if (typeof clickTime.current === 'number' && +(new Date()) > clickTime.current + minDragTime) {
        dragTick(draggingMarkerKey.current)
      }
    } else {
      const pt = getCursorCoords()
      if (pt === null || lastPt === null || !mapImage.current) {
        return
      }
      const transform = context.getTransform()
      let translateX = pt.x - lastPt.x
      let translateY = pt.y - lastPt.y
      if (translateX > 0) {
        const xLimit = rect.width - overpan
        if (transform.e > xLimit) {
          translateX = 0
        } else if (transform.e + translateX > xLimit) {
          translateX = xLimit - transform.e
        }
      } else if (translateX < 0) {
        const xLimit = -(mapImage.current.width * transform.a) + overpan
        if (transform.e < xLimit) {
          translateX = 0
        } else if (transform.e + translateX < xLimit) {
          translateX = xLimit - transform.e
        }
      }
      if (translateY > 0) {
        const yLimit = rect.height - overpan
        if (transform.f > yLimit) {
          translateY = 0
        } else if (transform.f + translateY > yLimit) {
          translateY = yLimit - transform.f
        }
      } else if (translateY < 0) {
        const yLimit = -(mapImage.current.height * transform.d) + overpan
        if (transform.f < yLimit) {
          translateY = 0
        } else if (transform.f + translateY < yLimit) {
          translateY = yLimit - transform.f
        }
      }
      context.translate(translateX, translateY)
      redraw('pan')
    }
  }, [clickGraceTime, minDragTime, overpan, dragTick, redraw, updateCursor, updateMouseCoords])
  useEffect(() => {
    document.addEventListener('mousemove', handleDocumentMouseMove, false)
    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove, false)
    }
  }, [handleDocumentMouseMove])

  const handleDocumentMouseUp = useMemo(() => (
    () => {
      if (dragTimeout.current) {
        window.clearTimeout(dragTimeout.current)
      }
      if (
        draggingMarkerKey.current &&
        dragged.current &&
        typeof clickTime.current === 'number' &&
        +(new Date()) > clickTime.current + minDragTime
      ) {
        dragEnd(draggingMarkerKey.current)
      }
      draggingMarkerKey.current = null
      clickPoint.current = null
      dragged.current = false
      redraw('mouse up')
    }
  ), [minDragTime, dragEnd, redraw])
  useEffect(() => {
    document.addEventListener('mouseup', handleDocumentMouseUp, false)
    return () => {
      document.removeEventListener('mouseup', handleDocumentMouseUp, false)
    }
  }, [handleDocumentMouseUp])

  const handleCanvasMouseDown = useCallback(() => {
    animationCancel.current = true

    // @ts-ignore: Old vendor prefixes
    document.body.style.mozUserSelect = 'none'
    document.body.style.webkitUserSelect = 'none'
    document.body.style.userSelect = 'none'
    clickPoint.current = getCursorCoords()
    dragTimeout.current = window.setTimeout(handleDocumentMouseMove, minDragTime)
    clickTime.current = +(new Date())
    dragged.current = false
    draggingMarkerKey.current = getMarkerTouchingCursor()
  }, [minDragTime, handleDocumentMouseMove, getMarkerTouchingCursor])
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return () => {}
    }
    canvas.addEventListener('mousedown', handleCanvasMouseDown, false)
    return () => {
      canvas.removeEventListener('mousedown', handleCanvasMouseDown, false)
    }
  }, [handleCanvasMouseDown])

  const handleCanvasMouseUp = useCallback(() => {
    if (!dragged.current) {
      handleClick()
    }
  }, [handleClick])
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return () => {}
    }
    canvas.addEventListener('mouseup', handleCanvasMouseUp)
    return () => {
      canvas.removeEventListener('mouseup', handleCanvasMouseUp)
    }
  }, [handleCanvasMouseUp])

  const zoom = useMemo(() => (
    (clicks: number) => {
      if (!canvasRef.current) {
        return
      }
      const context = canvasRef.current.getContext('2d')
      if (!context) {
        return
      }

      const pt = getCursorCoords()
      if (pt === null) {
        return
      }
      context.translate(pt.x, pt.y)
      let factor = SCALE_FACTOR ** clicks
      // limit zoom to given ranges in props
      const transform = context.getTransform()
      if (factor > 1) {
        const maxScale = Math.max(transform.a, transform.d)
        if (maxScale * factor > maxImageZoom) {
          factor = maxImageZoom / maxScale
        }
      } else {
        const minScale = Math.max(transform.a, transform.d)
        if (minScale * factor < minImageZoom) {
          factor = minImageZoom / minScale
        }
      }
      context.scale(factor, factor)
      context.translate(-pt.x, -pt.y)
      redraw('zoom')
    }
  ), [maxImageZoom, minImageZoom, redraw])
  const handleScroll = useCallback((event: Event) => {
    animationCancel.current = true

    // @ts-ignore
    let delta = event.deltaY
    if (delta) {
      delta /= 40
    // @ts-ignore
    } else if (event.detail) {
      // @ts-ignore
      delta = -event.detail
    } else {
      delta = 0
    }
    if (delta) {
      zoom(delta)
    }
    event.preventDefault()
    event.stopPropagation()
    return false
  }, [zoom])
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return () => {}
    }
    canvas.addEventListener('DOMMouseScroll', handleScroll, false)
    canvas.addEventListener('mousewheel', handleScroll, false)
    return () => {
      canvas.removeEventListener('DOMMouseScroll', handleScroll, false)
      canvas.removeEventListener('mousewheel', handleScroll, false)
    }
  }, [handleScroll])

  const handleDocumentKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.which === KEYDOWN_ESCAPE) {
      if (typeof draggingMarkerKey.current === 'string') {
        const draggingMarker = getMarkerChild(draggingMarkerKey.current)
        if (draggingMarker && typeof draggingMarker.props.onDragCancel === 'function') {
          draggingMarker.props.onDragCancel()
        }
      }
      clickPoint.current = null
      dragged.current = false
      redraw('mouse down')
    }
  }, [redraw])
  useEffect(() => {
    document.addEventListener('keydown', handleDocumentKeyDown, false)
    return () => {
      document.removeEventListener('keydown', handleDocumentKeyDown, false)
    }
  }, [handleDocumentKeyDown])

  const handleDragOver = useCallback((event: MouseEvent) => {
    if (!canvasRef.current) {
      return
    }
    const rect = canvasRef.current.getBoundingClientRect()
    if (event) {
      cursor.current = {
        x: event.clientX - rect.x,
        y: event.clientY - rect.y,
      }
      updateMouseCoords()
    }
  }, [updateMouseCoords])
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return () => {}
    }
    canvas.addEventListener('dragover', handleDragOver, false)
    return () => {
      canvas.removeEventListener('dragover', handleDragOver, false)
    }
  }, [handleDragOver])

  const handleDoubleClick = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const context = extendContext(canvasRef.current.getContext('2d'))
    if (!context) {
      return
    }

    let clickedMarker: React.ReactElement | undefined
    if (draggingMarkerKey.current) {
      clickedMarker = getMarkerChild(draggingMarkerKey.current)
    } else {
      const hovered = getMarkerTouchingCursor()
      if (hovered) {
        clickedMarker = getMarkerChild(hovered)
      }
    }
    if (clickedMarker) {
      if (typeof clickedMarker.props.onDoubleClick === 'function') {
        clickedMarker.props.onDoubleClick()
      }
    } else if (
      cursor.current &&
      typeof onDoubleClick === 'function'
    ) {
      const pt = context.transformedPoint(cursor.current.x, cursor.current.y)
      onDoubleClick(pt)
    }
  }, [onDoubleClick, getMarkerTouchingCursor])
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return () => {}
    }
    canvas.addEventListener('dblclick', handleDoubleClick)
    return () => {
      canvas.removeEventListener('dblclick', handleDoubleClick)
    }
  }, [handleDoubleClick])

  useEffect(() => {
    mapImageValid.current = false
    mapImage.current = new Image()
    mapImage.current.src = image
    mapImage.current.onload = handleImageLoad
    redraw('new image')
  }, [image, handleImageLoad, redraw])
  useEffect(() => {
    if (mapImage.current) {
      mapImage.current.onload = handleImageLoad
    }
  }, [handleImageLoad])

  useEffect(() => {
    resize()
  }, [resize])

  const animate = useCallback((timestamp: number) => {
    if (animationCancel.current) {
      animationStart.current = null
      animationCancel.current = false
      animationActive.current = false
      return
    }

    if (!canvasRef.current) {
      // abort and try later
      window.requestAnimationFrame(animate)
      return
    }
    const rect = canvasRef.current.getBoundingClientRect()
    const context = canvasRef.current.getContext('2d')
    if (!context) {
      return
    }
    const transform = context.getTransform()

    if (!animationStart.current) {
      animationStart.current = timestamp
      animationLastTimestamp.current = timestamp
    }

    const deltaMs = timestamp - animationLastTimestamp.current
    animationLastTimestamp.current = timestamp

    let panDone = true
    if (animationCoords.current) {
      const current = {
        x: ((rect.width / 2) - transform.e) / transform.a,
        y: ((rect.height / 2) - transform.f) / transform.d,
      }
      const desired = animationCoords.current

      const diff = {
        x: desired.x - current.x,
        y: desired.y - current.y,
      }
      const dist = Math.sqrt((diff.x ** 2) + (diff.y ** 2))
      panDone = dist < 1
      if (!panDone) {
        const delta = Math.min(Math.max(deltaMs * 0.005, 0), 1)
        context.translate(-diff.x * delta, -diff.y * delta)
      } else {
        context.translate(-diff.x, -diff.y)
        animationCoords.current = null
      }
    }

    redraw('animation')

    animationActive.current = !panDone
    if (!panDone) {
      window.requestAnimationFrame(animate)
    }
  }, [redraw])
  const animatePanTo = useCallback((coords: Coords) => {
    animationCancel.current = false
    animationStart.current = null
    animationCoords.current = coords
    if (!animationActive.current) {
      window.requestAnimationFrame(animate)
    }
    animationActive.current = true
  }, [animate])
  useEffect(() => {
    if (panTo) {
      animatePanTo(panTo)
    }
  }, [panTo, animatePanTo])

  return (
    <div ref={containerRef} style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    }}>
      <canvas ref={(node) => {
        if (!node) {
          return
        }
        (canvasRef as React.MutableRefObject<HTMLCanvasElement>).current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          // eslint-disable-next-line no-param-reassign
          (ref as React.MutableRefObject<HTMLCanvasElement>).current = node
        }
      }} style={{position: 'absolute', width: '100%', height: '100%'}} />
      <div ref={tooltipsRef}>
        {tooltipChildren}
      </div>
    </div>
  )
})

export { Map }
export type { MapProps }

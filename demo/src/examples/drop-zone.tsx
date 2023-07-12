import React, { useState, useRef, useCallback } from 'react'
import * as ReactDOM from 'react-dom/client'
import { Map, Marker, DropZone } from 'react-canvas-map'
import type { Coords } from 'react-canvas-map'

interface MarkerData {
  key: string
  coords: Coords
}

interface DragState {
  marker: string
  coords: Coords
}

const DropZoneExample = () => {
  const [markerImage] = useState(() => {
    const image = new Image()
    image.src = '../static/marker-blue.svg'
    return image
  })
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const nextMarkerIndex = useRef<number>(1)
  const handleMapClick = useCallback((coords: Coords) => {
    setMarkers((prev) => [
      ...prev,
      {
        key: `marker-${nextMarkerIndex.current++}`,
        coords,
      },
    ])
  }, [])
  const [dragState, setDragState] = useState<DragState | null>(null)
  const handleZoneDrop = useCallback((markerKey: string) => {
    setMarkers((prev) => (prev.filter((marker) => (marker.key !== markerKey))))
    setDragState(null)
  }, [])
  return (
    <>
      <p>Click map to create markers. Drag them into the top right zone to destroy.</p>
      <div style={{height: '50vh', border: '1px solid #ddd', marginTop: '1rem'}}>
        <Map
          image="../static/map.jpg"
          onClick={handleMapClick}
        >
          {markers.map((marker) => {
            // eslint-disable-next-line prefer-destructuring
            let coords = marker.coords
            if (dragState !== null && dragState.marker === marker.key) {
              coords = dragState.coords
            }
            const updateMarker = (dragCoords: Coords) => {
              setMarkers((prev) => (
                prev.map((oldMarker) => {
                  if (oldMarker.key === marker.key) {
                    return {
                      ...oldMarker,
                      coords: dragCoords,
                    }
                  }
                  return oldMarker
                })
              ))
            }
            return (
              <Marker
                key={marker.key}
                markerKey={marker.key}
                coords={coords}
                image={markerImage}
                onDragTick={(dragCoords) => {
                  setDragState({
                    marker: marker.key,
                    coords: dragCoords,
                  })
                }}
                onDragEnd={(dragCoords) => {
                  updateMarker(dragCoords)
                  setDragState(null)
                }}
              />
            )
          })}
          <DropZone
            onDrop={handleZoneDrop}
            colour="#fff"
            backgroundColour="#f00"
            right={0}
            top={0}
            width={100}
            height={100}
            label="Destroy"
          />
        </Map>
      </div>
    </>
  )
}

const container = document.querySelector('div.demo-mount-drop-zone')
if (container) {
  const root = ReactDOM.createRoot(container)
  root.render(<DropZoneExample />)
}

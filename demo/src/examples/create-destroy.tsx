import React, { useState, useRef, useCallback } from 'react'
import * as ReactDOM from 'react-dom/client'
import { Map, Marker } from 'react-canvas-map'
import type { Coords } from 'react-canvas-map'

interface MarkerData {
  key: string
  coords: Coords
}

const CreateDestroyExample = () => {
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
  return (
    <>
      <p>Click map to create markers. Click the markers to destroy them.</p>
      <div style={{height: '50vh', border: '1px solid #ddd', marginTop: '1rem'}}>
        <Map
          image="../static/map.jpg"
          onClick={handleMapClick}
        >
          {markers.map((marker, markerIndex) => {
            const destroyMarker = () => {
              const newMarkers = [...markers]
              newMarkers.splice(markerIndex, 1)
              setMarkers(newMarkers)
            }
            return (
              <Marker
                key={marker.key}
                markerKey={marker.key}
                coords={marker.coords}
                image={markerImage}
                onClick={destroyMarker}
              />
            )
          })}
        </Map>
      </div>
    </>
  )
}

const container = document.querySelector('div.demo-mount-create-destroy')
if (container) {
  const root = ReactDOM.createRoot(container)
  root.render(<CreateDestroyExample />)
}

import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { Map, Marker, DropZone } from 'react-canvas-map'
import type { Coords } from 'react-canvas-map'

const markerImage = new Image()
markerImage.src = `../static/marker-blue.svg`

interface MarkerData extends Coords {
  key: string
}

interface DragState {
  marker: string
  coords: Coords
}

const DropZoneExample = () => {
  const [markers, setMarkers] = useState(new Array<MarkerData>())
  const [dragState, setDragState] = useState<DragState | null>(null)
  const destroyMarker = (index) => {
    const newMarkers = [...markers]
    newMarkers.splice(index, 1)
    setMarkers(newMarkers)
  }
  return (
    <>
      <p>Click map to create markers. Drag them into the top right zone to destroy.</p>
      <div style={{height: '50vh', border: '1px solid #ddd', marginTop: '1rem'}}>
        <Map
          image="../static/map.jpg"
          onClick={(coords) => {
            setMarkers((prevMarkers) => [
              ...prevMarkers,
              {
                key: `marker-${prevMarkers.length + 1}`,
                coords,
              },
            ])
          }}
        >
          {markers.map((marker, markerIndex) => {
            let coords = marker
            if (dragState !== null && dragState.marker === marker.key) {
              coords = dragState.coords
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
                  setMarkers((prevMarkers) => (
                    prevMarkers.map((oldMarker, oldMarkerIndex) => {
                      if (oldMarkerIndex === markerIndex) {
                        return dragCoords
                      }
                      return oldMarker
                    })
                  ))
                  setDragState(null)
                }}
                markerIndex={markerIndex}
              />
            )
          })}
          <DropZone
            onDrop={(item) => {
              setDragState(null)
              destroyMarker(item.markerIndex)
            }}
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

const mount = document.querySelector('div.demo-mount-drop-zone')
if (mount) {
  ReactDOM.render(<DropZoneExample />, mount)
}

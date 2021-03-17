import React, { useState } from 'react'
import ReactDOM from 'react-dom'

import Map, { Marker, DropZone } from 'react-canvas-map'

const markerImage = new Image()
markerImage.src = '/static/marker-blue.svg'

function DropZoneExample(props) {
  const [markers, setMarkers] = useState([])
  const [dragState, setDragState] = useState(null)
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
          image="/static/map.jpg"
          onClick={(coords) => {
            setMarkers([...markers, coords])
          }}
        >
          {markers.map((marker, markerIndex) => {
            let coords = marker
            if (dragState !== null && dragState.markerIndex === markerIndex) {
              coords = dragState.coords
            }
            return (
              <Marker
                key={`marker-${markerIndex}`}
                markerKey={`marker-${markerIndex}`}
                coords={coords}
                image={markerImage}
                onDragTick={(coords) => {
                  setDragState({
                    markerIndex,
                    coords,
                  })
                }}
                onDragEnd={(coords) => {
                  const newMarkers = markers.map((oldMarker, oldMarkerIndex) => {
                    if (oldMarkerIndex === markerIndex) {
                      return coords
                    }
                    return oldMarker
                  })
                  setMarkers(newMarkers)
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

const mount = document.querySelectorAll('div.demo-mount-drop-zone')
if (mount.length) {
  ReactDOM.render(<DropZoneExample />, mount[0])
}

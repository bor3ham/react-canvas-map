import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { Map, Marker } from 'react-canvas-map'
import type { Coords } from 'react-canvas-map'

const markerImage = new Image()
markerImage.src = '../static/marker-blue.svg'

interface MarkerData extends Coords {
  key: string
}

const CreateDestroyExample = () => {
  const [markers, setMarkers] = useState(new Array<MarkerData>())
  return (
    <>
      <p>Click map to create markers. Click the markers to destroy them.</p>
      <div style={{height: '50vh', border: '1px solid #ddd', marginTop: '1rem'}}>
        <Map
          image="../static/map.jpg"
          onClick={(coords) => {
            setMarkers(prevMarkers => [
              ...prevMarkers,
              {
                key: `marker-${prevMarkers.length + 1}`,
                coords,
              }
            ])
          }}
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
                coords={marker}
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

const mount = document.querySelector('div.demo-mount-create-destroy')
if (mount) {
  ReactDOM.render(<CreateDestroyExample />, mount)
}

import React, { useState } from 'react'
import ReactDOM from 'react-dom'

import Map, { Marker } from 'react-canvas-map'

const markerImage = new Image()
markerImage.src = '../../static/marker-blue.svg'

function CreateDestroyExample(props) {
  const [markers, setMarkers] = useState([])
  return (
    <>
      <p>Click map to create markers. Click the markers to destroy them.</p>
      <div style={{height: '50vh', border: '1px solid #ddd', marginTop: '1rem'}}>
        <Map
          image="../../static/map.jpg"
          onClick={(coords) => {
            setMarkers([...markers, coords])
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
                key={`marker-${markerIndex}`}
                markerKey={`marker-${markerIndex}`}
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

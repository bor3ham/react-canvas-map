import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'

import Map, { Marker } from 'react-canvas-map'

function CreateDestroy(props) {
  const markerImage = useRef()
  useEffect(() => {
    markerImage.current = new Image()
    markerImage.current.src = '/static/marker-blue.svg'
  }, [])
  const [markers, setMarkers] = useState([])
  return (
    <>
      <p>Click map to create markers, click the markers to destroy them.</p>
      <div style={{height: '50vh', border: '1px solid #ddd', marginTop: '1rem'}}>
        <Map
          image="/static/map.jpg"
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
                image={markerImage.current}
                onClick={destroyMarker}
              />
            )
          })}
        </Map>
      </div>
    </>
  )
}

const mount = document.querySelectorAll('div.demo-mount-create-destroy')
if (mount.length) {
  ReactDOM.render(<CreateDestroy />, mount[0])
}

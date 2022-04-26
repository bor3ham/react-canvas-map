import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { Map, Marker, Tooltip } from 'react-canvas-map'

const markerImage = new Image()
markerImage.src = `../static/marker-blue.svg`

function TooltipsExample(props) {
  const [markers] = useState([
    {x: 100, y: 200},
    {x: 200, y: 500},
  ])
  const [activeMarker, setActiveMarker] = useState(null)
  return (
    <>
      <p>Click on a marker to open the tooltip.</p>
      <div style={{height: '50vh', border: '1px solid #ddd', marginTop: '1rem'}}>
        <Map
          image="../static/map.jpg"
          onClick={() => {setActiveMarker(null)}}
        >
          {markers.map((marker, markerIndex) => {
            const active = markerIndex === activeMarker
            return (
              <>
                <Marker
                  key={`marker-${markerIndex}`}
                  markerKey={`marker-${markerIndex}`}
                  coords={marker}
                  image={markerImage}
                  onClick={() => {
                    setActiveMarker(markerIndex)
                  }}
                  markerIndex={markerIndex}
                />
                {active && (
                  <Tooltip coords={marker}>
                    <p>A link looks <a href="/">like this</a>.</p>
                    <p>I am marker {JSON.stringify(marker)}</p>
                  </Tooltip>
                )}
              </>
            )
          })}
        </Map>
      </div>
    </>
  )
}

const mount = document.querySelector('div.demo-mount-tooltips')
if (mount) {
  ReactDOM.render(<TooltipsExample />, mount)
}

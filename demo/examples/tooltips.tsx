import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { Map, Marker, Tooltip } from 'react-canvas-map'
import type { Coords } from 'react-canvas-map'

const markerImage = new Image()
markerImage.src = `../static/marker-blue.svg`

interface MarkerData extends Coords {
  key: string
}

const TooltipsExample = () => {
  const [markers] = useState([
    {x: 100, y: 200, key: 'marker-1'} as MarkerData,
    {x: 200, y: 500, key: 'marker-2'} as MarkerData,
  ])
  const [activeMarker, setActiveMarker] = useState<string | null>(null)
  return (
    <>
      <p>Click on a marker to open the tooltip.</p>
      <div style={{height: '50vh', border: '1px solid #ddd', marginTop: '1rem'}}>
        <Map
          image="../static/map.jpg"
          onClick={() => {setActiveMarker(null)}}
        >
          {markers.map((marker) => {
            const active = marker.key === activeMarker
            return (
              <React.Fragment key={marker.key}>
                <Marker
                  markerKey={marker.key}
                  coords={marker}
                  image={markerImage}
                  onClick={() => {
                    setActiveMarker(marker.key)
                  }}
                />
                {active && (
                  <Tooltip coords={marker}>
                    <p>A link looks <a href="/">like this</a>.</p>
                    <p>I am marker {JSON.stringify(marker)}</p>
                  </Tooltip>
                )}
              </React.Fragment>
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

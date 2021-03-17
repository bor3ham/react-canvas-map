import React, { useState } from 'react'
import ReactDOM from 'react-dom'

import Map, { Marker } from 'react-canvas-map'

const markerOneImage = new Image()
markerOneImage.src = '../static/marker-blue.svg'
const markerTwoImage = new Image()
markerTwoImage.src = '../static/marker-red.svg'

function BasicExample(props) {
  const [markerOneCoords, setMarkerOneCoords] = useState({x: 100, y: 200})
  const [markerTwoCoords, setMarkerTwoCoords] = useState({x: 150, y: 20})
  return (
    <div style={{height: '50vh', border: '1px solid #ddd', marginTop: '1rem'}}>
      <Map
        image="../static/map.jpg"
      >
        <Marker
          markerKey="marker-one"
          coords={markerOneCoords}
          onDragTick={setMarkerOneCoords}
          onDragEnd={setMarkerOneCoords}
          image={markerOneImage}
          onClick={() => {
            alert('You clicked marker one!')
          }}
        />
        <Marker
          markerKey="marker-two"
          coords={markerTwoCoords}
          onDragTick={setMarkerTwoCoords}
          onDragEnd={setMarkerTwoCoords}
          image={markerTwoImage}
          onClick={() => {
            alert('You clicked marker two!')
          }}
        />
      </Map>
    </div>
  )
}

const mount = document.querySelector('div.demo-mount-basic')
if (mount) {
  ReactDOM.render(<BasicExample />, mount)
}

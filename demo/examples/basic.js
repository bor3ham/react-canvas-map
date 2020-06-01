import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'

import Map, { Marker } from 'react-canvas-map'

function Basic(props) {
  const [markerOneImage] = useState(new Image())
  const [markerTwoImage] = useState(new Image())
  useEffect(() => {
    markerOneImage.src = 'https://loremflickr.com/100/100'
    markerTwoImage.src = 'https://loremflickr.com/100/100'
  }, [])
  const [markerOneCoords, setMarkerOneCoords] = useState({x: 100, y: 200})
  const [markerTwoCoords, setMarkerTwoCoords] = useState({x: 150, y: 20})
  return (
    <div style={{height: '50vh', border: '1px solid #ddd', marginTop: '1rem'}}>
      <Map
        image="https://loremflickr.com/800/600"
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

const mount = document.querySelectorAll('div.demo-mount-basic')
if (mount.length) {
  ReactDOM.render(<Basic />, mount[0])
}

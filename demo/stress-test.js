import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'

import Map from 'react-canvas-map'

function randomRange(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomMap() {
  const minLength = 200
  const maxLength = 800
  const length = randomRange(minLength, maxLength)
  return `https://placekitten.com/${length}/${Math.max(maxLength - length, minLength)}`
}

function StressTest(props) {
  const [mapImage, setMapImage] = useState(null)
  const randomiseImage = () => {
    setMapImage(randomMap())
  }
  useEffect(() => {
    randomiseImage()
    window.setInterval(randomiseImage, 10 * 1000)
    return () => {
      window.clearInterval(randomiseImage)
    }
  }, [])

  return (
    <>
      <h2>Changing Map Image</h2>
      <button onClick={() => {
        randomiseImage()
      }}>
        New Image
      </button>
      <div style={{height: '50vh', border: '1px solid #ddd', marginTop: '1rem'}}>
        {!!mapImage && (
          <Map
            image={mapImage}
          />
        )}
      </div>
    </>
  )
}

const mount = document.querySelector('div.stress-test-mount')
if (mount) {
  ReactDOM.render(<StressTest />, mount)
}

import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { Map, Marker } from 'react-canvas-map'
import type { Coords } from 'react-canvas-map'
import { Checkbox, Button } from 'mireco/inputs'

const markerImage = new Image()
markerImage.src = `./static/marker-blue.svg`

const MAP_INTERVAL_SECONDS = 5
const MARKERS_INTERVAL_MS = 100
const PAN_INTERVAL_SECONDS = 2

function randomRange(min, max) {
  return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min)
}

function randomMap() {
  const minLength = 200
  const maxLength = 800
  const length = randomRange(minLength, maxLength)
  return `https://placekitten.com/${length}/${Math.max(maxLength - length, minLength)}`
}

function randomPoint() {
  return {
    x: randomRange(0, 400),
    y: randomRange(0, 400),
  } as Coords
}

const StressTest = () => {
  const [mapImage, setMapImage] = useState(randomMap())
  const randomiseImage = () => {
    setMapImage(randomMap())
  }

  const [rotateMap, setRotateMap] = useState(false)
  const rotateMapRef = useRef(rotateMap)
  rotateMapRef.current = rotateMap
  useEffect(() => {
    const rotateMapImage = () => {
      if (rotateMapRef.current) {
        randomiseImage()
      }
    }
    const interval = window.setInterval(rotateMapImage, MAP_INTERVAL_SECONDS * 1000)
    return () => {
      window.clearInterval(interval)
    }
  }, [])

  const [markers, setMarkers] = useState(Array.from(Array(100), randomPoint))

  const [rotateMarkers, setRotateMarkers] = useState(true)
  const rotateMarkersRef = useRef(rotateMarkers)
  rotateMarkersRef.current = rotateMarkers
  useEffect(() => {
    const rotateMarkersLocations = () => {
      if (rotateMarkersRef.current) {
        setMarkers((prevMarkers) => {
          const newMarkers = [...prevMarkers]
          newMarkers.splice(Math.floor(Math.random() * newMarkers.length), 1)
          newMarkers.push(randomPoint())
          return newMarkers
        })
      }
    }
    const interval = window.setInterval(rotateMarkersLocations, MARKERS_INTERVAL_MS)
    return () => {
      window.clearInterval(interval)
    }
  }, [])

  const [randomPan, setRandomPan] = useState(true)
  const [panTo, setPanTo] = useState(null)
  const randomPanRef = useRef(randomPan)
  randomPanRef.current = randomPan
  useEffect(() => {
    const randomPanAnimation = () => {
      if (randomPanRef.current) {
        setPanTo(randomPoint())
      }
    }
    const interval = window.setInterval(randomPanAnimation, PAN_INTERVAL_SECONDS * 1000)
    return () => {
      window.clearInterval(interval)
    }
  }, [])

  return (
    <>
      <Button block onClick={() => {
        randomiseImage()
      }}>
        New Image
      </Button>
      <Checkbox
        label={`New map image every ${MAP_INTERVAL_SECONDS} seconds`}
        value={rotateMap}
        onChange={(newValue) => {
          setRotateMap(newValue)
        }}
        block
      />
      <Checkbox
        label={`Adjust marker locations image every ${MARKERS_INTERVAL_MS} ms`}
        value={rotateMarkers}
        onChange={(newValue) => {
          setRotateMarkers(newValue)
        }}
        block
      />
      <Checkbox
        label={`Pan to random location every ${PAN_INTERVAL_SECONDS} seconds`}
        value={randomPan}
        onChange={(newValue) => {
          setRandomPan(newValue)
        }}
        block
      />

      <div style={{height: '50vh', border: '1px solid #ddd', marginTop: '1rem'}}>
        {!!mapImage && (
          <Map
            image={mapImage}
            onDoubleClick={(coords) => {
              setMarkers(prevMarkers => ([...prevMarkers, coords]))
            }}
            panTo={panTo}
          >
            {markers.map((marker, markerIndex) => {
              const markerKey = `marker-${markerIndex}`
              return (
                <Marker
                  key={markerKey}
                  markerKey={markerKey}
                  coords={marker}
                  image={markerImage}
                  size={10}
                  onDoubleClick={() => {
                    setMarkers((prevMarkers) => (prevMarkers.filter((_, oldMarkerIndex) => (
                      oldMarkerIndex !== markerIndex
                    ))))
                  }}
                />
              )
            })}
          </Map>
        )}
      </div>
    </>
  )
}

const mount = document.querySelector('div.stress-test-mount')
if (mount) {
  ReactDOM.render(<StressTest />, mount)
}

import React from 'react'
import ReactDOM from 'react-dom'

import { Map } from 'react-canvas-map'

function Basic(props) {
  return (
    <p>The basic example</p>
  )
}

const mount = document.querySelectorAll('div.demo-mount-basic')
if (mount.length) {
  ReactDOM.render(<Basic />, mount[0])
}

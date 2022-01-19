import React from 'react'
import PropTypes from 'prop-types'

import { coordsShape } from './shapes.js'

/* eslint-disable react/no-unused-prop-types */

function Tooltip(props) {
  return (
    <div
      style={{
        position: 'absolute',
        background: '#fff',
        border: '1px solid #ddd',
        width: props.width,
        height: props.height,
        padding: '0.5rem',
        boxSizing: 'border-box',
        transform: 'translateX(-50%)',
        userSelect: 'text',
        ...props.style,
      }}
      data-x={props.coords.x}
      data-y={props.coords.y}
    >
      {props.children}
    </div>
  )
}
Tooltip.propTypes = {
  coords: coordsShape.isRequired,
  children: PropTypes.node,
  style: PropTypes.object,
  width: PropTypes.string,
  height: PropTypes.string,
}
Tooltip.defaultProps = {
  width: '20rem',
}

export default Tooltip

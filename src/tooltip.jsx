import React from 'react'
import PropTypes from 'prop-types'

import { coordsShape } from './shapes.js'

function Tooltip(props) {
  return (
    <div
      style={{
        position: 'absolute',
        width: props.width,
        height: props.height,
        transform: 'translateX(-50%)',
        userSelect: 'text',
        marginTop: `-${props.arrowSize}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        ...props.style,
      }}
      data-x={props.coords.x}
      data-y={props.coords.y}
    >
      {props.arrowSize > 0 && (
        <>
          <span
            style={{
              display: 'inline-block',
              alignSelf: 'center',
              borderColor: 'transparent transparent #ddd',
              borderWidth: `${props.arrowSize + 2}px`,
              borderStyle: 'solid',
            }}
          />
          <span
            style={{
              alignSelf: 'center',
              display: 'inline-block',
              marginTop: `-${props.arrowSize * 2}px`,
              borderColor: 'transparent transparent #fff',
              borderWidth: `${props.arrowSize}px`,
              borderStyle: 'solid',
              zIndex: '1',
            }}
          />
        </>
      )}
      <div style={{
        background: '#fff',
        border: '1px solid #ddd',
        padding: '0.5rem',
        boxSizing: 'border-box',
        marginTop: '-1px',
        ...props.tooltipStyle,
      }}>
        {props.children}
      </div>
    </div>
  )
}
Tooltip.propTypes = {
  coords: coordsShape.isRequired,
  children: PropTypes.node,
  style: PropTypes.object,
  arrowSize: PropTypes.number,
  tooltipStyle: PropTypes.object,
  width: PropTypes.string,
  height: PropTypes.string,
}
Tooltip.defaultProps = {
  width: '20rem',
  arrowSize: 8,
}

export { Tooltip }

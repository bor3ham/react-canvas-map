import React from 'react'
import PropTypes from 'prop-types'

function DropZone() {
  return null
}
DropZone.propTypes = {
  right: PropTypes.number,
  left: PropTypes.number,
  top: PropTypes.number,
  bottom: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  label: PropTypes.string,
  colour: PropTypes.string,
  backgroundColour: PropTypes.string,
  fontSize: PropTypes.number,
  onDrop: PropTypes.func,
  image: PropTypes.object,
}
DropZone.defaultProps = {
  colour: '#fff',
  backgroundColour: '#0f0',
  fontSize: 24,
}

export { DropZone }

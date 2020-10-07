import PropTypes from 'prop-types'

import { coordsShape } from './shapes.js'

/* eslint-disable react/no-unused-prop-types */

function Marker(props) {
  return null
}
Marker.propTypes = {
  markerKey: PropTypes.string,
  coords: coordsShape.isRequired,

  image: PropTypes.object,
  inCircle: PropTypes.bool,
  circleColour: PropTypes.string,
  size: PropTypes.number,
  scaleWithZoom: PropTypes.bool,

  dragZoneScale: PropTypes.number,
  onDragTick: PropTypes.func,
  onDragEnd: PropTypes.func,
  onDragCancel: PropTypes.func,
}

Marker.defaultProps = {
  inCircle: false,
  circleColour: '#337ab7',
  size: 100,
  scaleWithZoom: true,
  dragZoneScale: 1,
}

export default Marker

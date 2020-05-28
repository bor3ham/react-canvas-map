import PropTypes from 'prop-types'

export const coordsShape = PropTypes.shape({
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
})

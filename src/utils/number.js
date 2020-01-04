const isNumeric = (value) => {
  return typeof value === 'number' || parseInt(value, 10) == value
}

module.exports = {
  isNumeric
}

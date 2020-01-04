let createElement
if (typeof window !== 'undefined') {
  createElement = document.createElement()
} else {
  const jsdom = require('jsdom-no-contextify').jsdom
  createElement = function(tag) {
    return jsdom().defaultView.document.createElement(tag)
  }
}

const tempEl = createElement('div')
const escapeSpecialChars = (text) => {
  tempEl.textContent = text
  return tempEl.innerHTML
}

module.exports = {
  createElement,
  escapeSpecialChars
}

const { isNumeric } = require('./number')

const ELEMENT_TAG_NAME_MAPPING = {
  a: 'a',
  altglyph: 'altGlyph',
  altglyphdef: 'altGlyphDef',
  altglyphitem: 'altGlyphItem',
  animate: 'animate',
  animatecolor: 'animateColor',
  animatemotion: 'animateMotion',
  animatetransform: 'animateTransform',
  audio: 'audio',
  canvas: 'canvas',
  circle: 'circle',
  clippath: 'clipPath',
  'color-profile': 'colorProfile',
  cursor: 'cursor',
  defs: 'defs',
  desc: 'desc',
  discard: 'discard',
  ellipse: 'ellipse',
  feblend: 'feBlend',
  fecolormatrix: 'feColorMatrix',
  fecomponenttransfer: 'feComponentTransfer',
  fecomposite: 'feComposite',
  feconvolvematrix: 'feConvolveMatrix',
  fediffuselighting: 'feDiffuseLighting',
  fedisplacementmap: 'feDisplacementMap',
  fedistantlight: 'feDistantLight',
  fedropshadow: 'feDropShadow',
  feflood: 'feFlood',
  fefunca: 'feFuncA',
  fefuncb: 'feFuncB',
  fefuncg: 'feFuncG',
  fefuncr: 'feFuncR',
  fegaussianblur: 'feGaussianBlur',
  feimage: 'feImage',
  femerge: 'feMerge',
  femergenode: 'feMergeNode',
  femorphology: 'feMorphology',
  feoffset: 'feOffset',
  fepointlight: 'fePointLight',
  fespecularlighting: 'feSpecularLighting',
  fespotlight: 'feSpotLight',
  fetile: 'feTile',
  feturbulence: 'feTurbulence',
  filter: 'filter',
  font: 'font',
  'font-face': 'fontFace',
  'font-face-format': 'fontFaceFormat',
  'font-face-name': 'fontFaceName',
  'font-face-src': 'fontFaceSrc',
  'font-face-uri': 'fontFaceUri',
  foreignobject: 'foreignObject',
  g: 'g',
  glyph: 'glyph',
  glyphref: 'glyphRef',
  hatch: 'hatch',
  hatchpath: 'hatchpath',
  hkern: 'hkern',
  iframe: 'iframe',
  image: 'image',
  line: 'line',
  lineargradient: 'linearGradient',
  marker: 'marker',
  mask: 'mask',
  mesh: 'mesh',
  meshgradient: 'meshgradient',
  meshpatch: 'meshpatch',
  meshrow: 'meshrow',
  metadata: 'metadata',
  'missing-glyph': 'missingGlyph',
  mpath: 'mpath',
  path: 'path',
  pattern: 'pattern',
  polygon: 'polygon',
  polyline: 'polyline',
  radialgradient: 'radialGradient',
  rect: 'rect',
  script: 'script',
  set: 'set',
  solidcolor: 'solidcolor',
  stop: 'stop',
  style: 'style',
  svg: 'svg',
  switch: 'switch',
  symbol: 'symbol',
  text: 'text',
  textpath: 'textPath',
  title: 'title',
  tref: 'tref',
  tspan: 'tspan',
  unknown: 'unknown',
  use: 'use',
  video: 'video',
  view: 'view',
  vkern: 'vkern'
}
const getJsxTagName = (tagName) => {
  const name = tagName.toLowerCase();

  if (Reflect.has(ELEMENT_TAG_NAME_MAPPING, name)) {
    name = ELEMENT_TAG_NAME_MAPPING[name];
  }

  return name
}

const getJSXStyle = (styles) => {
  const output = []
  styles.split(';')
    .forEach(style => {
      const firstColon = style.indexOf(':')
      const key = style.substr(0, firstColon).trim()
      const value = style.substr(firstColon + 1).trim().toLowerCase()

      if (key !== '') {
        // 转换css的property为jsx的property
        let cssProperty = key
        if (/^-ms-/.test(cssProperty)) {
          cssProperty = cssProperty.substr(1)
        }
        cssProperty = cssProperty.replace(/-(.)/g, (_, chr) => chr.toUpperCase())

        let cssValue = value
        if (!isNumeric(cssValue)) {
          cssValue = '\'' + cssValue.replace('\'', '"') + '\''
        }

        output.push(`${cssProperty}: ${cssValue}`)
      }
    })
  return '{ ' + output.join(', ') + ' }'
}

const ATTRIBUTE_MAPPING = {
  'for': 'htmlFor',
  'class': 'className'
}
const ELEMENT_ATTRIBUTE_MAPPING = {
  'input': {
    'checked': 'defaultChecked',
    'value': 'defaultValue'
  }
}
const getJSXAttributeName = (tagName, attributeName) => {
  return ( 
      ELEMENT_ATTRIBUTE_MAPPING[tagName] &&
      ELEMENT_ATTRIBUTE_MAPPING[tagName][attributeName]
    ) ||
    ATTRIBUTE_MAPPING[attributeName] ||
    attributeName
}

module.exports = {
  getJsxTagName,
  getJSXStyle,
  getJSXAttributeName
}

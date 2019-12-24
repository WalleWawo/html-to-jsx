const NODE_TYPE = {
  ELEMENT: 1,
  TEXT: 3,
  COMMENT: 8
}

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

const defaultProps = {
  indent: '  '
}

let createElement
if (typeof window !== 'undefined') {
  createElement = document.createElement()
} else {
  const jsdom = require('jsdom-no-contextify').jsdom
  createElement = function(tag) {
    return jsdom().defaultView.document.createElement(tag)
  }
}

const isEmtryText = (text) => {
  return /^\s*$/.test(text)
}

const getJsxTagName = (tagName) => {
  const name = tagName.toLowerCase();

  if (Reflect.has(ELEMENT_TAG_NAME_MAPPING, name)) {
    name = ELEMENT_TAG_NAME_MAPPING[name];
  }

  return name
}

const tempEl = createElement('div')
const escapeSpecialChars = (text) => {
  tempEl.textContent = text
  return tempEl.innerHTML
}

class HtmlToJSX {

  constructor (props = {}) {
    this.indent = props.indent || defaultProps.indent
  }

  convert (html) {
    if (!html) {
      return ''
    }

    const containerEl = createElement('div')
    containerEl.innerHTML = '\n' + html + '\n'

    // 如果包含script标签, 则抛出错误
    if (containerEl.querySelector('script')) {
      throw new Error('html中不可以包含<script>标签')
    }

    // 确保顶级只有一个element节点, 否则直接给react渲染会报错
    if (this.onlyOneTopElement(containerEl)) {
      let output = ''
      for (let i = 0; i < containerEl.childNodes.length; i++) {
        output += this.domToJSX(containerEl.childNodes[i])
      }
      return output
    } else {
      return this.domToJSX(containerEl)
    }
  }

  onlyOneTopElement (containerEl) {
    const childNodes = containerEl.childNodes
    if (childNodes.length === 1 && childNodes[0].nodeType === NODE_TYPE.ELEMENT) return true

    let hasElement = false
    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i]
      switch (child.nodeType) {
        case NODE_TYPE.ELEMENT:
          if (hasElement) {
            return false
          } else {
            hasElement = true
          }
          break
        case NODE_TYPE.COMMENT:
          if (isEmtryText(child.textContent)) {
            return false
          }
          break
        default:
      }
    }
    return true
  }

  domToJSX (element, level = 0) {
    let output = ''
    
    switch (element.nodeType) {
      case NODE_TYPE.ELEMENT:
        output += this.visitStartTag(element)
        output += this.visitInner(element, level)
        output += this.visitCloseTag(element)
        break
      case NODE_TYPE.TEXT:
        const parentTag = element.parentNode && getJsxTagName(element.parentNode.tagName)
        if (['textarea', 'style'].includes(parentTag)) {
          return
        }
        const text = escapeSpecialChars(element.textContent)

        if (isEmtryText(text)) {
          output += text
        } else {
          output += '{\'' + text.replace(/\{|\}|\'/g, brace => '\\' + brace) + '\'}'
        }
        break
      case NODE_TYPE.COMMENT:
        output += '{/*' + element.textContent.replace(/\//g, '\\/') + '*/}'
        break
      default:
        const tmpNode = document.createElement('div')
        tmpNode.appendChild('element')
        console.warn(`不被认可的节点类型: ${element.nodeType}, 内容: ${tmpNode.innerHTML}`)
    }

    return output
  }

  visitStartTag (element, level) {
    const tagName = getJsxTagName(element.tagName)

    const attributes = []
    for (let i = 0; i < element.attributes.length; i++) {
      attributes.push(this.getElementAttribute(element, element.attributes[i]));
    }
    if (tagName === 'textarea') {
      // Hax: textareas need their inner text moved to a "defaultValue" attribute.
      attributes.push('defaultValue={' + JSON.stringify(element.value) + '}');
    }
    if (tagName === 'style') {
      // Hax: style tag contents need to be dangerously set due to liberal curly brace usage
      attributes.push('dangerouslySetInnerHTML={{__html: ' + JSON.stringify(element.textContent) + ' }}');
    }

    let output = '<' + tagName
    if (attributes.length > 0) {
      output += ' ' + attributes.join(' ');
    }
    output += '>'

    return output
  }

  getElementAttribute (element, attribute) {
    return attribute.name + '=\'' + attribute.value + '\''
  }

  visitInner (element, level) {
    let output = ''
    for (let i = 0; i < element.childNodes.length; i++) {
      output += this.domToJSX(element.childNodes[i], level + 1);
    }
    return output
  }

  visitCloseTag (element) {
    const tagName = getJsxTagName(element.tagName)
    return `</${tagName}>`
  }
}

module.exports = HtmlToJSX

const { createElement, escapeSpecialChars } = require('./utils/html-dom')
const { getJsxTagName, getJSXStyle, getJSXAttributeName } = require('./utils/jsx-dom')
const { isNumeric } = require('./utils/number')
const { isEmpty: isEmptyText } = require('./utils/string')

const NODE_TYPE = {
  ELEMENT: 1,
  TEXT: 3,
  COMMENT: 8
}

const defaultProps = {
  indent: '  '
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

    // 确保顶级只有一个dom节点, 否则直接给react渲染会报错
    if (this.onlyOneTopElement(containerEl)) {
      let output = ''
      for (let i = 0; i < containerEl.childNodes.length; i++) {
        output += this.domToJSX({ node: containerEl.childNodes[i] })
      }
      return output
    } else {
      return this.domToJSX({ node: containerEl })
    }
  }

  // 是否只有一个顶层节点
  // 
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
        case NODE_TYPE.TEXT:
          if (isEmptyText(child.textContent)) {
            return false
          }
          break
        default:
      }
    }
    return true
  }

  domToJSX ({ node, level = 0 }) {
    let output = ''
    const indent = new Array(level + 1).join(this.indent)

    switch (node.nodeType) {
      case NODE_TYPE.ELEMENT:
        output += level > 0 ? '\n' : ''
        output += this.visitElement({ node, indent, level })
        break
      case NODE_TYPE.TEXT:
        output += this.visitText({ node, indent, level })
        break
      case NODE_TYPE.COMMENT:
        output += this.visitComment({ node, indent, level })
        break
      default:
        const tmpNode = document.createElement('div')
        tmpNode.appendChild('element')
        console.warn(`不被认可的节点类型: ${node.nodeType}, 内容: ${tmpNode.innerHTML}`)
    }

    return output
  }

  visitElement ({ node, indent, level }) {
    const tagName = getJsxTagName(node.tagName)
    let output = ''
    if (!node.firstChild || tagName === 'textarea' || tagName === 'style') {
      output += this.visitStartTag({ node, tagName, level, indent, isSelfClosingTag: true })
    } else {
      output += this.visitStartTag({ node, tagName, level, indent, isSelfClosingTag: false })
      output += this.visitInner({ node, level, indent })
      output += this.visitCloseTag({ node, tagName, level, indent })
    }
    return output
  }

  visitStartTag ({ node, tagName, indent, isSelfClosingTag }) {
    const attributes = []
    for (let i = 0; i < node.attributes.length; i++) {
      attributes.push(this.getElementAttribute({ tagName, attribute: node.attributes[i] }));
    }
    if (tagName === 'textarea') {
      // Hax: textareas need their inner text moved to a "defaultValue" attribute.
      attributes.push('defaultValue={' + JSON.stringify(node.value) + '}');
    }
    if (tagName === 'style') {
      // Hax: style tag contents need to be dangerously set due to liberal curly brace usage
      attributes.push('dangerouslySetInnerHTML={{__html: ' + JSON.stringify(node.textContent) + ' }}');
    }

    let output = indent + '<' + tagName
    if (attributes.length > 0) {
      output += ' ' + attributes.join(' ');
    }
    output += isSelfClosingTag ? ' />' : '>' 

    return output
  }

  getElementAttribute ({ tagName, attribute }) {
    let output = ''
    switch (attribute.name) {
      case 'style':
        output += 'style={' + getJSXStyle(attribute.value) + '}'
        break
      default:
        const attributeName = getJSXAttributeName(tagName, attribute.name)

        output += attributeName
        if (isNumeric(attribute.value)) {
          output += '={' + attribute.value + '}';
        } else if (attribute.value.length > 0) {
          output += '="' + attribute.value.replace(/"/gm, '&quot;') + '"';
        } else if(attribute.value.length === 0 && attribute.name === 'alt') {
          output += '=""';
        }
    }
    return output
  }

  visitInner ({ node, level }) {
    let output = ''
    for (let i = 0; i < node.childNodes.length; i++) {
      output += this.domToJSX({ node: node.childNodes[i], level: level + 1 });
    }
    return output
  }

  visitCloseTag ({ node, tagName, indent }) {
    let output = ''
    if (node.childNodes.length > 1 || node.firstChild.textContent.trim().indexOf('\n') >= 0) {
      output += '\n' + indent
    }
    output += `</${tagName}>`
    return output
  }

  visitText ({ node, indent }) {
    const parentTag = node.parentNode && getJsxTagName(node.parentNode.tagName)
    if (['textarea', 'style'].includes(parentTag)) {
      return
    }
    const text = escapeSpecialChars(node.textContent.trim())

    if (!isEmptyText(text)) {
      let output = ''

      const mtext = text.split('\n')
      if (mtext.length > 1) {
        output += '\n'
        output += mtext
          .map(row => indent + '{\'' + row.trim().replace(/\{|\}|\'/g, brace => '\\' + brace) + '\'}')
          .join('\n')
      } else {
        output += '{\'' + mtext[0].trim().replace(/\{|\}|\'/g, brace => '\\' + brace) + '\'}'
      }
      return output
    } else {
      return ''
    }
  }

  visitComment ({ node, indent }) {
    return '\n' + indent + '{/*' + node.textContent.replace(/\//g, '\\/') + '*/}'
  }
}

module.exports = HtmlToJSX

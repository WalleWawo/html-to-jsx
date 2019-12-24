const fs = require('fs')
const path = require('path')

const HtmlToJSX = require('../src/index')

const converter = new HtmlToJSX()

console.log(converter.convert(fs.readFileSync(path.resolve(__dirname, './test.html'), 'utf-8')))

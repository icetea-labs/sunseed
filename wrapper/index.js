const fs = require('fs')
const path = require('path')

const header = fs.readFileSync(path.resolve(__dirname, 'header.js')).toString()
const footer = fs.readFileSync(path.resolve(__dirname, 'footer.js')).toString()

module.exports = src => `
${header}
${src}
${footer}
`
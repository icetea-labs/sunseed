module.exports = (src) => {
  return `
  let __return_value

${src}

  return __return_value
`
}

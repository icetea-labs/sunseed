const { getRequire } = require('./getRequire')
const { isWhitelistModule, isHttp } = require('../common')
const path = require('path')
const axios = require('axios')

module.exports = async (src, context, project, options = {}) => {
  const requires = getRequire(src)
  // eslint-disable-next-line no-undef
  const formData = new FormData()
  formData.append('src', src)
  if (Object.keys(requires).length) {
    await Promise.all(Object.keys(requires).map(async value => {
      if (isWhitelistModule(value) || (options.remote && options.remote[value])) {
        delete requires[value]
        return true
      }
      if (isHttp(value)) {
        if (!['.js', '.json'].includes(path.extname(value))) {
          throw new Error('"require" supports only .js and .json files.')
        }
        const data = (await axios.get(value)).data
        if (typeof data === 'string') {
          requires[value] = await module.exports.clientTransform(data, value, null, options)
        } else {
          requires[value] = data
        }
      }
      const filePath = path.join(context, value)
      const fileProject = project.getFile(filePath)
      if (!fileProject) {
        throw new Error('File not found ' + value)
      }
      // eslint-disable-next-line no-undef
      const file = new File([fileProject.getData()], fileProject.name)
      formData.append(filePath, file)
    }
    ))
  }
  const data = await axios.post('https://3k30.theydont.work//transpile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return data.data
}

const { getRequire } = require('./getRequire')
const { isWhitelistModule, isHttp } = require('../common')
const path = require('path')
const axios = require('axios')

const appendRequireToForm = async (requires, formData, context, project, options) => {
  await Promise.all(Object.keys(requires).map(async value => {
    if (isWhitelistModule(value) || (options.remote && options.remote[value])) {
      delete requires[value]
      return true
    }
    if (isHttp(value)) {
      if (!['.js', '.json'].includes(path.extname(value))) {
        throw new Error('"require" supports only .js and .json files.')
      }
      try {
        const data = (await axios.get(value)).data
        if (typeof data === 'string') {
          requires[value] = await module.exports(data, value, null, options)
        } else {
          requires[value] = data
        }
      } catch (err) {
        throw new Error('Cannot load content of: ', value)
      }
    } else {
      const filePath = path.join(context, value)
      const fileProject = project.getFile(filePath)
      if (!fileProject) {
        throw new Error('File not found ' + value)
      }
      const childRequire = getRequire(fileProject.getData())
      if (Object.keys(childRequire).length) {
        await appendRequireToForm(childRequire, formData, context, project, options)
      }
      // eslint-disable-next-line no-undef
      const file = new File([fileProject.getData()], fileProject.name)
      formData.append(filePath, file)
    }
  }
  ))
}

module.exports = async (src, context = 'src', project, options = {}) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const requires = getRequire(src)
    // eslint-disable-next-line no-undef
    const formData = new FormData()
    formData.append('src', src)
    if (Object.keys(requires).length) {
      await appendRequireToForm(requires, formData, context, project, options)
    }
    const data = await axios.post('https://3k30.theydont.work/transpile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return data.data
  } catch (err) {
    throw err
  }
}

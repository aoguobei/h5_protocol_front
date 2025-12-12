/**
 * 脚本注入工具函数
 * 用于在 HTML 中注入 JavaScript 代码
 */

/**
 * 创建 script 标签（避免 Vue 模板编译器警告）
 * @param {string} content - script 标签内的内容
 * @returns {string} 完整的 script 标签
 */
export const createScriptTag = (content) => {
  // eslint-disable-next-line no-useless-concat
  const scriptStart = '<' + 'script>'
  // eslint-disable-next-line no-useless-concat
  const scriptEnd = '</' + 'script>'
  return scriptStart + content + scriptEnd
}

/**
 * 通用脚本注入函数
 * @param {string} htmlContent - HTML 内容
 * @param {string} scriptContent - 要注入的脚本内容（完整的 script 标签）
 * @param {boolean} beforeUtils - 是否在 utils.js 之前注入
 * @returns {string} 注入脚本后的 HTML 内容
 */
export const injectScript = (htmlContent, scriptContent, beforeUtils = false) => {
  const scriptTag = 'script'
  
  if (beforeUtils) {
    // 在 utils.js 之前注入
    const utilsScriptPattern = new RegExp(`<${scriptTag}\\s+src\\s*=\\s*["']\\.\\/utils\\.js["']\\s*>`, 'i')
    if (utilsScriptPattern.test(htmlContent)) {
      return htmlContent.replace(utilsScriptPattern, scriptContent + '\n$&')
    }
  }
  
  // 在第一个 script 之前注入
  const firstScriptPattern = new RegExp(`<${scriptTag}`, 'i')
  if (firstScriptPattern.test(htmlContent)) {
    return htmlContent.replace(firstScriptPattern, scriptContent + '\n$&')
  }
  
  // 在 body 结束前插入
  if (/<\/body>/i.test(htmlContent)) {
    return htmlContent.replace(/<\/body>/i, scriptContent + '\n$&')
  }
  
  // 在 html 结束前插入
  if (/<\/html>/i.test(htmlContent)) {
    return htmlContent.replace(/<\/html>/i, scriptContent + '\n$&')
  }
  
  // 直接追加到末尾
  return htmlContent + '\n' + scriptContent
}

/**
 * 内联 utils.js 函数（避免 404 错误）
 * 将 <script src="./utils.js"></script> 替换为内联的 getParamsFromUrl 函数
 * @param {string} htmlContent - HTML 内容
 * @returns {string} 替换后的 HTML 内容
 */
export const inlineUtilsScript = (htmlContent) => {
  const utilsScript = createScriptTag(`
function getParamsFromUrl(url) {
  const params = {}
  const queryString = url.split('?')[1]
  if (queryString) {
    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=')
      params[key] = value
    })
  }
  return params
}
`)
  
  // 替换 utils.js 引用
  const scriptTag = 'script'
  const utilsPattern = new RegExp(`<${scriptTag}\\s+src\\s*=\\s*["']\\.\\/utils\\.js["']\\s*><\\/${scriptTag}>`, 'gi')
  if (utilsPattern.test(htmlContent)) {
    return htmlContent.replace(utilsPattern, utilsScript)
  }
  
  // 如果没有 utils.js，使用通用注入函数
  return injectScript(htmlContent, utilsScript)
}

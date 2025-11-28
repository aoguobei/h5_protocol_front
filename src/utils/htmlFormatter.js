import prettier from 'prettier'
import parserHtml from 'prettier/parser-html'

/**
 * 使用Prettier格式化HTML内容
 * @param {string} html - 需要格式化的HTML字符串
 * @returns {string} 格式化后的HTML字符串
 */
export const formatHTML = (html) => {
  if (!html) return html
  
  try {
    return prettier.format(html, {
      parser: 'html',
      plugins: [parserHtml],
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      bracketSpacing: true,
      jsxBracketSameLine: false,
    })
  } catch (error) {
    console.warn('HTML格式化失败:', error.message)
    // 如果格式化失败，返回原始内容
    return html
  }
}

/**
 * 清理HTML中的无用类名和样式
 * @param {string} html - 需要清理的HTML字符串
 * @returns {string} 清理后的HTML字符串
 */
export const cleanHTML = (html) => {
  if (!html) return html
  
  try {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
    
    // 判断无用类名的规则
    const isUselessClass = (className) => {
      return /^auto-/.test(className) || // auto- 开头
             /^br-/.test(className) || // br- 开头
             /^mce-/.test(className) || // mce- 开头
             /^cke_/.test(className) || // cke_ 开头
             /^[a-z]+-[A-Z0-9]{5,}$/i.test(className) || // 随机生成的类名
             /^paragraph-[A-Z0-9]+$/i.test(className) || // paragraph-xxx
             /^header-[A-Z0-9]+$/i.test(className) || // header-xxx
             className === 'paragraph-element' // paragraph-element
    }
    
    const uselessStyles = ['-webkit-font-smoothing', '-webkit-tap-highlight-color', 'outline', 'overflow-anchor']
    
    doc.querySelectorAll('*').forEach(el => {
      // 清理无用类名
      if (el.className) {
        const validClasses = el.className.split(/\s+/).filter(c => {
          if (!c) return false
          return !isUselessClass(c)
        })
        if (validClasses.length) {
          el.className = validClasses.join(' ')
        } else {
          el.removeAttribute('class')
        }
      }
      
      // 清理无用样式
      if (el.hasAttribute('style')) {
        uselessStyles.forEach(prop => el.style.removeProperty(prop))
        if (el.style.getPropertyValue('border') === '0px solid') {
          el.style.removeProperty('border')
        }
        if (!el.style.cssText.trim()) {
          el.removeAttribute('style')
        }
      }
    })
    
    return doc.body.innerHTML
  } catch (error) {
    console.warn('HTML清理失败:', error.message)
    return html
  }
}

/**
 * 将body内容包装回完整的HTML文档结构
 * @param {string} bodyContent - body部分的HTML内容
 * @param {string} originalHTML - 原始完整HTML文档
 * @returns {string} 完整的HTML文档
 */
export const wrapToFullHTML = (bodyContent, originalHTML) => {
  if (!isFullHTMLDocument(originalHTML)) {
    return bodyContent
  }
  
  // 提取原始HTML的head部分和其他元信息
  const parser = new DOMParser()
  const originalDoc = parser.parseFromString(originalHTML, 'text/html')
  
  // 构建新的HTML文档
  let newHTML = ''
  
  // 检查是否有DOCTYPE
  if (/<!DOCTYPE/i.test(originalHTML)) {
    const doctypeMatch = originalHTML.match(/<!DOCTYPE[^>]*>/i)
    if (doctypeMatch) {
      newHTML += doctypeMatch[0] + '\n'
    }
  }
  
  // 检查是否有html标签的属性（如lang）
  const htmlMatch = originalHTML.match(/<html[^>]*>/i)
  if (htmlMatch) {
    newHTML += htmlMatch[0] + '\n'
  } else {
    newHTML += '<html>\n'
  }
  
  // 添加head（如果有）
  if (originalDoc.head && originalDoc.head.innerHTML) {
    // 提取原始head标签及其所有属性
    const headMatch = originalHTML.match(/<head[^>]*>/i)
    let headTag = '<head>'
    if (headMatch) {
      headTag = headMatch[0]
    }
    newHTML += headTag + '\n' + originalDoc.head.innerHTML + '\n</head>\n'
  }
  
  // 提取原始body标签及其所有属性
  const bodyMatch = originalHTML.match(/<body[^>]*>/i)
  let bodyTag = '<body>'
  if (bodyMatch) {
    bodyTag = bodyMatch[0]
  }
  
  // 添加body内容（保留原始body标签属性）
  newHTML += bodyTag + '\n' + bodyContent + '\n</body>\n</html>'
  
  return newHTML
}

/**
 * 检查是否是完整的HTML文档（包含html和body标签）
 * @param {string} html - 需要检查的HTML字符串
 * @returns {boolean} 是否为完整HTML文档
 */
export const isFullHTMLDocument = (html) => {
  return /<!DOCTYPE\s+html/i.test(html) || /<html/i.test(html)
}

/**
 * 从完整HTML文档中提取body内容
 * @param {string} html - 完整HTML文档
 * @returns {string} body部分的HTML内容
 */
export const extractBodyContent = (html) => {
  if (!isFullHTMLDocument(html)) {
    return html
  }
  
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return doc.body.innerHTML
}
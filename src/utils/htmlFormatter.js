/**
 * 优化HTML样式（移除空段落、压缩空白、添加基础样式）
 * @param {string} html - 需要优化的HTML
 * @returns {string} 优化后的HTML
 * @example
 * optimizeHTMLStyles('<p></p><h1>Title</h1>') 
 * // => '<h1 style="margin: 16px 0; font-size: 24px; font-weight: bold;">Title</h1>'
 */
export const optimizeHTMLStyles = (html) => {
  // 移除空段落标签
  html = html.replace(/<p>\s*<\/p>/g, '')
  // 压缩多余空白字符为单个空格
  html = html.replace(/\s+/g, ' ')
  // 为段落添加基础间距样式
  html = html.replace(/<p>/g, '<p style="margin: 8px 0;">')
  // 为标题添加样式（间距、字号、加粗）
  html = html.replace(/<h1>/g, '<h1 style="margin: 16px 0; font-size: 24px; font-weight: bold;">')
  html = html.replace(/<h2>/g, '<h2 style="margin: 14px 0; font-size: 20px; font-weight: bold;">')
  html = html.replace(/<h3>/g, '<h3 style="margin: 12px 0; font-size: 18px; font-weight: bold;">')
  return html
}

/**
 * 将HTML内容包装成完整的HTML文档（带默认样式）
 * @param {string} html - HTML内容片段
 * @returns {string} 完整的HTML文档（包含DOCTYPE、head、body等）
 * @description 主要用于Word文档导入后的包装，添加了中文字体和基础排版样式
 */
export const wrapWordHTML = (html) => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>协议文档</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      line-height: 1.6;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    p { margin: 8px 0; }
    h1, h2, h3 { margin-top: 16px; margin-bottom: 8px; }
    ul, ol { margin: 8px 0; padding-left: 24px; }
    li { margin: 4px 0; }
  </style>
</head>
<body>
${html}
</body>
</html>`
}

/**
 * 将body内容包装回完整的HTML文档结构（保留原始head和属性）
 * @param {string} bodyContent - body部分的HTML内容
 * @param {string} originalHTML - 原始完整HTML文档（用于提取head和标签属性）
 * @returns {string} 完整的HTML文档
 * @description 用于富文本编辑后重新组装HTML，保留原始文档的DOCTYPE、head、标签属性等
 */
export const wrapToFullHTML = (bodyContent, originalHTML) => {
  // 如果不是完整文档，直接返回body内容
  if (!isFullHTMLDocument(originalHTML)) {
    return bodyContent
  }

  // 解析原始HTML以提取head和标签属性
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
 * 检查是否是完整的HTML文档（包含DOCTYPE或html标签）
 * @param {string} html - 需要检查的HTML字符串
 * @returns {boolean} true表示完整文档，false表示HTML片段
 */
export const isFullHTMLDocument = (html) => {
  return /<!DOCTYPE\s+html/i.test(html) || /<html/i.test(html)
}

/**
 * 从完整HTML文档中提取body内容
 * @param {string} html - 完整HTML文档或HTML片段
 * @returns {string} body部分的HTML内容（如果是片段则直接返回）
 * @description 用于富文本编辑器显示内容时，只提取body部分
 */
export const extractBodyContent = (html) => {
  // 如果不是完整文档，直接返回
  if (!isFullHTMLDocument(html)) {
    return html
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return doc.body.innerHTML
}

/**
 * 清理富文本编辑器生成的无用类名和样式
 * @param {string} html - 富文本编辑器生成的HTML
 * @returns {string} 清理后的HTML
 * @description 移除浏览器和编辑器自动生成的类名（auto-、br-、mce-、cke_等）和无用样式
 */
export const cleanRichTextHTML = (html) => {
  try {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
    
    // 判断是否为编辑器自动生成的无用类名
    const isUselessClass = (className) => {
      return /^auto-/.test(className) ||        // 浏览器自动生成
             /^br-/.test(className) ||           // 浏览器自动生成
             /^mce-/.test(className) ||          // TinyMCE编辑器
             /^cke_/.test(className) ||          // CKEditor编辑器
             /^[a-z]+-[A-Z0-9]{5,}$/i.test(className) ||  // 随机生成的类名
             /^paragraph-[A-Z0-9]+$/i.test(className) ||  // paragraph-xxx
             /^header-[A-Z0-9]+$/i.test(className) ||     // header-xxx
             className === 'paragraph-element'    // 固定的无用类名
    }
    
    // 需要移除的无用样式属性
    const uselessStyles = ['-webkit-font-smoothing', '-webkit-tap-highlight-color', 'outline', 'overflow-anchor']

    // 遍历所有元素，清理类名和样式
    doc.querySelectorAll('*').forEach(el => {
      // 清理无用类名
      if (el.className) {
        const validClasses = el.className.split(/\s+/).filter(c => c && !isUselessClass(c))
        validClasses.length ? el.className = validClasses.join(' ') : el.removeAttribute('class')
      }
      // 清理无用样式
      if (el.hasAttribute('style')) {
        uselessStyles.forEach(prop => el.style.removeProperty(prop))
        if (el.style.getPropertyValue('border') === '0px solid') el.style.removeProperty('border')
        if (!el.style.cssText.trim()) el.removeAttribute('style')
      }
    })
    return doc.body.innerHTML
  } catch {
    // 解析失败时返回原始HTML
    return html
  }
}

/**
 * 格式化HTML代码（美化缩进和换行）
 * @param {string} html - 需要格式化的HTML
 * @returns {string} 格式化后的HTML（带缩进和换行）
 * @description 递归格式化HTML节点，添加适当的缩进和换行，使代码更易读
 */
export const formatHTML = (html) => {
  if (!html) return html

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // 递归格式化节点
  const formatNode = (node, indent = 0) => {
    const indentStr = '  '.repeat(indent)
    const nextIndent = indent + 1

    // 处理文本节点
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim()
      return text ? `${indentStr}${text}\n` : ''
    }

    // 处理元素节点
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase()
      const attrs = []

      // 收集所有属性
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i]
        const value = attr.value.includes('"') ? `'${attr.value}'` : `"${attr.value}"`
        attrs.push(`${attr.name}=${value}`)
      }

      const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''
      const children = Array.from(node.childNodes)
      const hasTextChildren = children.some(child =>
        child.nodeType === Node.TEXT_NODE && child.textContent.trim()
      )

      // 处理自闭合标签（br、hr、img等）
      const voidTags = ['br', 'hr', 'img', 'input', 'meta', 'link']
      if (voidTags.includes(tagName) && !node.textContent.trim() && children.length === 0) {
        return `${indentStr}<${tagName}${attrStr}>\n`
      }

      // 处理标签内容
      let content = ''
      if (children.length > 0) {
        if (hasTextChildren || children.length > 1) {
          // 多个子节点或包含文本，需要换行和缩进
          content = '\n'
          children.forEach(child => {
            const childContent = formatNode(child, nextIndent)
            if (childContent) content += childContent
          })
          content += indentStr
        } else {
          // 单个文本子节点，不换行
          content = children[0].textContent.trim()
        }
      }

      return `${indentStr}<${tagName}${attrStr}>${content}</${tagName}>\n`
    }

    return ''
  }

  let formatted = ''

  // 保留DOCTYPE声明
  if (html.trim().startsWith('<!DOCTYPE')) {
    const doctypeMatch = html.match(/<!DOCTYPE[^>]*>/i)
    if (doctypeMatch) formatted += doctypeMatch[0] + '\n'
  }

  // 格式化整个文档或body部分
  if (doc.documentElement) {
    formatted += formatNode(doc.documentElement, 0)
  } else if (doc.body) {
    formatted += formatNode(doc.body, 0)
  }

  return formatted.trim()
}

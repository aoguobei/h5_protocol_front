import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

/**
 * 通过后端接口创建临时预览链接
 * @param {string} htmlContent - HTML 内容
 * @returns {Promise<string>} 返回预览链接
 */
export const createPastebinPreview = async (htmlContent) => {
  try {
    const response = await api.post('/protocols/preview', {
      content: htmlContent
    })

    if (response.data && response.data.url) {
      return response.data.url
    } else {
      throw new Error('后端返回格式错误')
    }
  } catch (error) {
    console.error('创建预览链接失败:', error)
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error)
    } else if (error.message) {
      throw error
    } else {
      throw new Error('创建预览链接失败: 未知错误')
    }
  }
}


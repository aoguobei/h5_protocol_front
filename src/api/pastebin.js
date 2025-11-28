import request from './request'

export const createPastebinPreview = async (htmlContent) => {
  try {
    const response = await request.post('/protocols/preview', { content: htmlContent })
    if (response.data?.url) {
      return response.data.url
    }
    throw new Error('后端返回格式错误')
  } catch (error) {
    console.error('创建预览链接失败:', error)
    throw new Error(error.response?.data?.error || error.message || '创建预览链接失败')
  }
}

import request from './request'

export const getProtocolList = () => request.get('/protocols')

export const getProtocol = (filename) => {
  const encodedFilename = encodeURIComponent(filename)
  return request.get(`/protocols/${encodedFilename}`)
}

// data: { filename, content, description, app_type, app_name }
export const createProtocol = (data) => request.post('/protocols', data)

// data: { content, description, app_type, app_name }
export const updateProtocol = (filename, data) => {
  const encodedFilename = encodeURIComponent(filename)
  return request.put(`/protocols/${encodedFilename}`, data)
}

export const deleteProtocol = (filename) => {
  const encodedFilename = encodeURIComponent(filename)
  return request.delete(`/protocols/${encodedFilename}`)
}

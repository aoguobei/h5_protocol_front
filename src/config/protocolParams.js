/**
 * 协议参数配置
 * 用于定义不同协议的可配置参数字段
 */

export const PROTOCOL_PARAMS = {
  'dj_common_about.html': {
    fields: [
      { key: 'name', label: '应用名称', type: 'text', placeholder: '例如: 长江云短剧', span: 10 },
      { key: 'company', label: '公司名称', type: 'text', placeholder: '例如: 湖北长江云新媒体集团有限公司', span: 14 },
      { key: 'address', label: '地址', type: 'textarea', placeholder: '请输入地址', span: 12, rows: 2 },
      { key: 'postcode', label: '邮编', type: 'text', placeholder: '例如: 430073', span: 12 }
    ]
  },
  'dj_common_privacy.html': {
    fields: [
      { key: 'name', label: '应用名称', type: 'text', placeholder: '例如: 长江云短剧', span: 10 },
      { key: 'company', label: '公司名称', type: 'text', placeholder: '例如: 湖北长江云新媒体集团有限公司', span: 14 },
      { key: 'briefCompany', label: '公司简称', type: 'text', placeholder: '例如: 易橙', span: 12 }
    ]
  },
  'dj_common_vodAgreement.html': {
    fields: [
      { key: 'name', label: '应用名称', type: 'text', placeholder: '例如: 长江云短剧', span: 10 },
      { key: 'company', label: '公司名称', type: 'text', placeholder: '例如: 湖北长江云新媒体集团有限公司', span: 14 },
      { key: 'historyVersion.date', label: '历史版本日期', type: 'text', placeholder: '例如: 2024年07月09日', span: 10, labelWidth: '120px' },
      { key: 'historyVersion.href', label: '历史版本链接', type: 'text', placeholder: '例如: https://mp.xyhvip.cn/static/notice/xxx.html', span: 14, labelWidth: '120px' }
    ]
  },
  'dj_common_usercancel.html': {
    useQueryParams: true,
    fields: [
      { key: 'name', label: '应用名称', type: 'text', placeholder: '例如: 长江云短剧', span: 10 }
    ]
  },
  'dj_common_agreement.html': {
    useQueryParams: true,
    fields: [
      { key: 'name', label: '应用名称', type: 'text', placeholder: '例如: 长江云短剧', span: 10 }
    ]
  },
  'ys_common_about.html': {
    fields: [
      { key: 'name', label: '应用名称', type: 'text', placeholder: '例如: 小影', span: 10 },
      { key: 'company', label: '公司名称', type: 'text', placeholder: '例如: 杭州小影创新科技股份有限公司', span: 14 },
      { key: 'briefCompany', label: '公司简称', type: 'text', placeholder: '例如: 小影', span: 12 }
    ]
  },
  'ys_common_privacy.html': {
    fields: [
      { key: 'name', label: '应用名称', type: 'text', placeholder: '例如: 小影', span: 10 },
      { key: 'company', label: '公司名称', type: 'text', placeholder: '例如: 杭州小影创新科技股份有限公司', span: 14 },
      { key: 'briefCompany', label: '公司简称', type: 'text', placeholder: '例如: 小影', span: 12 }
    ]
  },
  'ys_common_agreement.html': {
    fields: [
      { key: 'name', label: '应用名称', type: 'text', placeholder: '例如: 小影', span: 10 },
      { key: 'company', label: '公司名称', type: 'text', placeholder: '例如: 杭州小影创新科技股份有限公司', span: 14 },
      { key: 'historyVersion.date', label: '历史版本日期', type: 'text', placeholder: '例如: 2024年07月09日', span: 10, labelWidth: '120px' },
      { key: 'historyVersion.href', label: '历史版本链接', type: 'text', placeholder: '例如: https://mp.xyhvip.cn/static/notice/xxx.html', span: 14, labelWidth: '120px' }
    ]
  },
  'dasong_vod_agreement.html': {
    useQueryParams: true,
    fields: [
      { key: 'platform', label: '平台名称', type: 'text', placeholder: '例如: kuaishou/douyin', span: 10 }
    ]
  },
  'dasong_usercancel.html': {
    useQueryParams: true,
    fields: [
      { key: 'platform', label: '平台名称', type: 'text', placeholder: '例如: kuaishou/douyin', span: 10 }
    ]
  },
  'dasong_privacy.html': {
    useQueryParams: true,
    fields: [
      { key: 'platform', label: '平台名称', type: 'text', placeholder: '例如: kuaishou/douyin', span: 10 }
    ]
  },
  'dasong_about.html': {
    useQueryParams: true,
    fields: [
      { key: 'platform', label: '平台名称', type: 'text', placeholder: '例如: kuaishou/douyin', span: 10 }
    ]
  },
  'ysp_agreement.html': {
    fields: [
      { key: 'name', label: '应用名称', type: 'text', placeholder: '例如: 央视频', span: 10 },
      { key: 'company', label: '公司名称', type: 'text', placeholder: '例如: 某某科技有限公司', span: 14 },
      { key: 'historyVersion.date', label: '历史版本日期', type: 'text', placeholder: '例如: 2024年01月01日', span: 10, labelWidth: '120px' },
      { key: 'historyVersion.href', label: '历史版本链接', type: 'text', placeholder: '例如: https://example.com/history.html', span: 14, labelWidth: '120px' }
    ]
  }
}

/**
 * 获取协议配置
 * @param {string} filename - 协议文件名
 * @returns {object|null} 协议配置对象
 */
export function getProtocolConfig(filename) {
  return PROTOCOL_PARAMS[filename] || null
}

/**
 * 判断是否是参数化协议
 * @param {string} filename - 协议文件名
 * @returns {boolean}
 */
export function isParameterizedProtocol(filename) {
  return filename in PROTOCOL_PARAMS
}

/**
 * 获取参数的嵌套值
 * @param {object} obj - 对象
 * @param {string} path - 路径（如 'historyVersion.href'）
 * @returns {any}
 */
export function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

/**
 * 设置参数的嵌套值
 * @param {object} obj - 对象
 * @param {string} path - 路径（如 'historyVersion.href'）
 * @param {any} value - 值
 */
export function setNestedValue(obj, path, value) {
  const parts = path.split('.')
  const last = parts.pop()
  const target = parts.reduce((acc, part) => {
    if (!acc[part]) acc[part] = {}
    return acc[part]
  }, obj)
  target[last] = value
}

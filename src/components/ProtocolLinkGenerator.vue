<template>
  <el-card class="link-generator-card">
    <template #header>
      <span>生成协议链接</span>
    </template>

    <el-form :model="form" label-width="120px">
      <el-form-item label="协议类型">
        <el-radio-group v-model="form.protocolType" @change="handleProtocolTypeChange">
          <el-radio value="dj">短剧通用协议</el-radio>
          <el-radio value="ys">影视通用协议</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="选择协议">
        <el-select v-model="form.protocol" placeholder="请选择协议" style="width: 100%" @change="handleProtocolChange">
          <el-option
            v-for="option in protocolOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <!-- 通用字段 -->
      <el-form-item label="应用名称" v-if="showField('name')">
        <el-input v-model="form.params.name" placeholder="例如: 长江云短剧" />
      </el-form-item>

      <el-form-item label="公司名称" v-if="showField('company')">
        <el-input v-model="form.params.company" placeholder="例如: 湖北长江云新媒体集团有限公司" />
      </el-form-item>

      <!-- 短剧 about 特有字段 -->
      <el-form-item label="地址" v-if="showField('address')">
        <el-input v-model="form.params.address" type="textarea" :rows="2" placeholder="请输入地址" />
      </el-form-item>

      <el-form-item label="邮编" v-if="showField('postcode')">
        <el-input v-model="form.params.postcode" placeholder="例如: 430073" />
      </el-form-item>

      <!-- 影视通用字段 -->
      <el-form-item label="公司简称" v-if="showField('briefCompany')">
        <el-input v-model="form.params.briefCompany" placeholder="例如: 易橙" />
      </el-form-item>

      <!-- vod 协议特有字段 -->
      <template v-if="form.protocol === 'vod' || form.protocol === 'vodAgreement'">
        <el-form-item label="历史版本链接">
          <el-input v-model="form.params.historyVersion.href" placeholder="例如: https://mp.xyhvip.cn/static/notice/xxx.html" />
        </el-form-item>
        <el-form-item label="历史版本日期">
          <el-input v-model="form.params.historyVersion.date" placeholder="例如: 2024年07月09日" />
        </el-form-item>
      </template>

      <el-form-item>
        <el-button type="primary" @click="generateLink">生成链接</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>

      <el-form-item label="生成的链接" v-if="generatedLink">
        <el-input
          v-model="generatedLink"
          type="textarea"
          :rows="3"
          readonly
        />
        <div style="margin-top: 10px">
          <el-button type="success" @click="copyLink">复制链接</el-button>
          <el-button @click="openLink" :disabled="!generatedLink">在新窗口打开</el-button>
        </div>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 协议选项
const djProtocolOptions = [
  { label: '关于我们 (dj_common_about)', value: 'about' },
  { label: '隐私政策 (dj_common_privacy)', value: 'privacy' },
  { label: '付费服务协议 (dj_common_vodAgreement)', value: 'vodAgreement' },
  { label: '用户注销协议 (dj_common_usercancel)', value: 'usercancel' }
]

const ysProtocolOptions = [
  { label: '关于我们 (ys_common_about)', value: 'about' },
  { label: '隐私政策 (ys_common_privacy)', value: 'privacy' },
  { label: '付费服务协议 (ys_common_agreement)', value: 'vod' }
]

// 域名映射
const DOMAIN_MAP = {
  dj: 'mp.fun.tv',  // 短剧通用协议
  ys: 'mp.xyhvip.cn' // 影视通用协议
}

const form = ref({
  protocolType: 'dj', // dj 或 ys
  protocol: '',
  params: {
    name: '',
    company: '',
    address: '',
    postcode: '',
    briefCompany: '',
    historyVersion: {
      href: '',
      date: ''
    }
  }
})

const generatedLink = ref('')

const protocolOptions = computed(() => {
  return form.value.protocolType === 'dj' ? djProtocolOptions : ysProtocolOptions
})

// 根据协议类型显示不同的字段
const showField = (fieldName) => {
  const protocol = form.value.protocol
  const protocolType = form.value.protocolType

  if (protocol === 'usercancel') {
    // usercancel 只需要 name
    return fieldName === 'name'
  }

  if (protocol === 'about') {
    if (protocolType === 'dj') {
      // 短剧 about: name, company, address, postcode
      return ['name', 'company', 'address', 'postcode'].includes(fieldName)
    } else {
      // 影视 about: name, company, briefCompany
      return ['name', 'company', 'briefCompany'].includes(fieldName)
    }
  }

  if (protocol === 'privacy') {
    if (protocolType === 'dj') {
      // 短剧 privacy: name, company, briefCompany
      return ['name', 'company', 'briefCompany'].includes(fieldName)
    } else {
      // 影视 privacy: name, company, briefCompany
      return ['name', 'company', 'briefCompany'].includes(fieldName)
    }
  }

  if (protocol === 'vodAgreement' || protocol === 'vod') {
    if (protocolType === 'dj') {
      // 短剧 vod: name, company, historyVersion
      return ['name', 'company'].includes(fieldName)
    } else {
      // 影视 vod: name, company, historyVersion (没有 briefCompany)
      return ['name', 'company'].includes(fieldName)
    }
  }

  return false
}

const handleProtocolTypeChange = () => {
  form.value.protocol = ''
  form.value.params = {
    name: '',
    company: '',
    address: '',
    postcode: '',
    briefCompany: '',
    historyVersion: {
      href: '',
      date: ''
    }
  }
  generatedLink.value = ''
}

const handleProtocolChange = () => {
  generatedLink.value = ''
}

const generateLink = () => {
  if (!form.value.protocol) {
    ElMessage.warning('请选择协议')
    return
  }

  // 获取协议文件名
  let filename = ''
  if (form.value.protocolType === 'dj') {
    const filenameMap = {
      about: 'dj_common_about',
      privacy: 'dj_common_privacy',
      vodAgreement: 'dj_common_vodAgreement',
      usercancel: 'dj_common_usercancel'
    }
    filename = filenameMap[form.value.protocol]
  } else {
    const filenameMap = {
      about: 'ys_common_about',
      privacy: 'ys_common_privacy',
      vod: 'ys_common_agreement'
    }
    filename = filenameMap[form.value.protocol]
  }

  const domain = DOMAIN_MAP[form.value.protocolType]
  const baseUrl = `https://${domain}/static/notice/${filename}.html`

  // usercancel 特殊处理（只传 name，URL编码）
  if (form.value.protocol === 'usercancel') {
    if (!form.value.params.name) {
      ElMessage.warning('请输入应用名称')
      return
    }
    generatedLink.value = `${baseUrl}?name=${encodeURIComponent(form.value.params.name)}`
    return
  }

  // 其他协议使用 paramConfig 参数
  const config = {}

  // 添加通用字段
  if (form.value.params.name) {
    config.name = form.value.params.name
  }
  if (form.value.params.company) {
    config.company = form.value.params.company
  }

  // 添加短剧特有字段
  if (form.value.protocolType === 'dj') {
    if (form.value.params.address) {
      config.address = form.value.params.address
    }
    if (form.value.params.postcode) {
      config.postcode = form.value.params.postcode
    }
    // 短剧 privacy 需要 briefCompany
    if (form.value.protocol === 'privacy' && form.value.params.briefCompany) {
      config.briefCompany = form.value.params.briefCompany
    }
  }

  // 添加影视特有字段
  if (form.value.protocolType === 'ys') {
    // 影视 about 和 privacy 需要 briefCompany，但 agreement 不需要
    if ((form.value.protocol === 'about' || form.value.protocol === 'privacy') && form.value.params.briefCompany) {
      config.briefCompany = form.value.params.briefCompany
    }
  }

  // 添加 historyVersion（vod 协议）
  if (form.value.protocol === 'vodAgreement' || form.value.protocol === 'vod') {
    if (form.value.params.historyVersion.href || form.value.params.historyVersion.date) {
      config.historyVersion = {
        href: form.value.params.historyVersion.href || '#',
        date: form.value.params.historyVersion.date || ''
      }
    }
  }

  const paramConfig = encodeURIComponent(JSON.stringify(config))
  generatedLink.value = `${baseUrl}?paramConfig=${paramConfig}`
}

const copyLink = () => {
  if (!generatedLink.value) {
    ElMessage.warning('没有可复制的链接')
    return
  }

  navigator.clipboard.writeText(generatedLink.value).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  }).catch(() => {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = generatedLink.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('链接已复制到剪贴板')
  })
}

const openLink = () => {
  if (generatedLink.value) {
    window.open(generatedLink.value, '_blank')
  }
}

const resetForm = () => {
  form.value = {
    protocolType: 'dj',
    protocol: '',
    domain: '',
    params: {
      name: '',
      company: '',
      address: '',
      postcode: '',
      briefCompany: '',
      historyVersion: {
        href: '',
        date: ''
      }
    }
  }
  generatedLink.value = ''
}
</script>

<style scoped>
.link-generator-card {
  margin-bottom: 20px;
}
</style>


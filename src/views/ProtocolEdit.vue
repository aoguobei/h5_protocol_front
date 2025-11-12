<template>
  <div class="protocol-edit">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑协议' : '新建协议' }}</span>
          <div class="header-buttons">
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="primary" @click="handleSave">保存</el-button>
          </div>
        </div>
      </template>

      <el-form :model="form" label-width="100px">
        <el-form-item label="文件名">
          <el-input v-model="form.filename" placeholder="例如: ys_common_agreement.html" :disabled="isEdit" />
        </el-form-item>

        <el-form-item label="编辑模式">
          <el-radio-group v-model="editMode">
            <el-radio value="code">代码模式（可编辑格式，推荐）</el-radio>
            <el-radio value="rich">富文本模式（{{ isEdit ? '仅修改内容' : '仅输入文本，无法设置格式' }}）</el-radio>
            <el-radio v-if="isEdit && isParameterizedProtocol" value="preview">预览模式（仅参数化协议）</el-radio>
          </el-radio-group>
        </el-form-item>
        <div class="mode-tips">
          <div v-if="!isEdit && editMode === 'rich'" class="tip-item tip-warning">
            <div class="tip-icon">💡</div>
            <div class="tip-content">
              <span>富文本模式新建协议时，只能输入纯文本，无法设置字号、加粗、颜色等样式。浏览器会自动转换为简单的 HTML 标签，格式可能被标准化。如需复杂格式，请使用<strong>代码模式</strong>或导入 HTML 文件。</span>
            </div>
          </div>
          <div v-if="isEdit && editMode === 'rich'" class="tip-item tip-info">
            <div class="tip-icon">💡</div>
            <div class="tip-content">
              <span>富文本模式仅用于修改文本内容，不能修改格式或样式。如需修改格式，请使用<strong>代码模式</strong>。</span>
            </div>
          </div>
          <div v-if="!isEdit && editMode === 'code'" class="tip-item tip-info">
            <div class="tip-icon">💡</div>
            <div class="tip-content">
              <span>代码模式可精确控制格式，建议直接粘贴 HTML 代码或导入 HTML 文件。</span>
            </div>
          </div>
        </div>

        <el-form-item label="协议内容">
          <div v-if="!isEdit" style="margin-bottom: 12px;">
            <el-button
              type="primary"
              size="small"
              @click="showImportDialog = true"
              :icon="UploadFilled"
            >
              导入文件
            </el-button>
            <span style="margin-left: 8px; color: #909399; font-size: 12px;">
              <span v-if="editMode === 'code'">支持 HTML (.html, .htm) 文件</span>
              <span v-else>支持 Word (.doc, .docx) 文件</span>
            </span>
          </div>
          
          <!-- 预览模式：参数输入表单 -->
          <el-card v-if="editMode === 'preview' && isParameterizedProtocol" class="preview-params-card" shadow="never">
            <template #header>
              <div class="params-header">
                <el-icon><Setting /></el-icon>
                <span class="params-title">预览参数设置</span>
                <el-button 
                  text 
                  type="primary" 
                  size="small" 
                  @click="resetPreviewForm"
                  class="reset-btn"
                >
                  <el-icon><Refresh /></el-icon>
                  重置
                </el-button>
              </div>
            </template>
            <el-form :model="previewForm" label-width="120px" size="default" class="preview-params-form" :style="{ width: '100%' }">
              <!-- 通用字段 -->
              <el-row :gutter="20">
                <el-col :span="10" v-if="showPreviewField('name')">
                  <el-form-item label="应用名称">
                    <el-input 
                      v-model="previewForm.params.name" 
                      placeholder="例如: 长江云短剧"
                      clearable
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12" v-if="showPreviewField('company')">
                  <el-form-item label="公司名称">
                    <el-input 
                      v-model="previewForm.params.company" 
                      placeholder="例如: 湖北长江云新媒体集团有限公司"
                      clearable
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 短剧 about 特有字段 -->
              <el-row :gutter="20" v-if="showPreviewField('address') || showPreviewField('postcode')">
                <el-col :span="12" v-if="showPreviewField('address')">
                  <el-form-item label="地址">
                    <el-input 
                      v-model="previewForm.params.address" 
                      type="textarea" 
                      :rows="2" 
                      placeholder="请输入地址"
                      clearable
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12" v-if="showPreviewField('postcode')">
                  <el-form-item label="邮编">
                    <el-input 
                      v-model="previewForm.params.postcode" 
                      placeholder="例如: 430073"
                      clearable
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 影视通用字段 -->
              <el-row :gutter="20">
                <el-col :span="12" v-if="showPreviewField('briefCompany')">
                  <el-form-item label="公司简称">
                    <el-input 
                      v-model="previewForm.params.briefCompany" 
                      placeholder="例如: 易橙"
                      clearable
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- vod 协议特有字段 -->
              <template v-if="previewForm.protocol === 'vod' || previewForm.protocol === 'vodAgreement'">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="历史版本链接">
                      <el-input 
                        v-model="previewForm.params.historyVersion.href" 
                        placeholder="例如: https://mp.xyhvip.cn/static/notice/xxx.html"
                        clearable
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="10">
                    <el-form-item label="历史版本日期">
                      <el-input 
                        v-model="previewForm.params.historyVersion.date" 
                        placeholder="例如: 2024年07月09日"
                        clearable
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </template>
            </el-form>
          </el-card>
          
          <div v-if="editMode === 'code'" class="code-editor-wrapper">
            <div class="line-numbers" ref="lineNumbersRef">
              <div
                v-for="line in codeLines"
                :key="line"
                class="line-number"
              >{{ line }}</div>
            </div>
            <textarea
              :value="form.content"
              @input="handleCodeInput"
              @scroll="handleCodeScroll"
              ref="codeTextareaRef"
              class="editor-textarea code-editor"
              placeholder="请输入协议HTML内容..."
            ></textarea>
          </div>
          <div v-else-if="editMode === 'rich'" class="rich-editor-wrapper">
            <!-- 编辑器 -->
            <div
              ref="richEditorRef"
              contenteditable="true"
              class="editor-rich"
              @compositionstart="isComposing = true"
              @compositionend="handleCompositionEnd"
              @input="handleRichEditorInput"
              @blur="handleRichEditorBlur"
            ></div>
          </div>
          <div v-else-if="editMode === 'preview'" class="preview-wrapper">
            <!-- 预览内容（使用后端接口） -->
            <div v-if="previewLoading" style="padding: 20px; text-align: center; color: #909399;">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span style="margin-left: 8px;">正在生成预览链接...</span>
            </div>
            <div v-else-if="previewError" style="padding: 20px; text-align: center; color: #f56c6c;">
              <el-icon><WarningFilled /></el-icon>
              <span style="margin-left: 8px;">{{ previewError }}</span>
            </div>
            <iframe
              v-else-if="previewUrl"
              ref="previewRef"
              :src="previewUrl"
              :key="previewUrlKey"
              class="preview-iframe"
              frameborder="0"
            ></iframe>
          </div>
        </el-form-item>
      </el-form>

      <!-- 导入文件对话框 -->
      <el-dialog
        v-model="showImportDialog"
        title="导入文件"
        width="500px"
        :close-on-click-modal="false"
      >
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :limit="1"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :accept="editMode === 'code' ? '.html,.htm' : '.doc,.docx'"
          drag
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip" style="color: #909399; font-size: 12px;">
              <span v-if="editMode === 'code'">支持上传 HTML 文件 (.html, .htm)</span>
              <span v-else>支持上传 Word 文档 (.doc, .docx)</span>
            </div>
          </template>
        </el-upload>
        <template #footer>
          <el-button @click="showImportDialog = false">取消</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  UploadFilled, 
  Loading, 
  WarningFilled, 
  Setting, 
  Refresh, 
} from '@element-plus/icons-vue'
import mammoth from 'mammoth'
import { getProtocol, createProtocol, updateProtocol, getProtocolList } from '../api/protocol'
import { createPastebinPreview } from '../api/pastebin'

const router = useRouter()
const route = useRoute()

const isEdit = ref(false)
const editMode = ref('code')
const richEditorRef = ref(null)
const codeTextareaRef = ref(null)
const lineNumbersRef = ref(null)
const uploadRef = ref(null)
const showImportDialog = ref(false)
const codeLines = ref([1])
const isComposing = ref(false) // 是否正在输入中文
const originalContent = ref('') // 保存原始 HTML 内容
const protocolList = ref([]) // 协议列表，用于检查文件名重复
const form = ref({
  filename: '',
  content: ''
})

// 预览功能相关
const showPreviewParams = ref(false)
const previewForm = ref({
  protocolType: 'dj', // dj 或 ys
  protocol: '', // about, privacy, vod, vodAgreement, usercancel
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

// 支持的参数化协议文件名
const parameterizedProtocols = {
  'dj_common_about': { protocolType: 'dj', protocol: 'about' },
  'dj_common_privacy': { protocolType: 'dj', protocol: 'privacy' },
  'dj_common_vodAgreement': { protocolType: 'dj', protocol: 'vodAgreement' },
  'dj_common_usercancel': { protocolType: 'dj', protocol: 'usercancel' },
  'ys_common_about': { protocolType: 'ys', protocol: 'about' },
  'ys_common_privacy': { protocolType: 'ys', protocol: 'privacy' },
  'ys_common_agreement': { protocolType: 'ys', protocol: 'vod' }
}

// 域名映射
const DOMAIN_MAP = {
  dj: 'mp.fun.tv',
  ys: 'mp.xyhvip.cn'
}

// 判断是否是参数化协议
const isParameterizedProtocol = computed(() => {
  if (!form.value.filename) return false
  const baseName = form.value.filename.replace(/\.html?$/i, '')
  return baseName in parameterizedProtocols
})

// 保存原始 HTML 内容（用于参数替换）
const originalHTMLContent = ref('')

// 监听文件名变化，初始化预览表单
watch(() => form.value.filename, (newFilename) => {
  if (isEdit.value && newFilename) {
    const baseName = newFilename.replace(/\.html?$/i, '')
    const protocolInfo = parameterizedProtocols[baseName]
    if (protocolInfo) {
      previewForm.value.protocolType = protocolInfo.protocolType
      previewForm.value.protocol = protocolInfo.protocol
      // 保存原始内容
      if (form.value.content) {
        originalHTMLContent.value = form.value.content
      }
    }
  }
}, { immediate: true })

// 预览功能相关状态
const previewRef = ref(null)
const previewUrl = ref('')
const previewUrlKey = ref(0) // 用于强制刷新 iframe
const previewLoading = ref(false)
const previewError = ref('')
let previewUrlTimer = null // 用于防抖

// 生成预览链接（使用后端接口）
const generatePreviewUrl = async () => {
  if (editMode.value !== 'preview' || !form.value.content) {
    previewUrl.value = ''
    return
  }

  // 防抖：避免频繁调用 API
  if (previewUrlTimer) {
    clearTimeout(previewUrlTimer)
  }

  previewUrlTimer = setTimeout(async () => {
    try {
      previewLoading.value = true
      previewError.value = ''
      
      // 生成预览HTML内容（注入参数）
      const htmlContent = generatePreviewHtmlContent()
      
      // 调用后端接口创建预览链接
      const previewUrlResult = await createPastebinPreview(htmlContent)
      
      previewUrl.value = previewUrlResult
      
      // 强制刷新 iframe
      nextTick(() => {
        previewUrlKey.value++
      })
    } catch (error) {
      console.error('生成预览链接失败:', error)
      previewError.value = error.message || '生成预览链接失败'
      previewUrl.value = ''
    } finally {
      previewLoading.value = false
    }
  }, 500) // 500ms 防抖
}

// 监听参数变化，确保预览更新
watch(() => previewForm.value.params, () => {
  if (editMode.value === 'preview') {
    generatePreviewUrl()
  }
}, { deep: true })

// 监听内容变化，确保预览更新
watch(() => form.value.content, () => {
  if (editMode.value === 'preview') {
    generatePreviewUrl()
  }
})


// 生成预览HTML内容（在HTML开头注入脚本标签设置全局变量）
const generatePreviewHtmlContent = () => {
  if (!form.value.content) return ''
  
  let htmlContent = form.value.content
  
  // 如果是参数化协议，需要在HTML中注入参数
  if (isParameterizedProtocol.value && previewForm.value.protocol) {
    // 构建参数配置
    const config = {}
    
    // 添加通用字段
    if (previewForm.value.params.name) {
      config.name = previewForm.value.params.name
    }
    if (previewForm.value.params.company) {
      config.company = previewForm.value.params.company
    }
    
    // 添加短剧特有字段
    if (previewForm.value.protocolType === 'dj') {
      if (previewForm.value.params.address) {
        config.address = previewForm.value.params.address
      }
      if (previewForm.value.params.postcode) {
        config.postcode = previewForm.value.params.postcode
      }
      // 短剧 privacy 需要 briefCompany
      if (previewForm.value.protocol === 'privacy' && previewForm.value.params.briefCompany) {
        config.briefCompany = previewForm.value.params.briefCompany
      }
    }
    
    // 添加影视特有字段
    if (previewForm.value.protocolType === 'ys') {
      // 影视 about 和 privacy 需要 briefCompany，但 agreement 不需要
      if ((previewForm.value.protocol === 'about' || previewForm.value.protocol === 'privacy') && previewForm.value.params.briefCompany) {
        config.briefCompany = previewForm.value.params.briefCompany
      }
    }
    
    // 添加 historyVersion（vod 协议）
    if (previewForm.value.protocol === 'vod' || previewForm.value.protocol === 'vodAgreement') {
      if (previewForm.value.params.historyVersion.href || previewForm.value.params.historyVersion.date) {
        config.historyVersion = {
          href: previewForm.value.params.historyVersion.href || '#',
          date: previewForm.value.params.historyVersion.date || ''
        }
      }
    }
    
    // 生成要注入的脚本内容
    const configJson = JSON.stringify(config, null, 2)
    // 使用字符串拼接避免 Vue linter 误报
    // eslint-disable-next-line no-useless-concat
    const scriptStart = '<' + 'script>'
    // eslint-disable-next-line no-useless-concat
    const scriptEnd = '</' + 'script>'
    const injectedScript = scriptStart + '\n// 预览模式注入的参数配置\nwindow.__PREVIEW_CONFIG__ = ' + configJson + ';\n' + scriptEnd
    
    // 在 script src="./utils.js" 之前注入脚本
    // 匹配 script src="./utils.js" 或 script src='./utils.js'
    const scriptTag = 'script'
    const utilsScriptPattern = new RegExp(`<${scriptTag}\\s+src\\s*=\\s*["']\\.\\/utils\\.js["']\\s*>`, 'i')
    if (utilsScriptPattern.test(htmlContent)) {
      htmlContent = htmlContent.replace(
        utilsScriptPattern,
        injectedScript + '\n$&'
      )
    } else {
      // 如果没有找到 utils.js，尝试在第一个 script 标签之前注入
      // 或者在没有 script 标签的情况下，在 body 结束之前注入
      const firstScriptPattern = new RegExp(`<${scriptTag}`, 'i')
      if (firstScriptPattern.test(htmlContent)) {
        htmlContent = htmlContent.replace(
          firstScriptPattern,
          injectedScript + '\n$&'
        )
      } else {
        // 在 body 结束之前注入
        // eslint-disable-next-line no-useless-concat
        const bodyEndTag = '</' + 'body>'
        const bodyEndPattern = new RegExp(bodyEndTag, 'i')
        if (bodyEndPattern.test(htmlContent)) {
          htmlContent = htmlContent.replace(
            bodyEndPattern,
            injectedScript + '\n$&'
          )
        } else {
          // 在 html 结束之前注入
          // eslint-disable-next-line no-useless-concat
          const htmlEndTag = '</' + 'html>'
          const htmlEndPattern = new RegExp(htmlEndTag, 'i')
          if (htmlEndPattern.test(htmlContent)) {
            htmlContent = htmlContent.replace(
              htmlEndPattern,
              injectedScript + '\n$&'
            )
          } else {
            // 如果都没有，直接追加到末尾
            htmlContent = htmlContent + '\n' + injectedScript
          }
        }
      }
    }
    
    // 修改HTML中的参数读取逻辑，优先使用 window.__PREVIEW_CONFIG__
    // 匹配使用 paramConfig 的代码
    const paramConfigPattern = /if\s*\(getParamsFromUrl\(url\)\.paramConfig\)\s*\{[\s\S]*?Object\.assign\(config,\s*JSON\.parse\(params\)\)[\s\S]*?\}/
    if (paramConfigPattern.test(htmlContent)) {
      htmlContent = htmlContent.replace(
        paramConfigPattern,
        `// 优先使用预览配置\n  if (window.__PREVIEW_CONFIG__) {\n    Object.assign(config, window.__PREVIEW_CONFIG__)\n  } else if (getParamsFromUrl(url).paramConfig) {\n    const params = decodeURIComponent(getParamsFromUrl(url).paramConfig)\n    Object.assign(config, JSON.parse(params))\n  }`
      )
    }
    
    // 处理 name 参数的读取（about、privacy、usercancel 协议都有这个逻辑）
    // 匹配类似：const encode_name = getParamsFromUrl(url).name
    const nameReadPattern = /const\s+encode_name\s*=\s*getParamsFromUrl\(url\)\.name/
    if (nameReadPattern.test(htmlContent)) {
      htmlContent = htmlContent.replace(
        nameReadPattern,
        `const encode_name = window.__PREVIEW_CONFIG__?.name ? encodeURIComponent(window.__PREVIEW_CONFIG__.name) : getParamsFromUrl(url).name`
      )
    }
  }
  
  return htmlContent
}

// 组件卸载时清理
onUnmounted(() => {
  if (previewUrlTimer) {
    clearTimeout(previewUrlTimer)
    previewUrlTimer = null
  }
})

const handleCodeInput = (e) => {
  form.value.content = e.target.value
  updateLineNumbers()
}

// 处理富文本编辑器输入（实时同步内容）
const handleRichEditorInput = () => {
  if (!richEditorRef.value || isComposing.value) return
  
  syncRichEditorContent()
}

// 处理富文本编辑器失焦（同步内容）
const handleRichEditorBlur = () => {
  if (!richEditorRef.value) return
  
  syncRichEditorContent()
}

// 同步富文本编辑器内容到 form.value.content
const syncRichEditorContent = () => {
  if (!richEditorRef.value) return
  
  let htmlContent = ''
  
  if (originalContent.value && isFullHTMLDocument(originalContent.value)) {
    // 如果是完整HTML文档，需要包装回完整结构
    const bodyContent = richEditorRef.value.innerHTML
    // 清理富文本编辑器生成的无用类名和样式
    const cleanedBodyContent = cleanRichTextHTML(bodyContent)
    htmlContent = wrapToFullHTML(cleanedBodyContent, originalContent.value)
  } else {
    // 不是完整文档或新建文件，直接使用 innerHTML
    // 清理富文本编辑器生成的无用类名和样式
    htmlContent = cleanRichTextHTML(richEditorRef.value.innerHTML)
  }
  
  // 同步到 form.value.content
  form.value.content = htmlContent
  
  // 如果是参数化协议，同时更新 originalHTMLContent（用于预览模式）
  if (isParameterizedProtocol.value) {
    originalHTMLContent.value = htmlContent
  }
}

// 处理文件上传
const handleFileChange = async (file) => {
  const fileName = file.name
  const fileExtension = fileName.split('.').pop().toLowerCase()

  // 检查是否已有内容，提示用户
  if (form.value.content && form.value.content.trim()) {
    try {
      await ElMessageBox.confirm(
        '导入文件将覆盖当前编辑内容，是否继续？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      // 用户取消，移除文件
      if (uploadRef.value) {
        uploadRef.value.clearFiles()
      }
      return
    }
  }

  // 如果没有输入文件名，自动使用上传的文件名（去掉扩展名）
  if (!form.value.filename && fileName) {
    const baseName = fileName.replace(/\.(doc|docx|html|htm)$/i, '')
    form.value.filename = `${baseName}.html`
  }

  // 检查文件类型是否符合当前编辑模式
  if (editMode.value === 'code') {
    // 代码模式只支持 HTML 文件
    if (fileExtension !== 'html' && fileExtension !== 'htm') {
      ElMessage.warning('代码模式只支持导入 HTML 文件 (.html, .htm)')
      if (uploadRef.value) {
        uploadRef.value.clearFiles()
      }
      return
    }
  } else {
    // 富文本模式只支持 Word 文件
    if (fileExtension !== 'doc' && fileExtension !== 'docx') {
      ElMessage.warning('富文本模式只支持导入 Word 文档 (.doc, .docx)')
      if (uploadRef.value) {
        uploadRef.value.clearFiles()
      }
      return
    }
  }

  try {
    if (fileExtension === 'html' || fileExtension === 'htm') {
      // 处理 HTML 文件
      await handleHTMLFile(file.raw)
    } else if (fileExtension === 'doc' || fileExtension === 'docx') {
      // 处理 Word 文档
      await handleWordFile(file.raw)
    } else {
      ElMessage.warning('不支持的文件格式')
      if (uploadRef.value) {
        uploadRef.value.clearFiles()
      }
      return
    }

    // 导入成功后关闭对话框
    showImportDialog.value = false
  } catch (error) {
    console.error('文件处理失败:', error)
    ElMessage.error('文件处理失败: ' + (error.message || '未知错误'))
  }
}

// 处理 HTML 文件
const handleHTMLFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      form.value.content = content

      // 切换到代码模式显示 HTML
      editMode.value = 'code'
      updateLineNumbers()

      // 等待 DOM 更新后设置富文本编辑器内容
      nextTick(() => {
        if (richEditorRef.value) {
          if (isFullHTMLDocument(content)) {
            const displayContent = extractBodyContent(content)
            richEditorRef.value.innerHTML = displayContent
          } else {
            richEditorRef.value.innerHTML = content
          }
        }
        originalContent.value = content
      })

      ElMessage.success('HTML 文件导入成功')
      resolve()
    }
    reader.onerror = reject
    reader.readAsText(file, 'utf-8')
  })
}

// 处理 Word 文档
const handleWordFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const arrayBuffer = e.target.result

      // 使用 mammoth 将 Word 转换为 HTML
      // 配置选项：尽量简化样式转换，减少无用类名
      mammoth.convertToHtml(
        { arrayBuffer: arrayBuffer }
      )
        .then((result) => {
          const html = result.value
          const messages = result.messages

          // 显示转换警告（如果有）
          if (messages.length > 0) {
            console.warn('Word 转换警告:', messages)
          }

          // 将转换后的 HTML 包装成完整的 HTML 文档
          const fullHTML = wrapWordHTML(html)
          form.value.content = fullHTML

          // 切换到代码模式显示 HTML
          editMode.value = 'code'
          updateLineNumbers()

          // 等待 DOM 更新后设置富文本编辑器内容
          nextTick(() => {
            if (richEditorRef.value) {
              const displayContent = extractBodyContent(fullHTML)
              richEditorRef.value.innerHTML = displayContent
            }
            originalContent.value = fullHTML
          })

          ElMessage.success('Word 文档导入成功')
          resolve()
        })
        .catch((error) => {
          console.error('Word 转换失败:', error)
          reject(new Error('Word 文档转换失败: ' + error.message))
        })
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// 清理富文本编辑器生成的无用类名和样式
const cleanRichTextHTML = (html) => {
  try {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')

    // 判断无用类名的规则：
    // 1. auto- 开头：auto-hide-last-sibling-br 等浏览器自动生成的类名
    // 2. br- 开头：br-paragraph-space 等浏览器自动生成的类名
    // 3. mce- 开头：TinyMCE 编辑器生成的类名
    // 4. cke_ 开头：CKEditor 编辑器生成的类名
    // 5. [a-z]+-[A-Z0-9]{5,}：随机生成的类名，如 header-vfC6AV、paragraph-JOTKXA
    // 6. paragraph-[A-Z0-9]+：paragraph- 后跟随机字符，如 paragraph-JOTKXA
    // 7. header-[A-Z0-9]+：header- 后跟随机字符，如 header-vfC6AV
    // 8. paragraph-element：固定的无用类名
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
          // 如果类名匹配无用类名模式，则过滤掉
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
  } catch {
    return html
  }
}

// 将 Word 转换的 HTML 包装成完整的 HTML 文档
const wrapWordHTML = (html) => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>协议文档</title>
</head>
<body>
${html}
</body>
</html>`
}

// 移除文件
const handleFileRemove = () => {
  // 文件移除时不清空内容，用户可以继续编辑
}

// 更新行号
const updateLineNumbers = () => {
  if (!form.value.content) {
    codeLines.value = [1]
    return
  }
  const lines = form.value.content.split('\n').length
  codeLines.value = Array.from({ length: lines }, (_, i) => i + 1)
}

// 同步滚动行号和文本区域
const handleCodeScroll = () => {
  if (lineNumbersRef.value && codeTextareaRef.value) {
    lineNumbersRef.value.scrollTop = codeTextareaRef.value.scrollTop
  }
}

// 中文输入结束
const handleCompositionEnd = (e) => {
  isComposing.value = false
}

// 检查是否是完整的 HTML 文档（包含 html 和 body 标签）
const isFullHTMLDocument = (html) => {
  return /<!DOCTYPE\s+html/i.test(html) || /<html/i.test(html)
}

// 从完整 HTML 文档中提取 body 内容
const extractBodyContent = (html) => {
  if (!isFullHTMLDocument(html)) {
    return html
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return doc.body.innerHTML
}

// 格式化 HTML（美化代码）
const formatHTML = (html) => {
  if (!html) return html

  // 使用 DOMParser 解析 HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // 格式化函数
  const formatNode = (node, indent = 0) => {
    const indentStr = '  '.repeat(indent)
    const nextIndent = indent + 1

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim()
      return text ? `${indentStr}${text}\n` : ''
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase()
      const attrs = []

      // 收集属性
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

      // 如果是自闭合标签或空标签
      const voidTags = ['br', 'hr', 'img', 'input', 'meta', 'link']
      if (voidTags.includes(tagName) && !node.textContent.trim() && children.length === 0) {
        return `${indentStr}<${tagName}${attrStr}>\n`
      }

      // 处理有内容的标签
      let content = ''
      if (children.length > 0) {
        if (hasTextChildren || children.length > 1) {
          // 有子节点，需要换行
          content = '\n'
          children.forEach(child => {
            const childContent = formatNode(child, nextIndent)
            if (childContent) {
              content += childContent
            }
          })
          content += indentStr
        } else {
          // 只有一个子节点且是文本，不换行
          content = children[0].textContent.trim()
        }
      }

      return `${indentStr}<${tagName}${attrStr}>${content}</${tagName}>\n`
    }

    return ''
  }

  // 格式化整个文档
  let formatted = ''

  // 处理 DOCTYPE
  if (html.trim().startsWith('<!DOCTYPE')) {
    const doctypeMatch = html.match(/<!DOCTYPE[^>]*>/i)
    if (doctypeMatch) {
      formatted += doctypeMatch[0] + '\n'
    }
  }

  // 格式化 html 标签及其内容
  if (doc.documentElement) {
    formatted += formatNode(doc.documentElement, 0)
  } else if (doc.body) {
    // 如果没有 html 标签，只格式化 body
    formatted += formatNode(doc.body, 0)
  }

  return formatted.trim()
}

// 将 body 内容包装回完整的 HTML 文档结构
const wrapToFullHTML = (bodyContent, originalHTML) => {
  if (!isFullHTMLDocument(originalHTML)) {
    return bodyContent
  }

  // 提取原始 HTML 的 head 部分和其他元信息
  const parser = new DOMParser()
  const originalDoc = parser.parseFromString(originalHTML, 'text/html')

  // 构建新的 HTML 文档
  let newHTML = ''

  // 检查是否有 DOCTYPE
  if (/<!DOCTYPE/i.test(originalHTML)) {
    const doctypeMatch = originalHTML.match(/<!DOCTYPE[^>]*>/i)
    if (doctypeMatch) {
      newHTML += doctypeMatch[0] + '\n'
    }
  }

  // 检查是否有 html 标签的属性（如 lang）
  const htmlMatch = originalHTML.match(/<html[^>]*>/i)
  if (htmlMatch) {
    newHTML += htmlMatch[0] + '\n'
  } else {
    newHTML += '<html>\n'
  }

  // 添加 head（如果有）
  if (originalDoc.head && originalDoc.head.innerHTML) {
    // 提取原始 head 标签及其所有属性
    const headMatch = originalHTML.match(/<head[^>]*>/i)
    let headTag = '<head>'
    if (headMatch) {
      headTag = headMatch[0]
    }
    newHTML += headTag + '\n' + originalDoc.head.innerHTML + '\n</head>\n'
  }

  // 提取原始 body 标签及其所有属性
  const bodyMatch = originalHTML.match(/<body[^>]*>/i)
  let bodyTag = '<body>'
  if (bodyMatch) {
    bodyTag = bodyMatch[0]
  }

  // 添加 body 内容（保留原始 body 标签属性）
  newHTML += bodyTag + '\n' + bodyContent + '\n</body>\n</html>'

  return newHTML
}


const fetchProtocol = async () => {
  const filename = route.params.filename
  if (!filename) return

  isEdit.value = true
  try {
    const res = await getProtocol(filename)
    console.log('协议数据:', res.data) // 调试用
    form.value = {
      filename: res.data.filename || filename,
      content: res.data.content || ''
    }
    // 保存原始内容（用于格式保持）
    originalContent.value = res.data.content || ''
    // 保存原始 HTML 内容（用于参数替换）
    originalHTMLContent.value = res.data.content || ''
    // 更新行号
    updateLineNumbers()
    // 等待 DOM 更新后设置富文本编辑器内容
    await nextTick()
    if (editMode.value === 'rich' && richEditorRef.value) {
      // 如果是完整 HTML 文档，只提取 body 内容显示
      const displayContent = extractBodyContent(form.value.content)
      richEditorRef.value.innerHTML = displayContent
    }
  } catch (error) {
    console.error('获取协议失败:', error)
    ElMessage.error('获取协议内容失败: ' + (error.message || '未知错误'))
  }
}

// 监听编辑模式切换（处理富文本、代码和预览模式）
watch(editMode, async (newMode) => {
  await nextTick()
  if (newMode === 'rich' && richEditorRef.value && form.value.content) {
    // 如果是完整 HTML 文档，只提取 body 内容显示
    const displayContent = extractBodyContent(form.value.content)
    richEditorRef.value.innerHTML = displayContent
    // 保存原始内容
    originalContent.value = form.value.content
    // 保存原始 HTML 内容（用于参数替换）
    originalHTMLContent.value = form.value.content
  } else if (newMode === 'preview') {
    // 切换到预览模式
    if (isParameterizedProtocol.value) {
      // 确保保存了原始内容
      if (!originalHTMLContent.value && form.value.content) {
        originalHTMLContent.value = form.value.content
      }
    }
    // 生成预览链接
    generatePreviewUrl()
  } else {
    // 切换到其他模式时清理预览状态
    previewUrl.value = ''
    previewError.value = ''
    if (previewUrlTimer) {
      clearTimeout(previewUrlTimer)
      previewUrlTimer = null
    }
    if (newMode === 'code') {
      // 切换到代码模式时更新行号
      updateLineNumbers()
    }
  }
}, { immediate: true })

// 监听内容变化，更新行号
watch(() => form.value.content, () => {
  if (editMode.value === 'code') {
    updateLineNumbers()
  }
})


// 检查文件名是否重复
const checkFilenameDuplicate = async (filename) => {
  if (!filename) return false

  // 确保文件名以 .html 结尾
  const fullFilename = filename.endsWith('.html') ? filename : `${filename}.html`

  // 如果是编辑模式，且文件名没变，不算重复
  if (isEdit.value) {
    const routeFilename = route.params.filename
    if (routeFilename && decodeURIComponent(routeFilename) === fullFilename) {
      return false
    }
  }

  // 检查协议列表中是否存在
  const exists = protocolList.value.some(item => item.filename === fullFilename)
  return exists
}

const handleSave = async () => {
  if (!form.value.filename) {
    ElMessage.warning('请输入文件名')
    return
  }

  // 新建协议时，检查文件名是否重复
  if (!isEdit.value) {
    const isDuplicate = await checkFilenameDuplicate(form.value.filename)
    if (isDuplicate) {
      ElMessage.error('文件名已存在，请使用其他文件名')
      return
    }
  }

  // 富文本模式：直接使用 innerHTML（浏览器会标准化格式，这是无法避免的）
  // 如果必须保持格式不变，请使用代码模式编辑
  if (editMode.value === 'rich' && richEditorRef.value) {
    let htmlContent = ''

    if (originalContent.value && isFullHTMLDocument(originalContent.value)) {
      // 如果是完整HTML文档，需要包装回完整结构
      const bodyContent = richEditorRef.value.innerHTML
      // 清理富文本编辑器生成的无用类名和样式
      const cleanedBodyContent = cleanRichTextHTML(bodyContent)
      htmlContent = wrapToFullHTML(cleanedBodyContent, originalContent.value)
    } else {
      // 不是完整文档或新建文件，直接使用 innerHTML
      // 清理富文本编辑器生成的无用类名和样式
      htmlContent = cleanRichTextHTML(richEditorRef.value.innerHTML)
    }

    // 格式化 HTML
    form.value.content = formatHTML(htmlContent)
  } else if (editMode.value === 'code') {
    // 代码模式：也进行格式化（如果内容存在）
    if (form.value.content) {
      form.value.content = formatHTML(form.value.content)
    }
  }

  if (!form.value.content) {
    ElMessage.warning('请输入协议内容')
    return
  }

  try {
    if (isEdit.value) {
      await updateProtocol(form.value.filename, form.value)
    } else {
      await createProtocol(form.value)
    }
    ElMessage.success('保存成功')
    router.push('/protocols')
  } catch (error) {
    // 处理后端返回的错误信息
    if (error.response && error.response.data && error.response.data.error) {
      ElMessage.error(error.response.data.error)
    } else if (error.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('保存失败')
    }
  }
}

const handleCancel = () => {
  router.push('/protocols')
}

// 获取协议列表用于文件名重复检查
const fetchProtocolList = async () => {
  try {
    const res = await getProtocolList()
    protocolList.value = res.data
  } catch (error) {
    console.error('获取协议列表失败:', error)
  }
}

// 预览功能：根据协议类型显示不同的字段
const showPreviewField = (fieldName) => {
  const protocol = previewForm.value.protocol
  const protocolType = previewForm.value.protocolType

  if (protocol === 'usercancel') {
    return fieldName === 'name'
  }

  if (protocol === 'about') {
    if (protocolType === 'dj') {
      return ['name', 'company', 'address', 'postcode'].includes(fieldName)
    } else {
      return ['name', 'company', 'briefCompany'].includes(fieldName)
    }
  }

  if (protocol === 'privacy') {
    if (protocolType === 'dj') {
      return ['name', 'company', 'briefCompany'].includes(fieldName)
    } else {
      return ['name', 'company', 'briefCompany'].includes(fieldName)
    }
  }

  if (protocol === 'vodAgreement' || protocol === 'vod') {
    return ['name', 'company'].includes(fieldName)
  }

  return false
}

// 重置预览表单
const resetPreviewForm = () => {
  previewForm.value.params = {
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
  // 预览内容会自动更新（通过计算属性）
}

onMounted(async () => {
  // 获取协议列表
  await fetchProtocolList()
  // 如果是编辑模式，获取协议内容
  if (route.params.filename) {
    fetchProtocol()
  }
})
</script>


<style scoped>
.protocol-edit {
  padding: 20px;
  min-height: 100vh;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-buttons {
  display: flex;
  gap: 8px;
}

/* 模式提示样式 */
.mode-tips {
  margin-bottom: 14px;
  margin-left: 100px; /* 与表单项 label-width 对齐 */
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 4px;
  margin-bottom: 6px;
  line-height: 1.5;
  font-size: 13px;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-warning {
  background-color: #fef0e6;
  border: 1px solid #f5dab1;
  color: #e6a23c;
}

.tip-info {
  background-color: #e8f4fd;
  border: 1px solid #b3d8ff;
  color: #409eff;
}

.tip-icon {
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 1px;
}

.tip-content {
  flex: 1;
  color: #606266;
}

.tip-content strong {
  color: #303133;
  font-weight: 600;
}

.editor-wrapper {
  width: 100%;
}

.code-editor-wrapper {
  display: flex;
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  height: 600px;
}

.line-numbers {
  background-color: #f5f7fa;
  color: #909399;
  padding: 10px 8px;
  text-align: right;
  user-select: none;
  overflow: hidden;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  min-width: 50px;
  border-right: 1px solid #dcdfe6;
}

.line-number {
  min-height: 1.6em;
  padding-right: 8px;
}

.editor-textarea {
  padding: 10px;
  border: none;
  border-radius: 0;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  resize: none;
  outline: none;
  line-height: 1.6;
}

.code-editor {
  flex: 1;
  width: 0; /* 强制 flex 子元素不超出容器 */
  height: 100%;
  overflow-y: auto;
}

.rich-editor-wrapper {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.editor-rich {
  min-height: 600px;
  max-height: 800px;
  padding: 15px;
  background: white;
  overflow-y: auto;
  overflow-x: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

/* 富文本编辑器中的表格样式 */
.editor-rich :deep(table) {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  margin: 10px 0;
  border: 1px solid #dcdfe6;
}

.editor-rich :deep(table td),
.editor-rich :deep(table th) {
  border: 1px solid #dcdfe6;
  padding: 8px 12px;
  text-align: left;
  word-wrap: break-word;
  word-break: break-all;
}

.editor-rich :deep(table th) {
  background-color: #f5f7fa;
  font-weight: 600;
  text-align: center;
}

.editor-rich :deep(table tr:nth-child(even)) {
  background-color: #fafafa;
}

.editor-rich :deep(table tr:hover) {
  background-color: #f0f2f5;
}

/* 预览参数设置卡片样式 */
.preview-params-card {
  margin-bottom: 16px;
  border: 1px solid #e4e7ed;
  width: 100%;
}

.preview-params-card :deep(.el-card__body) {
  width: 100%;
}

.preview-params-card :deep(.el-card__header) {
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.params-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.params-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  flex: 1;
}

.reset-btn {
  margin-left: auto;
  padding: 4px 8px;
}

.reset-btn .el-icon {
  margin-right: 4px;
}

.preview-params-form {
  padding: 8px 0;
  width: 100%;
}

.preview-params-form :deep(.el-row) {
  width: 100%;
  margin: 0;
}

.preview-params-form :deep(.el-col) {
  padding: 0;
}

.preview-params-form :deep(.el-form-item) {
  margin-bottom: 10px;
}

.preview-params-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

.preview-params-form :deep(.el-input__prefix) {
  color: #909399;
}

.preview-params-form :deep(.el-divider__text) {
  display: flex;
  align-items: center;
  color: #606266;
  font-size: 13px;
  font-weight: 500;
}

/* 预览模式样式 */
.preview-wrapper {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.preview-iframe {
  width: 100%;
  min-height: 600px;
  max-height: 800px;
  border: none;
  border-radius: 4px;
}

</style>


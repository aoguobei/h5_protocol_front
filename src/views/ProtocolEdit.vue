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
        <el-row :gutter="20">
          <el-col :span="10">
            <el-form-item label="文件名">
              <el-input v-model="form.filename" placeholder="例如: ys_common_agreement.html" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="应用名称">
              <el-input v-model="form.app_name" placeholder="例如: 长江云短剧" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="10">
            <el-form-item label="应用类型">
              <el-input v-model="form.app_type" placeholder="例如: miniapp" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="描述">
              <el-input v-model="form.description" placeholder="请输入协议描述" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="编辑模式">
          <div>
            <el-radio-group v-model="editMode">
              <el-radio value="visual">可视化编辑</el-radio>
              <el-radio value="rich">富文本模式</el-radio>
              <el-radio v-if="isEdit && isParameterizedProtocol" value="preview">预览模式</el-radio>
            </el-radio-group>
            <div class="mode-tips">
              <div v-if="editMode === 'visual'" class="tip-text">
                <el-icon><InfoFilled /></el-icon>
                <span>左侧编辑代码，右侧实时预览效果，支持 JavaScript 执行</span>
              </div>
              <div v-else-if="editMode === 'rich'" class="tip-text">
                <el-icon><InfoFilled /></el-icon>
                <span>快速编辑文本内容和样式，不支持 JavaScript 预览（需查看效果请切换到可视化模式）</span>
              </div>
              <div v-else-if="editMode === 'preview'" class="tip-text">
                <el-icon><InfoFilled /></el-icon>
                <span>填写参数预览最终效果，适用于参数化协议</span>
              </div>
            </div>
          </div>
        </el-form-item>


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
            <span style="margin-left: 8px; color: #909399; font-size: 12px;">支持 Word (.doc, .docx) 文件</span>
          </div>

          <!-- 预览模式：参数输入表单（动态渲染） -->
          <el-card v-if="editMode === 'preview' && protocolConfig" class="preview-params-card" shadow="never">
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
            <el-form :model="previewForm" label-width="120px" size="default" class="preview-params-form">
              <DynamicFormFields
                :fields="protocolConfig.fields"
                v-model="previewForm.params"
                label-width="100px"
              />
            </el-form>
          </el-card>

          <!-- 可视化编辑模式：左侧代码，右侧预览 -->
          <div v-if="editMode === 'visual'" class="visual-editor-wrapper" :class="{ 'fullscreen': isFullscreen }">
            <div class="visual-code">
              <div class="code-header">
                <span>HTML 代码</span>
                <el-button text @click="toggleFullscreen" class="fullscreen-btn">
                  <el-icon><Close v-if="isFullscreen" /><FullScreen v-else /></el-icon>
                </el-button>
              </div>
              <div class="code-editor-wrapper">
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
            </div>
            <div class="visual-preview">
              <div class="preview-header">实时预览</div>
              <iframe
                ref="visualPreviewRef"
                :srcdoc="visualPreviewContent"
                class="visual-preview-iframe"
                frameborder="0"
              ></iframe>
            </div>
          </div>

          <div v-else-if="editMode === 'rich'" class="rich-editor-wrapper" :class="{ 'fullscreen': isFullscreen }">
            <div class="rich-toolbar">
              <el-button text @click="toggleFullscreen" class="fullscreen-btn-toolbar">
                <el-icon><Close v-if="isFullscreen" /><FullScreen v-else /></el-icon>
              </el-button>
              <span class="toolbar-divider"></span>
              <button @click.prevent="undo" :disabled="!canUndo" class="toolbar-btn" title="撤销 (Ctrl+Z)">
                ↶
              </button>
              <span class="toolbar-divider"></span>
              <select @change="execFontWeight" class="toolbar-select" title="字体粗细">
                <option value="">-- 粗细 --</option>
                <option value="400">正常 (400)</option>
                <option value="500">中等 (500)</option>
                <option value="600">半粗 (600)</option>
                <option value="700">加粗 (700)</option>
                <option value="800">特粗 (800)</option>
                <option value="900">最粗 (900)</option>
              </select>
              <span class="toolbar-divider"></span>
              <select @change="execFontSize" class="toolbar-select" title="字号">
                <option value="">-- 字号 --</option>
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
                <option value="20">20px</option>
                <option value="24">24px</option>
                <option value="28">28px</option>
                <option value="32">32px</option>
              </select>
              <input type="color" @focus="saveSelection" @input="execForeColor" class="toolbar-color" title="文字颜色" />
            </div>
            <div
              ref="richEditorRef"
              contenteditable="true"
              class="editor-rich"
              @mouseup="saveSelection"
              @keyup="saveSelection"
              @keydown="handleKeyDown"
              @input="handleRichEditorInput"
            ></div>
          </div>
          <div v-else-if="editMode === 'preview'" class="preview-wrapper" :class="{ 'fullscreen': isFullscreen }">
            <div class="preview-header-bar">
              <span>预览</span>
              <el-button text @click="toggleFullscreen" class="fullscreen-btn">
                <el-icon><Close v-if="isFullscreen" /><FullScreen v-else /></el-icon>
              </el-button>
            </div>
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

          accept=".doc,.docx"
          drag
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip" style="color: #909399; font-size: 12px;">支持上传 Word 文档 (.doc, .docx)</div>
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
  InfoFilled,
  FullScreen,
  Close,
} from '@element-plus/icons-vue'
import mammoth from 'mammoth'
import { getProtocol, createProtocol, updateProtocol, getProtocolList } from '../api/protocol'
import { createPastebinPreview } from '../api/pastebin'
import { useUserStore } from '@/stores/user.js'
import { getProtocolConfig, getNestedValue, setNestedValue } from '@/config/protocolParams'
import { createScriptTag, injectScript, inlineUtilsScript } from '@/utils/scriptInjector'
import { isFullHTMLDocument, extractBodyContent, wrapToFullHTML, optimizeHTMLStyles, wrapWordHTML, formatHTML, cleanRichTextHTML } from '@/utils/htmlFormatter'
import DynamicFormFields from '@/components/DynamicFormFields.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore();


// 构建参数配置对象（只包含有值的参数）
const buildParamsConfig = () => {
  const config = {}
  if (protocolConfig.value) {
    protocolConfig.value.fields.forEach(field => {
      const value = getNestedValue(previewForm.value.params, field.key)
      if (value) {
        setNestedValue(config, field.key, value)
      }
    })
  }
  return config
}

const isEdit = ref(false)
const editMode = ref('visual') // 默认使用可视化模式
const visualPreviewRef = ref(null)
const richEditorRef = ref(null)
const codeTextareaRef = ref(null)
const lineNumbersRef = ref(null)
const uploadRef = ref(null)
const showImportDialog = ref(false)
const codeLines = ref([1])
const isExecutingCommand = ref(false) // 是否正在执行命令
const originalContent = ref('') // 保存原始 HTML 内容
const savedSelection = ref(null) // 保存的选区
const historyStack = ref([]) // 历史记录栈（最多30条）
const historyIndex = ref(-1) // 当前历史位置
let saveHistoryTimer = null // 防抖定时器
const protocolList = ref([]) // 协议列表，用于检查文件名重复
const form = ref({
  filename: '',
  content: '',
  app_name: '',
  app_type: '',
  description: ''
})

// 检查用户是否有编辑权限
const hasEditPermission = computed(() => {
  return userStore.role === 'admin' || userStore.role === 'editor'
})

// 预览功能相关
const previewForm = ref({
  params: {}
})

// 获取当前协议配置
const protocolConfig = computed(() => {
  return getProtocolConfig(form.value.filename)
})

// 判断是否是参数化协议
const isParameterizedProtocol = computed(() => {
  return !!protocolConfig.value
})

// 保存原始 HTML 内容（用于参数替换）
const originalHTMLContent = ref('')

// 可视化预览内容（内联 utils.js）
const visualPreviewContent = computed(() => {
  if (!form.value.content) return ''
  return inlineUtilsScript(form.value.content)
})

// 监听文件名变化，初始化预览表单
watch(() => form.value.filename, (newFilename) => {
  if (newFilename && protocolConfig.value) {
    // 初始化参数对象
    const params = {}
    protocolConfig.value.fields.forEach(field => {
      setNestedValue(params, field.key, '')
    })
    previewForm.value.params = params

    // 保存原始内容
    if (isEdit.value && form.value.content) {
      originalHTMLContent.value = form.value.content
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
const isFullscreen = ref(false) // 全屏状态

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

      // 统一使用内联注入方式
      const htmlContent = generatePreviewHtmlContent()
      previewUrl.value = await createPastebinPreview(htmlContent)

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
  // 不要在这里切换模式！
})


// 生成预览HTML内容（在HTML开头注入脚本标签设置全局变量）
const generatePreviewHtmlContent = () => {
  if (!form.value.content) return ''

  let htmlContent = form.value.content

  // 内联 utils.js（所有协议都需要）
  htmlContent = inlineUtilsScript(htmlContent)

  // 如果是参数化协议，需要在HTML中注入参数
  if (protocolConfig.value) {
    // 构建参数配置
    const config = buildParamsConfig()
    const configJson = JSON.stringify(config, null, 2)
    const injectedScript = createScriptTag('\n// 预览模式注入的参数配置\nwindow.__PREVIEW_CONFIG__ = ' + configJson + ';\n')

    // 在 utils.js 之前注入脚本
    htmlContent = injectScript(htmlContent, injectedScript, true)

    // 修改HTML中的参数读取逻辑，优先使用 window.__PREVIEW_CONFIG__
    // 匹配使用 paramConfig 的代码
    const paramConfigPattern = /if\s*\(getParamsFromUrl\(url\)\.paramConfig\)\s*\{[\s\S]*?Object\.assign\(config,\s*JSON\.parse\(params\)\)[\s\S]*?\}/
    if (paramConfigPattern.test(htmlContent)) {
      htmlContent = htmlContent.replace(
        paramConfigPattern,
        `// 优先使用预览配置\n  if (window.__PREVIEW_CONFIG__) {\n    Object.assign(config, window.__PREVIEW_CONFIG__)\n  } else if (getParamsFromUrl(url).paramConfig) {\n    const params = decodeURIComponent(getParamsFromUrl(url).paramConfig)\n    Object.assign(config, JSON.parse(params))\n  }`
      )
    }

    // 处理独立参数读取（useQueryParams 协议）
    // 匹配类似：const name = getParamsFromUrl(url).name
    if (protocolConfig.value.useQueryParams) {
      protocolConfig.value.fields.forEach(field => {
        const key = field.key.split('.').pop() // 获取最后一级的key
        const pattern = new RegExp(`const\\s+(\\w+)\\s*=\\s*getParamsFromUrl\\(url\\)\\.${key}`, 'g')
        htmlContent = htmlContent.replace(pattern, (match, varName) => {
          return `const ${varName} = window.__PREVIEW_CONFIG__?.${field.key} || getParamsFromUrl(url).${key}`
        })
      })
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
  if (!richEditorRef.value || isExecutingCommand.value) return
  syncRichEditorContent()
  saveToHistoryDebounced()
}

// 防抖保存历史（500ms内只保存一次）
const saveToHistoryDebounced = () => {
  if (saveHistoryTimer) clearTimeout(saveHistoryTimer)
  saveHistoryTimer = setTimeout(() => {
    saveToHistory()
  }, 500)
}

// 保存到历史记录
const saveToHistory = () => {
  if (!richEditorRef.value) return
  const content = richEditorRef.value.innerHTML

  // 如果内容与当前历史相同，不保存
  if (historyStack.value[historyIndex.value] === content) return

  // 移除当前索引之后的历史
  historyStack.value = historyStack.value.slice(0, historyIndex.value + 1)
  historyStack.value.push(content)
  historyIndex.value++

  // 限制最多30条
  if (historyStack.value.length > 30) {
    historyStack.value.shift()
    historyIndex.value--
  }
}

// 是否可以撤销
const canUndo = computed(() => historyIndex.value > 0)

// 撤销
const undo = () => {
  if (!canUndo.value || !richEditorRef.value) return
  historyIndex.value--
  isExecutingCommand.value = true
  richEditorRef.value.innerHTML = historyStack.value[historyIndex.value]
  setTimeout(() => {
    isExecutingCommand.value = false
    syncRichEditorContent()
  }, 50)
}

// 处理键盘快捷键
const handleKeyDown = (e) => {
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault()
    undo()
  }
}

// 同步富文本编辑器内容到 form.value.content
// 注意：contenteditable 的 innerHTML 已经被浏览器标准化，无法完全保持原始格式
const syncRichEditorContent = () => {
  if (!richEditorRef.value) return

  let htmlContent = ''

  if (originalContent.value && isFullHTMLDocument(originalContent.value)) {
    // 如枟是完整HTML文档，包装回完整结构
    const bodyContent = richEditorRef.value.innerHTML
    const cleanedBodyContent = cleanRichTextHTML(bodyContent)
    htmlContent = wrapToFullHTML(cleanedBodyContent, originalContent.value)
  } else {
    // 不是完整文档或新建文件，直接使用 innerHTML
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

  // 只支持 Word 文件
  if (fileExtension !== 'doc' && fileExtension !== 'docx') {
    ElMessage.warning('只支持导入 Word 文档 (.doc, .docx)')
    if (uploadRef.value) {
      uploadRef.value.clearFiles()
    }
    return
  }

  try {
    await handleWordFile(file.raw)

    // 导入成功后关闭对话框
    showImportDialog.value = false
  } catch (error) {
    console.error('文件处理失败:', error)
    ElMessage.error('文件处理失败: ' + (error.message || '未知错误'))
  }
}

// 处理 Word 文档
const handleWordFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const arrayBuffer = e.target.result

      // 使用 mammoth 将 Word 转换为 HTML，配置样式映射以保留更多格式
      mammoth.convertToHtml(
        { arrayBuffer: arrayBuffer },
        {
          styleMap: [
            // 保留段落样式
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='标题 1'] => h1:fresh",
            "p[style-name='标题 2'] => h2:fresh",
            "p[style-name='标题 3'] => h3:fresh",
            // 保留列表样式
            "p[style-name='List Paragraph'] => p:fresh",
            "p[style-name='列表段落'] => p:fresh"
          ],
          // 转换内联样式
          convertImage: mammoth.images.imgElement((image) => {
            return image.read("base64").then((imageBuffer) => {
              return {
                src: "data:" + image.contentType + ";base64," + imageBuffer
              }
            })
          }),
          // 保留原始样式
          includeDefaultStyleMap: true
        }
      )
        .then((result) => {
          const html = result.value
          const messages = result.messages

          // 显示转换警告（如果有）
          if (messages.length > 0) {
            console.warn('Word 转换警告:', messages)
            console.warn('部分样式可能未完全保留（如字体、颜色、对齐方式等）')
          }

          // 清理和优化 HTML
          const cleanedHTML = optimizeHTMLStyles(html)
          // 将转换后的 HTML 包装成完整的 HTML 文档
          const fullHTML = wrapWordHTML(cleanedHTML)
          form.value.content = fullHTML

          // 切换到可视化模式，方便查看效果和调整
          editMode.value = 'visual'
          updateLineNumbers()

          // 等待 DOM 更新后设置富文本编辑器内容
          nextTick(() => {
            if (richEditorRef.value) {
              const displayContent = extractBodyContent(fullHTML)
              richEditorRef.value.innerHTML = displayContent
            }
            originalContent.value = fullHTML
          })

          ElMessage.success('Word 文档导入成功，请在右侧预览中检查样式')
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

// 保存当前选区
const saveSelection = () => {
  const selection = window.getSelection()
  if (selection.rangeCount > 0) {
    savedSelection.value = selection.getRangeAt(0)
  }
}

// 恢复选区
const restoreSelection = () => {
  if (savedSelection.value) {
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(savedSelection.value)
  }
}

// 应用样式到选中文本
const applyStyle = (styleName, styleValue) => {
  isExecutingCommand.value = true

  // 恢复之前保存的选区
  restoreSelection()

  const selection = window.getSelection()
  if (!selection.rangeCount) return

  const range = selection.getRangeAt(0)
  const span = document.createElement('span')
  span.style[styleName] = styleValue

  try {
    range.surroundContents(span)
  } catch {
    const fragment = range.extractContents()
    span.appendChild(fragment)
    range.insertNode(span)
  }

  setTimeout(() => {
    isExecutingCommand.value = false
    syncRichEditorContent()
    saveToHistory()
  }, 100)
}

// 设置字体粗细
const execFontWeight = (e) => {
  const weight = e.target.value
  if (weight) {
    applyStyle('fontWeight', weight)
    e.target.value = ''
  }
}

// 设置字号
const execFontSize = (e) => {
  const size = e.target.value
  if (size) {
    applyStyle('fontSize', size + 'px')
    e.target.value = ''
  }
}

// 设置文字颜色
const execForeColor = (e) => {
  if (e.target.value) {
    applyStyle('color', e.target.value)
  }
}


const fetchProtocol = async () => {
  const filename = route.params.filename
  if (!filename) return

  isEdit.value = true
  try {
    const res = await getProtocol(filename)
    form.value = {
      filename: res.data.filename || filename,
      content: res.data.content || '',
      app_name: res.data.app_name || '',
      app_type: res.data.app_type || '',
      description: res.data.description || ''
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

// 监听编辑模式切换（处理富文本、代码、可视化和预览模式）
watch(editMode, async (newMode) => {
  await nextTick()
  if (newMode === 'rich' && richEditorRef.value && form.value.content) {
    const displayContent = extractBodyContent(form.value.content)
    richEditorRef.value.innerHTML = displayContent
    originalContent.value = form.value.content
    originalHTMLContent.value = form.value.content
    // 初始化历史记录
    historyStack.value = [displayContent]
    historyIndex.value = 0
  } else if (newMode === 'preview') {
    if (isParameterizedProtocol.value) {
      if (!originalHTMLContent.value && form.value.content) {
        originalHTMLContent.value = form.value.content
      }
    }
    generatePreviewUrl()
  } else {
    previewUrl.value = ''
    previewError.value = ''
    if (previewUrlTimer) {
      clearTimeout(previewUrlTimer)
      previewUrlTimer = null
    }
    if (newMode === 'visual') {
      updateLineNumbers()
    }
  }
}, { immediate: true })

// 监听内容变化，更新行号
watch(() => form.value.content, () => {
  if (editMode.value === 'visual') {
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
  if (!hasEditPermission.value) {
    ElMessage.error('权限不足，无法保存协议')
    return
  }

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

  // 富文本模式：注意 contenteditable 会导致 HTML 标准化
  if (editMode.value === 'rich' && richEditorRef.value) {
    let htmlContent = ''

    if (originalContent.value && isFullHTMLDocument(originalContent.value)) {
      const bodyContent = richEditorRef.value.innerHTML
      const cleanedBodyContent = cleanRichTextHTML(bodyContent)
      htmlContent = wrapToFullHTML(cleanedBodyContent, originalContent.value)
    } else {
      htmlContent = cleanRichTextHTML(richEditorRef.value.innerHTML)
      htmlContent = formatHTML(htmlContent)
    }

    form.value.content = htmlContent
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
    if (error.response && error.response.data.error) {
      ElMessage.error(error.response.data.error)
    } else if (error.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('保存失败')
    }
  }
}

const handleCancel = () => {
  router.back()
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

// 重置预览表单
const resetPreviewForm = () => {
  if (protocolConfig.value) {
    const params = {}
    protocolConfig.value.fields.forEach(field => {
      setNestedValue(params, field.key, '')
    })
    previewForm.value.params = params
  }
}

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
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
  display: flex;
  flex-direction: column;
}

/* 富文本工具栏 */
.rich-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  flex-wrap: wrap;
}

.toolbar-btn {
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background-color: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

.toolbar-btn:active {
  background-color: #409eff;
  color: white;
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background-color: #f5f7fa;
  color: #c0c4cc;
}

.toolbar-btn:disabled:hover {
  background-color: #f5f7fa;
  border-color: #dcdfe6;
  color: #c0c4cc;
}

.toolbar-select {
  padding: 6px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 13px;
  height: 32px;
}

.toolbar-select:hover {
  border-color: #409eff;
}

.toolbar-color {
  width: 32px;
  height: 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  padding: 2px;
}

.toolbar-color:hover {
  border-color: #409eff;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background-color: #dcdfe6;
  margin: 0 4px;
}

.editor-rich {
  flex: 1;
  min-height: 550px;
  padding: 15px;
  background: white;
  overflow-y: auto;
  overflow-x: auto;
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

/* 可视化编辑模式样式 */
.visual-editor-wrapper {
  display: flex;
  gap: 16px;
  width: 100%;
  height: 600px;
}

.visual-preview {
  flex: 0 0 35%;
  display: flex;
  flex-direction: column;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.preview-header {
  background-color: #f5f7fa;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  border-bottom: 1px solid #dcdfe6;
}

.visual-preview-iframe {
  flex: 1;
  width: 100%;
  border: none;
  background: white;
}

.visual-code {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  min-width: 0;
}

.code-header {
  background-color: #f5f7fa;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-header-bar {
  background-color: #f5f7fa;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fullscreen-btn {
  padding: 4px 8px;
  font-size: 16px;
}

.fullscreen-btn-toolbar {
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.fullscreen-btn-toolbar:hover {
  background-color: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

.visual-code .code-editor-wrapper {
  flex: 1;
  height: auto;
  border: none;
  border-radius: 0;
}

/* 预览模式样式 */
.preview-wrapper {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-wrapper.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: white;
  border-radius: 0;
}

.visual-editor-wrapper.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: white;
  border-radius: 0;
  padding: 0;
  margin: 0;
}

.rich-editor-wrapper.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: white;
  border-radius: 0;
}

.preview-iframe {
  width: 100%;
  min-height: 600px;
  max-height: 800px;
  border: none;
  border-radius: 4px;
  flex: 1;
}

.preview-wrapper.fullscreen .preview-iframe {
  min-height: 100%;
  max-height: 100%;
  height: 100%;
}

.mode-tips {
  margin-top: 8px;
}

.tip-text {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0px 12px;
  background-color: #f0f9ff;
  border-radius: 4px;
  color: #606266;
  font-size: 13px;
  border-left: 3px solid #409eff;
}

.tip-text .el-icon {
  color: #409eff;
  font-size: 14px;
}

</style>


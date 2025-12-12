<template>
  <el-row :gutter="20">
    <el-col v-for="field in fields" :key="field.key" :span="field.span || 24">
      <el-form-item
        :label="field.label"
        :label-width="field.labelWidth || labelWidth"
        :required="getFieldRequired(field)"
      >
      <el-input
        v-if="field.type === 'text'"
        :model-value="getValue(field.key)"
        @update:model-value="setValue(field.key, $event)"
        :placeholder="field.placeholder"
        clearable
      />
      <el-input
        v-else-if="field.type === 'textarea'"
        :model-value="getValue(field.key)"
        @update:model-value="setValue(field.key, $event)"
        type="textarea"
        :rows="field.rows || 2"
        :placeholder="field.placeholder"
        clearable
      />
      </el-form-item>
    </el-col>
  </el-row>
</template>

<script setup>
import { getNestedValue, setNestedValue } from '@/config/protocolParams'

const props = defineProps({
  fields: {
    type: Array,
    required: true,
    default: () => []
  },
  modelValue: {
    type: Object,
    required: true,
    default: () => ({})
  },
  requiredChecker: {
    type: Function,
    default: () => true
  },
  labelWidth: {
    type: String,
    default: '100px'
  }
})

const emit = defineEmits(['update:modelValue'])

// 获取字段值（支持嵌套路径）
const getValue = (key) => {
  return getNestedValue(props.modelValue, key) || ''
}

// 设置字段值（支持嵌套路径）
const setValue = (key, value) => {
  const newValue = { ...props.modelValue }
  setNestedValue(newValue, key, value)
  emit('update:modelValue', newValue)
}

// 判断字段是否必填
const getFieldRequired = (field) => {
  if (typeof props.requiredChecker === 'function') {
    return props.requiredChecker(field.key)
  }
  return true
}
</script>

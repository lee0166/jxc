/**
 * 鞋码范围解析工具
 * 支持格式：
 * - 连续范围：39-42 → [39, 40, 41, 42]
 * - 半码支持：37.5-39 → [37.5, 38, 38.5, 39]
 * - 逗号分隔：36,38,40 → [36, 38, 40]
 * - 混合模式：35-37,39,40-42
 */

// 预设尺码范围（只保留整数码数）
export const SIZE_PRESETS = {
  children: [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37],
  female: [35, 36, 37, 38, 39, 40],
  male: [39, 40, 41, 42, 43, 44, 45],
  all: [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45]
}

// 常用尺码预设（用于下拉选择）
export const COMMON_SIZES = [
  { label: '童鞋常用（22-37）', value: '22-37', type: 'preset' },
  { label: '女鞋常用（35-40）', value: '35-40', type: 'preset' },
  { label: '男鞋常用（39-43）', value: '39-43', type: 'preset' },
  { label: '全码段（22-45）', value: '22-45', type: 'preset' }
]

/**
 * 解析尺码范围字符串
 * @param {string} rangeStr - 尺码范围字符串，如 "39-42" 或 "36,38,40"
 * @returns {number[]} - 解析后的尺码数组
 */
export function parseSizeRange(rangeStr) {
  if (!rangeStr || typeof rangeStr !== 'string') {
    return []
  }

  const sizes = new Set()
  const parts = rangeStr.split(',').map(s => s.trim()).filter(Boolean)

  for (const part of parts) {
    // 检查是否为范围格式（如 39-42）
    const rangeMatch = part.match(/^(\d+(?:\.5)?)\s*-\s*(\d+(?:\.5)?)$/)
    if (rangeMatch) {
      const start = parseFloat(rangeMatch[1])
      const end = parseFloat(rangeMatch[2])
      
      // 生成范围内的所有尺码（支持半码）
      const rangeSizes = generateSizeRange(start, end)
      rangeSizes.forEach(size => sizes.add(size))
    } else {
      // 单个尺码
      const size = parseFloat(part)
      if (!isNaN(size) && isValidSize(size)) {
        sizes.add(size)
      }
    }
  }

  // 排序并返回
  return Array.from(sizes).sort((a, b) => a - b)
}

/**
 * 生成尺码范围
 * @param {number} start - 起始尺码
 * @param {number} end - 结束尺码
 * @returns {number[]} - 尺码数组
 */
function generateSizeRange(start, end) {
  const sizes = []
  const min = Math.min(start, end)
  const max = Math.max(start, end)

  let current = Math.floor(min)
  while (current <= max) {
    if (isValidSize(current)) {
      sizes.push(current)
    }
    // 步进1（整数）
    current += 1
  }

  return sizes
}

/**
 * 验证尺码是否有效
 * @param {number} size - 尺码
 * @returns {boolean}
 */
function isValidSize(size) {
  // 支持22-45范围内的整数码数（含童鞋），不包括半码
  return size >= 22 && size <= 45 && Number.isInteger(size)
}

/**
 * 格式化尺码显示
 * @param {number} size - 尺码
 * @returns {string}
 */
export function formatSize(size) {
  if (size === undefined || size === null) return ''
  const num = parseFloat(size)
  if (isNaN(num)) return String(size)
  
  // 整数显示为整数，半码显示为x.5
  return num % 1 === 0 ? String(parseInt(num)) : String(num)
}

/**
 * 格式化尺码范围显示
 * @param {number[]} sizes - 尺码数组
 * @returns {string}
 */
export function formatSizeRange(sizes) {
  if (!sizes || sizes.length === 0) return ''
  if (sizes.length === 1) return formatSize(sizes[0])
  
  // 排序
  const sorted = [...sizes].sort((a, b) => a - b)
  
  // 检查是否为连续范围
  let isContinuous = true
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] !== 1) {
      isContinuous = false
      break
    }
  }
  
  if (isContinuous) {
    return `${formatSize(sorted[0])}-${formatSize(sorted[sorted.length - 1])}`
  }
  
  // 非连续，用逗号分隔
  return sorted.map(formatSize).join(',')
}

/**
 * 获取预设尺码列表
 * @param {string} type - 预设类型：female|male|all
 * @returns {number[]}
 */
export function getPresetSizes(type = 'all') {
  return SIZE_PRESETS[type] || SIZE_PRESETS.all
}

/**
 * 验证尺码范围字符串是否有效
 * @param {string} rangeStr - 尺码范围字符串
 * @returns {boolean}
 */
export function isValidSizeRange(rangeStr) {
  if (!rangeStr || typeof rangeStr !== 'string') return false
  const sizes = parseSizeRange(rangeStr)
  return sizes.length > 0
}

/**
 * 生成SKU编码
 * @param {string} style - 款式
 * @param {string} color - 颜色
 * @param {number} size - 尺码
 * @returns {string}
 */
export function generateSkuCode(style, color, size) {
  const timestamp = Date.now().toString(36).toUpperCase()
  const sizeStr = formatSize(size).replace('.', '_')
  return `${style.slice(0, 4)}_${color.slice(0, 2)}_${sizeStr}_${timestamp.slice(-4)}`
}

/**
 * 解析批量录入的尺码输入
 * 支持格式：
 * - 39-42（连续范围）
 * - 36,38,40（逗号分隔）
 * - 35-40（预设范围）
 * @param {string} input - 用户输入
 * @returns {Object} - 解析结果
 */
export function parseBatchSizeInput(input) {
  const result = {
    valid: false,
    sizes: [],
    error: null,
    formatted: ''
  }

  if (!input || !input.trim()) {
    result.error = '请输入尺码'
    return result
  }

  const sizes = parseSizeRange(input)
  
  if (sizes.length === 0) {
    result.error = '无效的尺码格式，请使用如：39-42 或 36,38,40'
    return result
  }

  if (sizes.length > 20) {
    result.error = '一次最多录入20个尺码'
    return result
  }

  result.valid = true
  result.sizes = sizes
  result.formatted = formatSizeRange(sizes)
  
  return result
}

export default {
  parseSizeRange,
  formatSize,
  formatSizeRange,
  getPresetSizes,
  isValidSizeRange,
  generateSkuCode,
  parseBatchSizeInput,
  SIZE_PRESETS,
  COMMON_SIZES
}

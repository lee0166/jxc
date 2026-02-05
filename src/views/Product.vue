<template>
  <div class="product-container">
    <!-- 商品列表 -->
    <div class="product-header">
      <div class="search-bar">
        <input 
          type="text" 
          class="search-input" 
          v-model="searchKeyword" 
          placeholder="搜索条码/货号/品类"
          @input="handleSearch"
        />
        <button class="search-btn">
          <Icon name="search" :size="18" />
        </button>
      </div>
      <button class="add-product-btn" @click="openAddProductForm">
        <Icon name="add" :size="16" />
        <span>新增商品</span>
      </button>
    </div>

    <div class="product-list">
      <div class="product-item" v-for="product in displayedProducts" :key="product._id">
        <div class="product-info">
          <div class="product-basic">
            <h3 class="product-name">
              <span v-if="product.product_name" class="product-name-text">{{ product.product_name }}</span>
              {{ formatGenderType(product.gender_type) }}·{{ product.style }} · {{ product.color }} · {{ product.size }}
            </h3>
            <div class="product-codes">
              <span class="code-item" v-if="product.barcode">条码: {{ product.barcode }}</span>
              <span class="code-item" v-if="product.custom_code">货号: {{ product.custom_code }}</span>
            </div>
          </div>
          <div class="product-details">
            <div class="detail-item">
              <span class="detail-label">进货价:</span>
              <span class="detail-value">¥{{ product.purchase_price.toFixed(2) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">销售价:</span>
              <span class="detail-value">¥{{ product.sale_price.toFixed(2) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">供应商:</span>
              <span class="detail-value">{{ product.supplier }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">状态:</span>
              <span class="detail-value status-badge" :class="product.status">
                {{ product.status === '启用' ? '启用' : '禁用' }}
              </span>
            </div>
          </div>
        </div>
        <div class="product-actions">
          <button class="action-btn edit-btn" @click="editProduct(product)">
            <Icon name="edit" :size="14" />
            编辑
          </button>
          <button class="action-btn delete-btn" @click="toggleProductStatus(product)">
            {{ product.status === '启用' ? '禁用' : '启用' }}
          </button>
        </div>
      </div>

      <div class="empty-state" v-if="filteredProducts.length === 0">
        <div class="empty-icon">
          <Icon name="package" :size="48" color="#FFB7C5" />
        </div>
        <p class="empty-text">暂无商品数据</p>
        <button class="empty-btn" @click="openAddProductForm">
          <Icon name="add" :size="16" />
          立即建档
        </button>
      </div>

      <!-- 展开更多按钮 -->
      <div class="load-more" v-if="hasMoreProducts">
        <button class="load-more-btn" @click="showMore">
          <Icon name="chevron-down" :size="16" />
          展开更多（还剩 {{ remainingCount }} 个）
        </button>
      </div>
    </div>

    <!-- 新增/编辑商品表单 -->
    <div class="product-form-overlay" v-if="showAddProductForm" @click.self="showAddProductForm = false">
      <div class="product-form">
        <div class="form-header">
          <h2>{{ editingProduct ? '编辑商品' : '新增商品' }}</h2>
          <button class="close-btn" @click="showAddProductForm = false">
            <Icon name="close" :size="20" />
          </button>
        </div>

        <div class="form-content">
          <!-- 录入模式切换（仅新增时显示） -->
          <div class="form-group" v-if="!editingProduct">
            <label class="form-label">录入模式</label>
            <div class="mode-toggle">
              <button 
                class="mode-btn" 
                :class="{ active: !isBatchMode }"
                @click="toggleBatchMode"
              >
                <Icon name="single" :size="14" />
                单件录入
              </button>
              <button 
                class="mode-btn" 
                :class="{ active: isBatchMode }"
                @click="toggleBatchMode"
              >
                <Icon name="batch" :size="14" />
                批量录入
              </button>
            </div>
          </div>

          <!-- 商品条码 -->
          <div class="form-group">
            <label class="form-label">商品条码</label>
            <div class="input-with-btn">
              <input 
                type="text" 
                class="form-input" 
                v-model="formData.barcode" 
                placeholder="扫码或手动输入"
                @input="formData.barcode = formData.barcode.replace(/\s/g, '')"
              />
              <button class="scan-btn" @click="handleScanBarcode">
                <Icon name="scan" :size="16" />
                扫码
              </button>
            </div>
            <p class="input-hint" v-if="isBatchMode">批量录入时条码会自动添加尺码后缀</p>
          </div>

          <!-- 自定义货号 -->
          <div class="form-group">
            <label class="form-label">自定义货号</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="formData.custom_code" 
              placeholder="输入自定义货号"
            />
            <p class="input-hint" v-if="!formData.barcode && formData.custom_code">已自动生成货号，可修改或清空</p>
            <p class="input-hint" v-if="isBatchMode">批量录入时货号会自动添加尺码后缀</p>
          </div>

          <!-- 商品名称 -->
          <div class="form-group">
            <label class="form-label">商品名称</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="formData.product_name" 
              placeholder="输入商品名称（可选）"
            />
            <p class="input-hint">如：红蜻蜓2024春季新款</p>
          </div>

          <!-- 品类 -->
          <div class="form-group">
            <label class="form-label">品类 <span class="required">*</span></label>
            <div class="category-input-group">
              <select 
                class="form-input category-select" 
                v-model="formData.style"
                @change="handleCategoryChange"
              >
                <option value="">请选择或输入品类</option>
                <option v-for="category in categoryPresets" :key="category" :value="category">
                  {{ category }}
                </option>
                <option value="__custom__">+ 自定义品类</option>
              </select>
              <input 
                v-if="formData.style === '__custom__'"
                type="text" 
                class="form-input category-custom" 
                v-model="customCategory"
                placeholder="输入新品类名称"
                @blur="applyCustomCategory"
              />
            </div>
            <div class="category-presets">
              <span 
                v-for="category in categoryPresets" 
                :key="category"
                class="category-tag"
                @click="formData.style = category"
              >
                {{ category }}
              </span>
            </div>
          </div>

          <!-- 款式分类 -->
          <div class="form-group">
            <label class="form-label">款式分类</label>
            <select class="form-input" v-model="formData.gender_type">
              <option value="">请选择款式分类</option>
              <option value="adult_male">成人男款</option>
              <option value="adult_female">成人女款</option>
              <option value="boy">男童</option>
              <option value="girl">女童</option>
              <option value="unisex">通用款</option>
            </select>
          </div>

          <!-- 颜色 -->
          <div class="form-group">
            <label class="form-label">颜色 <span class="required">*</span></label>
            <input 
              type="text" 
              class="form-input" 
              v-model="formData.color" 
              placeholder="输入商品颜色"
            />
          </div>

          <!-- 鞋码 - 单件录入模式 -->
          <div class="form-group" v-if="!isBatchMode">
            <label class="form-label">鞋码 <span class="required">*</span></label>
            <input 
              type="text" 
              class="form-input" 
              v-model="formData.size" 
              placeholder="输入单个鞋码，如：39"
            />
            <p class="input-hint">单件录入只能输入一个整数码数（22-45）</p>
          </div>

          <!-- 鞋码 - 批量录入模式 -->
          <div class="form-group" v-if="isBatchMode">
            <label class="form-label">鞋码范围 <span class="required">*</span></label>
            
            <!-- 常用预设 -->
            <div class="size-presets">
              <span class="preset-label">常用：</span>
              <button 
                v-for="preset in commonSizes" 
                :key="preset.value"
                class="preset-btn"
                @click="selectSizePreset(preset.value)"
              >
                {{ preset.label }}
              </button>
            </div>
            
            <!-- 尺码输入 -->
            <input 
              type="text" 
              class="form-input" 
              :class="{ error: sizeInputError }"
              v-model="batchSizeInput" 
              placeholder="输入尺码范围，如：39-42 或 36,38,40"
            />
            <p class="input-error" v-if="sizeInputError">{{ sizeInputError }}</p>
            <p class="input-hint">支持格式：39-42（连续范围）、36,38,40（逗号分隔）、35-37,39（混合）</p>
            
            <!-- 解析结果预览 -->
            <div class="size-preview" v-if="parsedSizes.length > 0">
              <div class="preview-header">
                <span>将创建 {{ parsedSizes.length }} 个商品：</span>
              </div>
              <div class="preview-tags">
                <span 
                  v-for="size in parsedSizes" 
                  :key="size"
                  class="size-tag"
                >
                  {{ formatSize(size) }}码
                </span>
              </div>
            </div>
          </div>

          <!-- 供应商 -->
          <div class="form-group">
            <label class="form-label">供应商 <span class="required">*</span></label>
            <input 
              type="text" 
              class="form-input" 
              v-model="formData.supplier" 
              placeholder="输入供应商名称"
            />
          </div>

          <!-- 进货单价 -->
          <div class="form-group">
            <label class="form-label">进货单价 <span class="required">*</span></label>
            <input 
              type="number" 
              class="form-input" 
              v-model.number="formData.purchase_price" 
              placeholder="输入进货单价"
              min="0"
              step="0.01"
            />
          </div>

          <!-- 销售单价 -->
          <div class="form-group">
            <label class="form-label">销售单价 <span class="required">*</span></label>
            <input 
              type="number" 
              class="form-input" 
              v-model.number="formData.sale_price" 
              placeholder="输入销售单价"
              min="0"
              step="0.01"
            />
            <p class="input-hint">默认按35%毛利率自动计算（售价=进价÷0.65），精确到个位数，可手动调整</p>
          </div>

          <!-- 库存预警值 -->
          <div class="form-group">
            <label class="form-label">库存预警值</label>
            <input 
              type="number" 
              class="form-input" 
              v-model.number="formData.stock_alert" 
              placeholder="输入库存预警值"
              min="0"
            />
          </div>

          <!-- 商品备注 -->
          <div class="form-group">
            <label class="form-label">商品备注</label>
            <textarea 
              class="form-textarea" 
              v-model="formData.remark" 
              placeholder="请输入备注信息"
              maxlength="100"
            ></textarea>
          </div>

          <!-- 商品状态 -->
          <div class="form-group">
            <label class="form-label">商品状态</label>
            <select class="form-select" v-model="formData.status">
              <option value="启用">启用</option>
              <option value="禁用">禁用</option>
            </select>
          </div>
        </div>

        <div class="form-actions">
          <button class="cancel-btn" @click="showAddProductForm = false">
            取消
          </button>
          <button 
            v-if="isBatchMode && !editingProduct" 
            class="submit-btn" 
            @click="createBatchProducts"
            :disabled="parsedSizes.length === 0"
          >
            批量创建 {{ parsedSizes.length > 0 ? `(${parsedSizes.length}个)` : '' }}
          </button>
          <button v-else class="submit-btn" @click="handleSubmit">
            {{ editingProduct ? '更新商品' : '保存商品' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Icon from '../components/Icons/Icon.vue'
import { parseBatchSizeInput, formatSize, COMMON_SIZES } from '../utils/sizeParser.js'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default {
  name: 'Product',
  components: {
    Icon
  },
  setup() {
    const router = useRouter()

    // 商品列表数据
    const products = ref([])
    const loading = ref(false)

    // 分页显示配置
    const initialCount = 4
    const expandStep = 10
    const displayCount = ref(initialCount)

    // 搜索关键词
    const searchKeyword = ref('')
    // 显示添加商品表单
    const showAddProductForm = ref(false)
    // 编辑中的商品
    const editingProduct = ref(null)
    // 表单数据
    const formData = reactive({
      barcode: '',
      custom_code: '',
      product_name: '',
      style: '',
      gender_type: '',
      color: '',
      size: '',
      supplier: '',
      purchase_price: 0,
      sale_price: 0,
      stock_alert: 10,
      remark: '',
      status: '启用'
    })

    // 批量录入模式
    const isBatchMode = ref(false)
    const batchSizeInput = ref('')
    const parsedSizes = ref([])
    const sizeInputError = ref('')
    const commonSizes = COMMON_SIZES

    // 品类预设
    const categoryPresets = [
      '运动鞋',
      '休闲鞋',
      '皮鞋',
      '板鞋',
      '高跟鞋',
      '凉鞋',
      '拖鞋',
      '靴子',
      '帆布鞋',
      '马丁靴'
    ]
    const customCategory = ref('')

    // 监听批量尺码输入
    watch(batchSizeInput, (newVal) => {
      if (!newVal) {
        parsedSizes.value = []
        sizeInputError.value = ''
        return
      }
      const result = parseBatchSizeInput(newVal)
      if (result.valid) {
        parsedSizes.value = result.sizes
        sizeInputError.value = ''
      } else {
        sizeInputError.value = result.error
        parsedSizes.value = []
      }
    })

    // 监听条码输入，有条码时清空自定义货号，条码清空后重新生成货号
    watch(() => formData.barcode, (newVal) => {
      if (newVal && newVal.trim()) {
        // 有条码时清空货号
        formData.custom_code = ''
      } else if (!newVal && !formData.custom_code) {
        // 条码清空且货号为空时，重新生成货号
        formData.custom_code = generateNextCustomCode()
      }
    })

    // 标记销售价是否被用户手动修改过
    const isSalePriceManuallySet = ref(false)

    // 监听进货价变化，自动计算销售价（按35%毛利率）
    // 毛利率 = (售价-进价)/售价 = 35% => 售价 = 进价 / (1-0.35) = 进价 / 0.65
    watch(() => formData.purchase_price, (newVal, oldVal) => {
      // 确保新值有效且与旧值不同（避免初始化时的重复触发）
      if (newVal !== oldVal) {
        const purchasePrice = Number(newVal)
        console.log('进货价变化:', purchasePrice, '手动设置:', isSalePriceManuallySet.value)
        // 只有当销售价未被手动设置时，才自动计算
        if (purchasePrice > 0 && !isSalePriceManuallySet.value) {
          const calculatedPrice = Math.round(purchasePrice / 0.65)
          console.log('计算售价:', calculatedPrice)
          formData.sale_price = calculatedPrice
        }
      }
    })

    // 监听销售价变化，标记为手动设置
    watch(() => formData.sale_price, (newVal, oldVal) => {
      // 如果销售价从0变为非0，认为是用户手动输入（不是自动计算的）
      if (oldVal === 0 && newVal > 0) {
        // 检查是否匹配自动计算的值
        const calculatedPrice = Math.round(Number(formData.purchase_price) / 0.65)
        if (newVal !== calculatedPrice) {
          isSalePriceManuallySet.value = true
          console.log('销售价被手动设置为:', newVal)
        }
      }
    })

    // 过滤后的商品列表
    const filteredProducts = computed(() => {
      if (!searchKeyword.value) {
        return products.value
      }
      const keyword = searchKeyword.value.toLowerCase()
      return products.value.filter(product => {
        return (
          product.barcode?.toLowerCase().includes(keyword) ||
          product.custom_code?.toLowerCase().includes(keyword) ||
          product.style?.toLowerCase().includes(keyword) ||
          product.color?.toLowerCase().includes(keyword)
        )
      })
    })

    // 实际显示的商品列表（分页）
    const displayedProducts = computed(() => {
      return filteredProducts.value.slice(0, displayCount.value)
    })

    // 是否还有更多商品
    const hasMoreProducts = computed(() => {
      return filteredProducts.value.length > displayCount.value
    })

    // 剩余未显示商品数量
    const remainingCount = computed(() => {
      return Math.max(0, filteredProducts.value.length - displayCount.value)
    })

    // 获取商品列表
    const fetchProducts = async () => {
      loading.value = true
      try {
        const response = await api.get('/products')
        if (response.data.status === 'success') {
          // 将后端数据映射到前端格式
          products.value = response.data.data.map(item => ({
            _id: item._id,
            barcode: item.barcode || '',
            custom_code: item.customCode || '',
            product_name: item.productName || '',
            style: item.name || '',
            gender_type: item.genderType || 'unisex',
            color: item.color || '',
            size: item.size || '',
            supplier: item.supplier || '',
            purchase_price: item.costPrice || 0,
            sale_price: item.price || 0,
            stock_alert: item.stockAlert || 10,
            remark: item.description || '',
            status: item.status || '启用',
            stock: item.stock || 0
          }))
        }
      } catch (error) {
        console.error('获取商品列表失败:', error)
        alert('获取商品列表失败: ' + (error.response?.data?.message || error.message))
      } finally {
        loading.value = false
      }
    }

    // 生成下一个自定义货号
    const generateNextCustomCode = () => {
      // 从现有商品中提取货号数字
      const codes = products.value
        .map(p => p.custom_code)
        .filter(code => code && /^SP\d+$/i.test(code))
        .map(code => parseInt(code.replace(/^SP/i, ''), 10))
      
      const maxCode = codes.length > 0 ? Math.max(...codes) : 0
      const nextCode = maxCode + 1
      return `SP${String(nextCode).padStart(3, '0')}`
    }

    // 创建商品
    const createProduct = async (productData, autoGenerateCode = true) => {
      try {
        // 如果没有条码且没有自定义货号，自动生成货号（仅在非批量模式下）
        let customCode = productData.custom_code
        if (autoGenerateCode && !productData.barcode && !customCode) {
          customCode = generateNextCustomCode()
        }

        // 如果没有条码但有货号，自动生成条码：货号-尺码
        let barcode = productData.barcode
        if (!barcode && customCode && productData.size) {
          barcode = `${customCode}-${formatSize(productData.size)}`
        }

        // 将前端数据映射到后端格式
        const backendData = {
          name: productData.style,
          productName: productData.product_name,
          category: productData.style, // 使用style作为category
          size: productData.size,
          color: productData.color,
          price: productData.sale_price,
          costPrice: productData.purchase_price,
          supplier: productData.supplier,
          barcode: barcode,
          customCode: customCode,
          description: productData.remark || '', // 只存储用户输入的备注
          stock: 0,
          stockAlert: productData.stock_alert || 10,
          status: productData.status || '启用',
          genderType: productData.gender_type || 'unisex'
        }

        const response = await api.post('/products', backendData)
        if (response.data.status === 'success') {
          return response.data.data
        }
        throw new Error(response.data.message)
      } catch (error) {
        console.error('创建商品失败:', error)
        throw error
      }
    }

    // 更新商品
    const updateProduct = async (id, productData) => {
      try {
        const backendData = {
          name: productData.style,
          productName: productData.product_name,
          category: productData.style,
          size: productData.size,
          color: productData.color,
          price: productData.sale_price,
          costPrice: productData.purchase_price,
          supplier: productData.supplier,
          barcode: productData.barcode,
          customCode: productData.custom_code,
          description: productData.remark || '', // 只存储用户输入的备注
          stockAlert: productData.stock_alert || 10,
          status: productData.status,
          genderType: productData.gender_type || 'unisex'
        }

        const response = await api.put(`/products/${id}`, backendData)
        if (response.data.status === 'success') {
          return response.data.data
        }
        throw new Error(response.data.message)
      } catch (error) {
        console.error('更新商品失败:', error)
        throw error
      }
    }

    // 搜索处理
    const handleSearch = () => {
      // 搜索逻辑在 computed 属性 filteredProducts 中实现
      // 重置显示数量
      displayCount.value = initialCount
    }

    // 展开更多商品
    const showMore = () => {
      displayCount.value += expandStep
    }

    // 扫码添加商品
    const handleScanBarcode = () => {
      router.push('/home/scan')
    }

    // 编辑商品
    const editProduct = (product) => {
      editingProduct.value = product
      Object.assign(formData, {
        barcode: product.barcode,
        custom_code: product.custom_code,
        product_name: product.product_name,
        style: product.style,
        gender_type: product.gender_type || 'unisex',
        color: product.color,
        size: product.size,
        supplier: product.supplier,
        purchase_price: product.purchase_price,
        sale_price: product.sale_price,
        stock_alert: product.stock_alert,
        remark: product.remark,
        status: product.status
      })
      showAddProductForm.value = true
    }

    // 切换商品状态
    const toggleProductStatus = async (product) => {
      try {
        const newStatus = product.status === '启用' ? '禁用' : '启用'
        const response = await api.patch(`/products/${product._id}/status`, {
          status: newStatus
        })
        if (response.data.status === 'success') {
          product.status = newStatus
          alert(`商品状态已${newStatus}`)
        }
      } catch (error) {
        console.error('切换商品状态失败:', error)
        alert('切换商品状态失败: ' + error.message)
      }
    }

    // 处理表单提交
    const handleSubmit = async () => {
      // 表单验证
      if (!formData.style) {
        alert('请选择商品品类')
        return
      }
      if (!formData.color) {
        alert('请选择商品颜色')
        return
      }
      if (!formData.size) {
        alert('请输入鞋码')
        return
      }
      // 单件录入时验证只能输入单个码数
      if (!isBatchMode.value) {
        // 检查是否包含范围符号
        if (formData.size.includes('-')) {
          alert('单件录入只能输入单个码数，不能输入范围（如35-39）')
          return
        }
        // 检查是否包含逗号（多个码数）
        if (formData.size.includes(',')) {
          alert('单件录入只能输入单个码数')
          return
        }
        // 检查是否为单个有效整数
        const sizeNum = parseInt(formData.size)
        if (isNaN(sizeNum) || sizeNum < 22 || sizeNum > 45) {
          alert('请输入有效的单码数（22-45之间的整数）')
          return
        }
      }
      if (!formData.supplier) {
        alert('请输入供应商')
        return
      }
      if (formData.purchase_price <= 0) {
        alert('进货单价必须大于0')
        return
      }
      if (formData.sale_price <= 0) {
        alert('销售单价必须大于0')
        return
      }

      try {
        if (editingProduct.value) {
          // 更新商品
          const updatedProduct = await updateProduct(editingProduct.value._id, formData)
          // 更新本地列表
          const index = products.value.findIndex(p => p._id === editingProduct.value._id)
          if (index !== -1) {
            products.value[index] = { ...formData, _id: editingProduct.value._id }
          }
          alert('商品更新成功')
        } else {
          // 新增商品
          const newProduct = await createProduct(formData)
          // 将后端返回的数据映射到前端格式并添加到列表
          const frontendProduct = {
            _id: newProduct._id,
            barcode: formData.barcode,
            custom_code: formData.custom_code,
            style: formData.style,
            color: formData.color,
            size: formData.size,
            supplier: formData.supplier,
            purchase_price: formData.purchase_price,
            sale_price: formData.sale_price,
            stock_alert: formData.stock_alert,
            remark: formData.remark,
            status: formData.status,
            stock: 0
          }
          products.value.unshift(frontendProduct)
          alert('商品创建成功')
        }

        // 重置表单
        resetForm()
        showAddProductForm.value = false
      } catch (error) {
        console.error('保存商品失败:', error)
        alert('保存商品失败: ' + (error.response?.data?.message || error.message))
      }
    }

    // 品类选择处理
    const handleCategoryChange = () => {
      if (formData.style !== '__custom__') {
        customCategory.value = ''
      }
    }

    // 应用自定义品类
    const applyCustomCategory = () => {
      if (customCategory.value.trim()) {
        formData.style = customCategory.value.trim()
        customCategory.value = ''
      }
    }

    // 重置表单
    const resetForm = () => {
      Object.assign(formData, {
        barcode: '',
        custom_code: '',
        product_name: '',
        style: '',
        gender_type: '',
        color: '',
        size: '',
        supplier: '',
        purchase_price: 0,
        sale_price: 0,
        stock_alert: 10,
        remark: '',
        status: '启用'
      })
      customCategory.value = ''
      editingProduct.value = null
      isBatchMode.value = false
      batchSizeInput.value = ''
      parsedSizes.value = []
      sizeInputError.value = ''
      isSalePriceManuallySet.value = false
    }

    // 打开添加商品表单
    const openAddProductForm = () => {
      resetForm()
      // 预生成自定义货号
      formData.custom_code = generateNextCustomCode()
      showAddProductForm.value = true
    }

    // 切换批量录入模式
    const toggleBatchMode = () => {
      isBatchMode.value = !isBatchMode.value
      if (!isBatchMode.value) {
        batchSizeInput.value = ''
        parsedSizes.value = []
        sizeInputError.value = ''
      }
    }

    // 选择常用尺码预设
    const selectSizePreset = (presetValue) => {
      batchSizeInput.value = presetValue
    }

    // 批量创建商品
    const createBatchProducts = async () => {
      if (!formData.style) {
        alert('请输入商品品类')
        return
      }
      if (!formData.color) {
        alert('请输入商品颜色')
        return
      }
      if (parsedSizes.value.length === 0) {
        alert('请输入有效的尺码范围')
        return
      }
      if (!formData.supplier) {
        alert('请输入供应商')
        return
      }
      if (formData.purchase_price <= 0) {
        alert('进货单价必须大于0')
        return
      }
      if (formData.sale_price <= 0) {
        alert('销售单价必须大于0')
        return
      }

      try {
        const createdProducts = []
        
        // 预生成基础货号（如果没有条码且没有自定义货号）
        let baseCustomCode = formData.custom_code
        if (!formData.barcode && !baseCustomCode) {
          baseCustomCode = generateNextCustomCode()
        }
        
        // 逐个创建商品
        for (let i = 0; i < parsedSizes.value.length; i++) {
          const size = parsedSizes.value[i]
          
          // 所有尺码使用相同货号
          let sizeCustomCode = baseCustomCode
          
          // 生成条码：货号-尺码（如果没有手动输入条码）
          const sizeBarcode = sizeCustomCode ? `${sizeCustomCode}-${formatSize(size)}` : ''
          
          const productData = {
            ...formData,
            size: formatSize(size),
            barcode: formData.barcode || sizeBarcode,
            custom_code: sizeCustomCode
          }
          const newProduct = await createProduct(productData, false)
          createdProducts.push({
            _id: newProduct._id,
            barcode: productData.barcode,
            custom_code: newProduct.customCode || productData.custom_code,
            product_name: productData.product_name,
            style: productData.style,
            color: productData.color,
            size: productData.size,
            supplier: productData.supplier,
            purchase_price: productData.purchase_price,
            sale_price: productData.sale_price,
            stock_alert: productData.stock_alert,
            remark: productData.remark,
            status: productData.status,
            stock: 0
          })
        }

        // 添加到列表
        products.value.unshift(...createdProducts)
        alert(`成功创建 ${createdProducts.length} 个商品`)
        resetForm()
        showAddProductForm.value = false
      } catch (error) {
        console.error('批量创建商品失败:', error)
        alert('批量创建商品失败: ' + (error.response?.data?.message || error.message))
      }
    }

    // 组件挂载时获取商品列表
    onMounted(() => {
      fetchProducts()
    })

    return {
      products,
      loading,
      searchKeyword,
      showAddProductForm,
      editingProduct,
      formData,
      filteredProducts,
      displayedProducts,
      hasMoreProducts,
      remainingCount,
      isBatchMode,
      batchSizeInput,
      parsedSizes,
      sizeInputError,
      commonSizes,
      categoryPresets,
      customCategory,
      handleSearch,
      showMore,
      handleScanBarcode,
      editProduct,
      toggleProductStatus,
      handleSubmit,
      toggleBatchMode,
      selectSizePreset,
      createBatchProducts,
      formatSize,
      openAddProductForm,
      handleCategoryChange,
      applyCustomCategory,
      formatGenderType
    }
  }
}

// 格式化款式分类显示
function formatGenderType(genderType) {
  const typeMap = {
    'adult_male': '男',
    'adult_female': '女',
    'boy': '童男',
    'girl': '童女',
    'unisex': '通用'
  }
  return typeMap[genderType] || ''
}
</script>

<style scoped>
.product-container {
  padding-bottom: 70px;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.search-bar {
  flex: 1;
  display: flex;
  gap: 8px;
  min-width: 200px;
}

.search-input {
  flex: 1;
  height: 44px;
  padding: 0 16px;
  border: 1px solid rgba(255, 183, 197, 0.3);
  border-radius: 22px;
  font-size: 14px;
  background: #FFFFFF;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #FFB7C5;
  box-shadow: 0 0 0 3px rgba(255, 183, 197, 0.2);
}

.search-btn {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
  border: none;
  border-radius: 22px;
  color: #FFFFFF;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.search-btn:hover {
  box-shadow: 0 4px 12px rgba(255, 183, 197, 0.4);
  transform: translateY(-2px);
}

.add-product-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-product-btn:hover {
  box-shadow: 0 4px 12px rgba(255, 183, 197, 0.4);
  transform: translateY(-2px);
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-item {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(255, 183, 197, 0.15);
  border: 1px solid rgba(255, 183, 197, 0.2);
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.product-item:hover {
  box-shadow: 0 4px 16px rgba(255, 183, 197, 0.25);
  transform: translateY(-2px);
}

.product-info {
  flex: 1;
  margin-bottom: 0;
}

.product-basic {
  margin-bottom: 8px;
}

.product-name {
  font-size: 16px;
  font-weight: 600;
  color: #4A4A4A;
  margin-bottom: 4px;
}

.product-name .product-name-text {
  display: block;
  color: #8B4513;
  font-weight: 700;
  margin-bottom: 2px;
}

.product-codes {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #888888;
}

.code-item {
  background: #FFFBF5;
  padding: 2px 8px;
  border-radius: 10px;
}

.product-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  font-size: 14px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
}

.detail-label {
  color: #888888;
}

.detail-value {
  font-weight: 500;
  color: #4A4A4A;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.status-badge.启用 {
  background: #C8F0E0;
  color: #52C41A;
}

.status-badge.禁用 {
  background: #FFE4E9;
  color: #FF6B6B;
}

.product-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.edit-btn {
  background: #FFFBF5;
  color: #FFB7C5;
  border: 1px solid rgba(255, 183, 197, 0.3);
}

.edit-btn:hover {
  background: #FFE4E9;
  border-color: #FFB7C5;
}

.delete-btn {
  background: #FFE4E9;
  color: #FF6B6B;
  border: 1px solid rgba(255, 107, 107, 0.3);
}

.delete-btn:hover {
  background: #FFD4D4;
  border-color: #FF6B6B;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(255, 183, 197, 0.15);
  border: 1px solid rgba(255, 183, 197, 0.2);
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #888888;
  margin-bottom: 20px;
}

.empty-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.empty-btn:hover {
  box-shadow: 0 4px 12px rgba(255, 183, 197, 0.4);
  transform: translateY(-2px);
}

/* 展开更多按钮样式 */
.load-more {
  display: flex;
  justify-content: center;
  padding: 16px;
  margin-top: 8px;
}

.load-more-btn {
  padding: 10px 24px;
  background: #FFFFFF;
  border: 1px solid rgba(255, 183, 197, 0.5);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  color: #FFB7C5;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.load-more-btn:hover {
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
  color: #FFFFFF;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(255, 183, 197, 0.4);
}

/* 表单样式 */
.product-form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.product-form {
  background: #FFFFFF;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 183, 197, 0.2);
}

.form-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #4A4A4A;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: #888888;
  cursor: pointer;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #FFFBF5;
  color: #FFB7C5;
}

.form-content {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

/* 品类输入样式 */
.category-input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.category-select {
  flex: 1;
  cursor: pointer;
}

.category-custom {
  flex: 1;
  border-color: #FFB7C5;
  background: #FFFBF5;
}

.category-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-tag {
  padding: 4px 12px;
  background: #FFFBF5;
  border: 1px solid rgba(255, 183, 197, 0.3);
  border-radius: 12px;
  font-size: 12px;
  color: #FFB7C5;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-tag:hover {
  background: #FFB7C5;
  color: #FFFFFF;
  border-color: #FFB7C5;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #4A4A4A;
  margin-bottom: 8px;
}

.required {
  color: #FF6B6B;
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border: 1px solid rgba(255, 183, 197, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: #FFFFFF;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #FFB7C5;
  box-shadow: 0 0 0 3px rgba(255, 183, 197, 0.2);
}

.input-with-btn {
  display: flex;
  gap: 8px;
}

.input-with-btn .form-input {
  flex: 1;
}

.scan-btn {
  padding: 0 16px;
  background: linear-gradient(135deg, #A8E6CF 0%, #A8D8EA 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.scan-btn:hover {
  box-shadow: 0 4px 12px rgba(168, 230, 207, 0.4);
  transform: translateY(-2px);
}

.form-select {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border: 1px solid rgba(255, 183, 197, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: #FFFFFF;
  cursor: pointer;
  transition: all 0.3s ease;
}

.form-select:focus {
  outline: none;
  border-color: #FFB7C5;
  box-shadow: 0 0 0 3px rgba(255, 183, 197, 0.2);
}

.form-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 183, 197, 0.3);
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  background: #FFFFFF;
  transition: all 0.3s ease;
}

.form-textarea:focus {
  outline: none;
  border-color: #FFB7C5;
  box-shadow: 0 0 0 3px rgba(255, 183, 197, 0.2);
}

.form-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid rgba(255, 183, 197, 0.2);
  justify-content: flex-end;
}

.cancel-btn {
  padding: 10px 20px;
  background: #FFFBF5;
  color: #888888;
  border: 1px solid rgba(255, 183, 197, 0.3);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #FFE4E9;
  color: #FFB7C5;
  border-color: #FFB7C5;
}

.submit-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  box-shadow: 0 4px 12px rgba(255, 183, 197, 0.4);
  transform: translateY(-2px);
}

.submit-btn:disabled {
  background: #CCCCCC;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 录入模式切换 */
.mode-toggle {
  display: flex;
  gap: 8px;
  background: #FFFBF5;
  padding: 4px;
  border-radius: 8px;
}

.mode-btn {
  flex: 1;
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #888888;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.mode-btn.active {
  background: #FFFFFF;
  color: #FFB7C5;
  box-shadow: 0 2px 8px rgba(255, 183, 197, 0.3);
}

/* 输入提示 */
.input-hint {
  font-size: 12px;
  color: #888888;
  margin-top: 4px;
}

.input-error {
  font-size: 12px;
  color: #FF6B6B;
  margin-top: 4px;
}

.form-input.error {
  border-color: #FF6B6B;
}

.form-input.error:focus {
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.2);
}

/* 尺码预设 */
.size-presets {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.preset-label {
  font-size: 12px;
  color: #888888;
}

.preset-btn {
  padding: 4px 10px;
  background: #FFFBF5;
  border: 1px solid rgba(255, 183, 197, 0.3);
  border-radius: 12px;
  font-size: 12px;
  color: #FFB7C5;
  cursor: pointer;
  transition: all 0.3s ease;
}

.preset-btn:hover {
  background: #FFB7C5;
  color: #FFFFFF;
  border-color: #FFB7C5;
}

/* 尺码预览 */
.size-preview {
  margin-top: 12px;
  padding: 12px;
  background: #FFFBF5;
  border-radius: 8px;
  border: 1px solid rgba(255, 183, 197, 0.3);
}

.preview-header {
  font-size: 13px;
  color: #4A4A4A;
  margin-bottom: 8px;
  font-weight: 500;
}

.preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.size-tag {
  padding: 4px 10px;
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
  color: #FFFFFF;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

/* 响应式适配 */
@media (max-width: 480px) {
  .product-header {
    flex-direction: column;
  }

  .search-bar {
    width: 100%;
  }

  .add-product-btn {
    width: 100%;
    justify-content: center;
  }

  .product-details {
    grid-template-columns: 1fr;
  }

  .product-actions {
    justify-content: stretch;
  }

  .action-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>

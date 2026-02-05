<template>
  <div class="inbound-container">
    <!-- 入库表单 -->
    <div class="inbound-form-section">
      <div class="form-header">
        <h2>商品入库</h2>
        <button class="flow-btn" @click="showInboundFlow = true">
          <Icon name="calendar" :size="14" />
          查看入库流水
        </button>
      </div>

      <!-- 商品检索 -->
      <div class="search-section">
        <div class="search-bar">
          <input 
            type="text" 
            class="search-input" 
            v-model="searchKeyword" 
            placeholder="扫码或输入条码/货号/品类"
            @input="handleSearch"
          />
          <button class="scan-btn" @click="handleScanBarcode">
            <Icon name="scan" :size="16" />
            扫码
          </button>
        </div>

        <!-- 搜索结果 -->
        <div class="search-results" v-if="searchResults.length > 0">
          <div 
            class="search-item" 
            v-for="product in searchResults" 
            :key="product._id"
            @click="selectProduct(product)"
          >
            <div class="item-info">
              <h4 class="item-name">
                <span v-if="product.product_name" class="product-name">{{ product.product_name }}</span>
                {{ formatGenderType(product.gender_type) }}·{{ product.style }} · {{ product.color }} · {{ product.size }}
              </h4>
              <div class="item-codes">
                <span class="code-item" v-if="product.barcode">条码: {{ product.barcode }}</span>
                <span class="code-item" v-if="product.custom_code">货号: {{ product.custom_code }}</span>
              </div>
              <div class="item-price">
                <span>进货价: ¥{{ product.purchase_price.toFixed(2) }}</span>
                <span>销售价: ¥{{ product.sale_price.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 批量入库表单 -->
      <div class="inbound-form" v-if="isBatchInbound && styleGroupProducts.length > 0">
        <div class="product-info-card batch-card">
          <h3 v-if="styleGroupProducts[0].product_name" class="product-name">{{ styleGroupProducts[0].product_name }}</h3>
          <h3 class="product-title">{{ styleGroupProducts[0].style }} · {{ styleGroupProducts[0].color }}</h3>
          <p class="batch-subtitle">批量入库模式 - 共 {{ styleGroupProducts.length }} 个尺码</p>
        </div>

        <!-- 尺码入库列表 -->
        <div class="batch-size-list">
          <div class="batch-size-item" v-for="product in styleGroupProducts" :key="product._id">
            <div class="size-info">
              <span class="size-label">{{ formatSize(product.size) }}码</span>
              <span class="stock-label">当前库存: {{ product.stock }}</span>
            </div>
            <div class="size-input-group">
              <div class="quantity-input small">
                <button class="quantity-btn" @click="updateBatchQuantity(product, -1)" :disabled="product.inboundQuantity <= 0">-</button>
                <input 
                  type="number" 
                  class="quantity-input-field" 
                  v-model.number="product.inboundQuantity" 
                  min="0"
                />
                <button class="quantity-btn" @click="updateBatchQuantity(product, 1)">+</button>
              </div>
              <input 
                type="number" 
                class="price-input" 
                v-model.number="product.inboundPrice" 
                step="0.01"
                min="0"
                placeholder="单价"
              />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">供应商</label>
          <input 
            type="text" 
            class="form-input" 
            v-model="batchFormData.supplier"
          />
        </div>

        <div class="form-group">
          <label class="form-label">入库备注</label>
          <textarea 
            class="form-textarea" 
            v-model="batchFormData.remark" 
            placeholder="请输入备注信息"
          ></textarea>
        </div>

        <!-- 总进价计算 -->
        <div class="total-price-section">
          <div class="batch-summary">
            <span>共 {{ batchTotalQuantity }} 双</span>
            <span>¥{{ batchTotalPrice.toFixed(2) }}</span>
          </div>
        </div>

        <div class="form-actions">
          <button class="clear-btn" @click="clearForm">
            清空表单
          </button>
          <button 
            class="confirm-btn" 
            @click="handleBatchInbound"
            :disabled="batchTotalQuantity === 0"
          >
            批量入库 ({{ batchTotalQuantity }}双)
          </button>
        </div>
      </div>

      <!-- 单件入库表单 -->
      <div class="inbound-form" v-else-if="selectedProduct">
        <div class="product-info-card">
          <h3 class="product-title">{{ selectedProduct.style }} · {{ selectedProduct.color }} · {{ selectedProduct.size }}</h3>
          <div class="product-details">
            <span v-if="selectedProduct.barcode">条码: {{ selectedProduct.barcode }}</span>
            <span v-if="selectedProduct.custom_code">货号: {{ selectedProduct.custom_code }}</span>
            <span>供应商: {{ selectedProduct.supplier }}</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">入库数量</label>
          <div class="quantity-input">
            <button class="quantity-btn" @click="decreaseQuantity" :disabled="formData.quantity <= 1">-</button>
            <input 
              type="number" 
              class="quantity-input-field" 
              v-model.number="formData.quantity" 
              min="1"
            />
            <button class="quantity-btn" @click="increaseQuantity">+</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">本次进货单价</label>
          <input 
            type="number" 
            class="form-input" 
            v-model.number="formData.purchase_price" 
            step="0.01"
            min="0"
          />
        </div>

        <div class="form-group">
          <label class="form-label">供应商</label>
          <input 
            type="text" 
            class="form-input" 
            v-model="formData.supplier"
          />
        </div>

        <div class="form-group">
          <label class="form-label">入库备注</label>
          <textarea 
            class="form-textarea" 
            v-model="formData.remark" 
            placeholder="请输入备注信息"
          ></textarea>
        </div>

        <!-- 总进价计算 -->
        <div class="total-price-section">
          <h4>本次入库总进价</h4>
          <p class="total-price">¥{{ totalPrice.toFixed(2) }}</p>
        </div>

        <div class="form-actions">
          <button class="clear-btn" @click="clearForm">
            清空表单
          </button>
          <button class="confirm-btn" @click="handleInbound">
            确认入库
          </button>
        </div>
      </div>

      <!-- 未选择商品提示 -->
      <div class="empty-state" v-else>
        <div class="empty-icon">
          <Icon name="package" :size="48" color="#FFB7C5" />
        </div>
        <p class="empty-text">请扫码或搜索商品</p>
        <p class="empty-subtext">扫描商品条码或输入关键词检索商品</p>
      </div>
    </div>

    <!-- 入库流水弹窗 -->
    <div class="flow-overlay" v-if="showInboundFlow" @click.self="showInboundFlow = false">
      <div class="flow-container">
        <div class="flow-header">
          <h2>入库流水</h2>
          <button class="close-btn" @click="showInboundFlow = false">
            <Icon name="close" :size="20" />
          </button>
        </div>

        <!-- 筛选条件 -->
        <div class="filter-section">
          <div class="filter-group">
            <label class="filter-label">时间范围</label>
            <select class="filter-select" v-model="flowFilters.timeRange">
              <option value="today">今日</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          <!-- 自定义时间范围选择器 -->
          <div class="filter-group" v-if="flowFilters.timeRange === 'custom'">
            <label class="filter-label">开始日期</label>
            <input
              type="date"
              class="filter-input"
              v-model="flowFilters.startDate"
            />
          </div>
          <div class="filter-group" v-if="flowFilters.timeRange === 'custom'">
            <label class="filter-label">结束日期</label>
            <input
              type="date"
              class="filter-input"
              v-model="flowFilters.endDate"
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">供应商</label>
            <select class="filter-select" v-model="flowFilters.supplier">
              <option value="">全部</option>
              <option v-for="supplier in suppliers" :key="supplier" :value="supplier">
                {{ supplier }}
              </option>
            </select>
          </div>
          <button class="filter-btn" @click="filterInboundFlow">
            <Icon name="filter" :size="12" />
            筛选
          </button>
        </div>

        <!-- 流水列表 -->
        <div class="flow-list">
          <div class="flow-item" v-for="flow in filteredInboundFlow" :key="flow._id">
            <div class="flow-header-info">
              <span class="flow-no">{{ flow.record_no }}</span>
              <span class="flow-time">{{ formatDate(flow.created_at) }}</span>
            </div>
            <div class="flow-product">
              {{ flow.product_info.style }} · {{ flow.product_info.color }} · {{ flow.product_info.size }}
            </div>
            <div class="flow-details">
              <span>数量: {{ flow.quantity }}双</span>
              <span>单价: ¥{{ flow.purchase_price.toFixed(2) }}</span>
              <span>总进价: ¥{{ flow.total_price.toFixed(2) }}</span>
            </div>
            <div class="flow-footer">
              <span class="flow-supplier">{{ flow.supplier }}</span>
              <span class="flow-operator">{{ flow.operator }}</span>
            </div>
            <div class="flow-remark" v-if="flow.remark">
              备注: {{ flow.remark }}
            </div>
          </div>

          <div class="empty-flow" v-if="filteredInboundFlow.length === 0">
            <div class="empty-icon">
              <Icon name="calendar" :size="32" color="#FFB7C5" />
            </div>
            <p>暂无入库流水</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, reactive, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Icon from '../components/Icons/Icon.vue'
import { formatSize } from '../utils/sizeParser.js'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default {
  name: 'Inbound',
  components: {
    Icon
  },
  setup() {
    const router = useRouter()

    // 商品列表数据
    const products = ref([])
    const loading = ref(false)

    // 入库流水数据
    const inboundFlow = ref([])

    // 搜索关键词
    const searchKeyword = ref('')
    // 搜索结果
    const searchResults = ref([])
    // 选中的商品
    const selectedProduct = ref(null)
    // 批量入库模式
    const isBatchInbound = ref(false)
    // 按款式分组的商品
    const styleGroupProducts = ref([])
    // 批量入库表单数据
    const batchFormData = reactive({
      supplier: '',
      remark: ''
    })
    // 入库表单数据
    const formData = reactive({
      quantity: 1,
      purchase_price: 0,
      supplier: '',
      remark: ''
    })
    // 显示入库流水
    const showInboundFlow = ref(false)
    // 入库流水筛选条件
    const flowFilters = reactive({
      timeRange: 'today',
      supplier: '',
      startDate: '',
      endDate: ''
    })
    // 供应商列表
    const suppliers = ref([])

    // 计算总进价
    const totalPrice = computed(() => {
      return formData.quantity * formData.purchase_price
    })

    // 筛选后的入库流水
    const filteredInboundFlow = computed(() => {
      let filtered = inboundFlow.value

      // 按供应商筛选
      if (flowFilters.supplier) {
        filtered = filtered.filter(flow => flow.supplier === flowFilters.supplier)
      }

      // 按时间范围筛选
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      // 本周起始日设为周一（中国习惯）
      const dayOfWeek = now.getDay() || 7 // 周日转为7
      const weekStart = new Date(todayStart)
      weekStart.setDate(weekStart.getDate() - dayOfWeek + 1)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      switch (flowFilters.timeRange) {
        case 'today':
          filtered = filtered.filter(flow => new Date(flow.created_at) >= todayStart)
          break
        case 'week':
          filtered = filtered.filter(flow => new Date(flow.created_at) >= weekStart)
          break
        case 'month':
          filtered = filtered.filter(flow => new Date(flow.created_at) >= monthStart)
          break
        case 'custom':
          // 自定义时间范围
          if (flowFilters.startDate) {
            const start = new Date(flowFilters.startDate)
            filtered = filtered.filter(flow => new Date(flow.created_at) >= start)
          }
          if (flowFilters.endDate) {
            const end = new Date(flowFilters.endDate)
            // 结束时间设为当天的23:59:59
            end.setHours(23, 59, 59, 999)
            filtered = filtered.filter(flow => new Date(flow.created_at) <= end)
          }
          break
      }

      // 按时间倒序排序
      return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    })

    // 按款式分组商品
    const groupProductsByStyle = (products) => {
      const groups = {}
      products.forEach(product => {
        const key = `${product.style}_${product.color}`
        if (!groups[key]) {
          groups[key] = {
            style: product.style,
            color: product.color,
            products: []
          }
        }
        groups[key].products.push(product)
      })
      // 按尺码排序
      Object.values(groups).forEach(group => {
        group.products.sort((a, b) => parseFloat(a.size) - parseFloat(b.size))
      })
      return Object.values(groups)
    }

    // 处理搜索
    const handleSearch = () => {
      if (!searchKeyword.value) {
        searchResults.value = []
        styleGroupProducts.value = []
        return
      }

      const keyword = searchKeyword.value.toLowerCase()
      const matched = products.value.filter(product => {
        return (
          product.barcode?.toLowerCase().includes(keyword) ||
          product.custom_code?.toLowerCase().includes(keyword) ||
          product.style?.toLowerCase().includes(keyword) ||
          product.color?.toLowerCase().includes(keyword)
        )
      })
      
      // 如果匹配到多个同款式商品，显示分组结果
      const groups = groupProductsByStyle(matched)
      if (groups.length === 1 && groups[0].products.length > 1) {
        // 同一款式多个尺码，进入批量入库模式
        isBatchInbound.value = true
        styleGroupProducts.value = groups[0].products.map(p => ({
          ...p,
          inboundQuantity: 0,
          inboundPrice: p.purchase_price
        }))
        batchFormData.supplier = groups[0].products[0].supplier
        searchResults.value = []
      } else {
        // 显示普通搜索结果
        isBatchInbound.value = false
        styleGroupProducts.value = []
        searchResults.value = matched
      }
    }

    // 处理扫码
    const handleScanBarcode = () => {
      router.push('/home/scan')
    }

    // 选择商品
    const selectProduct = (product) => {
      selectedProduct.value = product
      // 填充表单数据
      formData.quantity = 1
      formData.purchase_price = product.purchase_price
      formData.supplier = product.supplier
      formData.remark = ''
      // 清空搜索结果
      searchResults.value = []
      searchKeyword.value = ''
    }

    // 减少数量
    const decreaseQuantity = () => {
      if (formData.quantity > 1) {
        formData.quantity--
      }
    }

    // 增加数量
    const increaseQuantity = () => {
      formData.quantity++
    }

    // 清空表单
    const clearForm = () => {
      selectedProduct.value = null
      isBatchInbound.value = false
      styleGroupProducts.value = []
      formData.quantity = 1
      formData.purchase_price = 0
      formData.supplier = ''
      formData.remark = ''
      batchFormData.supplier = ''
      batchFormData.remark = ''
    }

    // 批量入库数量调整
    const updateBatchQuantity = (product, delta) => {
      const newQty = (product.inboundQuantity || 0) + delta
      product.inboundQuantity = Math.max(0, newQty)
    }

    // 计算批量入库总数
    const batchTotalQuantity = computed(() => {
      return styleGroupProducts.value.reduce((sum, p) => sum + (p.inboundQuantity || 0), 0)
    })

    const batchTotalPrice = computed(() => {
      return styleGroupProducts.value.reduce((sum, p) => sum + (p.inboundQuantity || 0) * (p.inboundPrice || 0), 0)
    })

    // 处理批量入库
    const handleBatchInbound = async () => {
      const itemsToInbound = styleGroupProducts.value.filter(p => p.inboundQuantity > 0)
      
      if (itemsToInbound.length === 0) {
        alert('请至少选择一个尺码并输入入库数量')
        return
      }

      try {
        let successCount = 0
        for (const item of itemsToInbound) {
          const response = await api.post('/inbound', {
            productId: item._id,
            quantity: item.inboundQuantity,
            supplier: batchFormData.supplier,
            totalCost: item.inboundQuantity * item.inboundPrice,
            notes: batchFormData.remark,
            operator: localStorage.getItem('username') || '未知用户'
          })

          if (response.data.status === 'success') {
            // 更新商品库存
            const productIndex = products.value.findIndex(p => p._id === item._id)
            if (productIndex !== -1) {
              products.value[productIndex].purchase_price = item.inboundPrice
              products.value[productIndex].stock = response.data.data.updatedStock
            }
            successCount++
          }
        }

        alert(`成功入库 ${successCount} 个商品`)
        clearForm()
        fetchInboundFlow()
      } catch (error) {
        console.error('批量入库失败:', error)
        alert('批量入库失败: ' + (error.response?.data?.message || error.message))
      }
    }

    // 处理入库
    const handleInbound = async () => {
      if (!selectedProduct.value) {
        alert('请先选择商品')
        return
      }

      if (formData.quantity <= 0) {
        alert('入库数量不可小于1')
        return
      }

      if (formData.purchase_price <= 0) {
        alert('进货单价必须大于0')
        return
      }

      try {
        // 调用后端API保存入库记录
        const response = await api.post('/inbound', {
          productId: selectedProduct.value._id,
          quantity: formData.quantity,
          supplier: formData.supplier,
          totalCost: totalPrice.value,
          notes: formData.remark,
          operator: localStorage.getItem('username') || '未知用户'
        })

        if (response.data.status === 'success') {
          // 更新商品的最新进价和库存
          const productIndex = products.value.findIndex(p => p._id === selectedProduct.value._id)
          if (productIndex !== -1) {
            products.value[productIndex].purchase_price = formData.purchase_price
            products.value[productIndex].stock = response.data.data.updatedStock
          }

          alert('入库成功')
          clearForm()
          // 刷新入库流水
          fetchInboundFlow()
        }
      } catch (error) {
        console.error('入库失败:', error)
        alert('入库失败: ' + (error.response?.data?.message || error.message))
      }
    }

    // 获取入库流水
    const fetchInboundFlow = async () => {
      try {
        const response = await api.get('/inbound')
        if (response.data.status === 'success') {
          // 将后端数据映射到前端格式
          inboundFlow.value = response.data.data.map(item => ({
            _id: item._id,
            record_no: item.batchNumber || `IN-${new Date(item.createdAt).toISOString().slice(0, 10).replace(/-/g, '')}-${String(item._id).slice(-3)}`,
            product_id: item.productId?._id || item.productId,
            barcode: '',
            custom_code: '',
            product_info: {
              style: item.productId?.name || '',
              color: item.productId?.color || '',
              size: item.productId?.size || ''
            },
            quantity: item.quantity,
            purchase_price: item.totalCost / item.quantity,
            total_price: item.totalCost,
            supplier: item.supplier,
            operator: item.operator || '未知用户',
            remark: item.notes || '',
            status: '有效',
            created_at: item.createdAt
          }))
        }
      } catch (error) {
        console.error('获取入库流水失败:', error)
      }
    }

    // 筛选入库流水
    const filterInboundFlow = () => {
      // 自定义时间范围验证
      if (flowFilters.timeRange === 'custom') {
        if (flowFilters.startDate && flowFilters.endDate) {
          const start = new Date(flowFilters.startDate)
          const end = new Date(flowFilters.endDate)
          if (start > end) {
            alert('开始时间不能晚于结束时间')
            return
          }
        }
      }
      // 筛选逻辑已在computed中实现，这里只触发重新计算
    }

    // 格式化日期
    const formatDate = (date) => {
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }

    // 获取商品列表
    const fetchProducts = async () => {
      loading.value = true
      try {
        const response = await api.get('/products')
        if (response.data.status === 'success') {
          // 将后端数据映射到前端格式
          products.value = response.data.data.map(item => {
            return {
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
              stock: item.stock || 0,
              remark: item.description || ''
            }
          })
          
          // 提取供应商列表
          const supplierSet = new Set(products.value.map(p => p.supplier).filter(Boolean))
          suppliers.value = Array.from(supplierSet)
        }
      } catch (error) {
        console.error('获取商品列表失败:', error)
        alert('获取商品列表失败: ' + (error.response?.data?.message || error.message))
      } finally {
        loading.value = false
      }
    }

    // 组件挂载时获取商品列表和入库流水
    onMounted(() => {
      fetchProducts()
      fetchInboundFlow()
    })

    // 组件激活时刷新数据（从其他页面返回时）
    onActivated(() => {
      fetchProducts()
    })

    return {
      searchKeyword,
      searchResults,
      selectedProduct,
      isBatchInbound,
      styleGroupProducts,
      batchFormData,
      formData,
      totalPrice,
      batchTotalQuantity,
      batchTotalPrice,
      showInboundFlow,
      flowFilters,
      suppliers,
      filteredInboundFlow,
      loading,
      handleSearch,
      handleScanBarcode,
      selectProduct,
      decreaseQuantity,
      increaseQuantity,
      clearForm,
      handleInbound,
      handleBatchInbound,
      updateBatchQuantity,
      filterInboundFlow,
      formatDate,
      fetchProducts,
      fetchInboundFlow,
      formatSize,
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
.inbound-container {
  padding-bottom: 70px;
}

.inbound-form-section {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(255, 183, 197, 0.15);
  border: 1px solid rgba(255, 183, 197, 0.2);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.form-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #4A4A4A;
}

.flow-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #A8D8EA 0%, #A8E6CF 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.flow-btn:hover {
  box-shadow: 0 4px 12px rgba(168, 216, 234, 0.4);
  transform: translateY(-2px);
}

.search-section {
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
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

.scan-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 16px;
  background: linear-gradient(135deg, #A8E6CF 0%, #A8D8EA 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.scan-btn:hover {
  box-shadow: 0 4px 12px rgba(168, 230, 207, 0.4);
  transform: translateY(-2px);
}

.search-results {
  border: 1px solid rgba(255, 183, 197, 0.3);
  border-radius: 12px;
  background: #FFFBF5;
  max-height: 200px;
  overflow-y: auto;
}

.search-item {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 183, 197, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-item:last-child {
  border-bottom: none;
}

.search-item:hover {
  background: #FFE4E9;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: #4A4A4A;
  margin-bottom: 4px;
}

.item-name .product-name {
  display: block;
  color: #8B4513;
  font-weight: 700;
  margin-bottom: 2px;
}

.item-codes {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #888888;
  margin-bottom: 4px;
}

.code-item {
  background: #FFFFFF;
  padding: 2px 6px;
  border-radius: 6px;
}

.item-price {
  font-size: 12px;
  color: #FFB7C5;
}

.inbound-form {
  margin-top: 20px;
}

.product-info-card {
  background: linear-gradient(135deg, #FFFBF5 0%, #FFE4E9 100%);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 183, 197, 0.3);
}

.product-name {
  font-size: 16px;
  font-weight: 700;
  color: #8B4513;
  margin-bottom: 4px;
}

.product-title {
  font-size: 16px;
  font-weight: 600;
  color: #4A4A4A;
  margin-bottom: 8px;
}

.product-details {
  font-size: 14px;
  color: #888888;
  line-height: 1.4;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #4A4A4A;
  margin-bottom: 8px;
}

.quantity-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-btn {
  width: 36px;
  height: 36px;
  background: #FFFBF5;
  border: 1px solid rgba(255, 183, 197, 0.3);
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #FFB7C5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.quantity-btn:hover:not(:disabled) {
  background: #FFB7C5;
  color: #FFFFFF;
}

.quantity-btn:disabled {
  background: #F5F5F5;
  color: #CCCCCC;
  cursor: not-allowed;
}

.quantity-input-field {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border: 1px solid rgba(255, 183, 197, 0.3);
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  background: #FFFFFF;
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

.total-price-section {
  background: linear-gradient(135deg, #C8F0E0 0%, #A8E6CF 100%);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  text-align: center;
}

.total-price-section h4 {
  font-size: 14px;
  color: #2E7D5A;
  margin-bottom: 8px;
}

.total-price {
  font-size: 24px;
  font-weight: 600;
  color: #2E7D5A;
}

.form-actions {
  display: flex;
  gap: 12px;
}

.clear-btn {
  flex: 1;
  height: 44px;
  background: #FFFBF5;
  color: #888888;
  border: 1px solid rgba(255, 183, 197, 0.3);
  border-radius: 22px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  background: #FFE4E9;
  color: #FFB7C5;
}

.confirm-btn {
  flex: 2;
  height: 44px;
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-btn:hover {
  box-shadow: 0 4px 12px rgba(255, 183, 197, 0.4);
  transform: translateY(-2px);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px dashed rgba(255, 183, 197, 0.3);
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #4A4A4A;
  margin-bottom: 8px;
  font-weight: 500;
}

.empty-subtext {
  font-size: 14px;
  color: #888888;
}

/* 批量入库样式 */
.batch-card {
  background: linear-gradient(135deg, #A8E6CF 0%, #A8D8EA 100%) !important;
}

.batch-subtitle {
  font-size: 13px;
  color: #4A4A4A;
  margin-top: 4px;
}

.batch-size-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 183, 197, 0.3);
  border-radius: 12px;
  padding: 12px;
  background: #FFFBF5;
}

.batch-size-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 183, 197, 0.2);
}

.batch-size-item:last-child {
  border-bottom: none;
}

.size-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.size-label {
  font-size: 14px;
  font-weight: 600;
  color: #4A4A4A;
}

.stock-label {
  font-size: 12px;
  color: #888888;
}

.size-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-input.small {
  width: 120px;
}

.quantity-input.small .quantity-input-field {
  width: 50px;
  height: 32px;
}

.quantity-input.small .quantity-btn {
  width: 28px;
  height: 28px;
}

.price-input {
  width: 80px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid rgba(255, 183, 197, 0.3);
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
}

.price-input:focus {
  outline: none;
  border-color: #FFB7C5;
}

.batch-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #2E7D5A;
}

.confirm-btn:disabled {
  background: #CCCCCC;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 入库流水弹窗 */
.flow-overlay {
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

.flow-container {
  background: #FFFFFF;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 183, 197, 0.2);
}

.flow-header h2 {
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

.filter-section {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 183, 197, 0.2);
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group {
  flex: 1;
  min-width: 120px;
}

.filter-label {
  display: block;
  font-size: 12px;
  color: #888888;
  margin-bottom: 4px;
}

.filter-select {
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border: 1px solid rgba(255, 183, 197, 0.3);
  border-radius: 6px;
  font-size: 12px;
  background: #FFFFFF;
  transition: all 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #FFB7C5;
}

.filter-input {
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border: 1px solid rgba(255, 183, 197, 0.3);
  border-radius: 6px;
  font-size: 12px;
  background: #FFFFFF;
  transition: all 0.3s ease;
}

.filter-input:focus {
  outline: none;
  border-color: #FFB7C5;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 16px;
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  align-self: flex-end;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  box-shadow: 0 4px 12px rgba(255, 183, 197, 0.4);
}

.flow-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.flow-item {
  background: linear-gradient(135deg, #FFFBF5 0%, #FFFFFF 100%);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border-left: 4px solid #FFB7C5;
  box-shadow: 0 2px 8px rgba(255, 183, 197, 0.1);
}

.flow-header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.flow-no {
  font-size: 12px;
  font-weight: 500;
  color: #FFB7C5;
}

.flow-time {
  font-size: 12px;
  color: #888888;
}

.flow-product {
  font-size: 14px;
  font-weight: 500;
  color: #4A4A4A;
  margin-bottom: 8px;
}

.flow-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #888888;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.flow-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888888;
}

.flow-remark {
  font-size: 12px;
  color: #888888;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 183, 197, 0.2);
}

.empty-flow {
  text-align: center;
  padding: 40px 20px;
  color: #888888;
}

.empty-flow .empty-icon {
  margin-bottom: 8px;
}

/* 响应式适配 */
@media (max-width: 480px) {
  .form-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .flow-btn {
    justify-content: center;
  }

  .filter-section {
    flex-direction: column;
  }

  .filter-group {
    min-width: unset;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>

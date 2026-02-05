<template>
  <div class="sales-container">
    <!-- 销售表单 -->
    <div class="sales-form-section">
      <div class="form-header">
        <h2>商品销售</h2>
        <button class="flow-btn" @click="showSalesFlow = true">
          <Icon name="calendar" :size="14" />
          查看销售流水
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
              <h4 class="item-name">{{ formatGenderType(product.gender_type) }}·{{ product.style }} · {{ product.color }} · {{ product.size }}</h4>
              <div class="item-codes">
                <span class="code-item" v-if="product.barcode">条码: {{ product.barcode }}</span>
                <span class="code-item" v-if="product.custom_code">货号: {{ product.custom_code }}</span>
              </div>
              <div class="item-price">
                <span>进货价: ¥{{ product.purchase_price.toFixed(2) }}</span>
                <span>销售价: ¥{{ product.sale_price.toFixed(2) }}</span>
                <span>库存: {{ getProductStock(product._id) }}双</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 款式分组结果 -->
        <div class="style-group-results" v-if="showStyleGroup && styleGroupProducts.length > 0">
          <div class="style-group-header">
            <h4>
              <span v-if="styleGroupProducts[0].product_name" class="product-name">{{ styleGroupProducts[0].product_name }} · </span>
              {{ styleGroupProducts[0].style }} · {{ styleGroupProducts[0].color }}
            </h4>
            <span class="style-count">共 {{ styleGroupProducts.length }} 个尺码</span>
          </div>
          <div class="style-size-list">
            <div 
              v-for="product in styleGroupProducts" 
              :key="product._id"
              class="size-option"
              :class="{ 'out-of-stock': getProductStock(product._id) === 0 }"
              @click="getProductStock(product._id) > 0 && selectProduct(product)"
            >
              <span class="size-text">{{ formatSize(product.size) }}码</span>
              <span class="size-stock" :class="{ 'low': getProductStock(product._id) <= 3 }">
                库存: {{ getProductStock(product._id) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 销售表单 -->
      <div class="sales-form" v-if="selectedProduct">
        <div class="product-info-card">
          <h3 class="product-title">{{ selectedProduct.style }} · {{ selectedProduct.color }} · {{ selectedProduct.size }}</h3>
          <div class="product-details">
            <span v-if="selectedProduct.barcode">条码: {{ selectedProduct.barcode }}</span>
            <span v-if="selectedProduct.custom_code">货号: {{ selectedProduct.custom_code }}</span>
            <span>库存: {{ getProductStock(selectedProduct._id) }}双</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">销售数量</label>
          <div class="quantity-input">
            <button class="quantity-btn" @click="decreaseQuantity" :disabled="formData.quantity <= 1">-</button>
            <input 
              type="number" 
              class="quantity-input-field" 
              v-model.number="formData.quantity" 
              min="1"
              :max="getProductStock(selectedProduct._id)"
            />
            <button class="quantity-btn" @click="increaseQuantity" :disabled="formData.quantity >= getProductStock(selectedProduct._id)">+</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">实际销售单价</label>
          <input 
            type="number" 
            class="form-input" 
            v-model.number="formData.sale_price" 
            step="0.01"
            min="0"
          />
        </div>

        <div class="form-group">
          <label class="form-label">收款方式</label>
          <select class="form-select" v-model="formData.payment_method">
            <option value="微信">微信</option>
            <option value="支付宝">支付宝</option>
            <option value="现金">现金</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">销售备注</label>
          <textarea 
            class="form-textarea" 
            v-model="formData.remark" 
            placeholder="请输入备注信息"
          ></textarea>
        </div>

        <!-- 毛利计算 -->
        <div class="profit-section">
          <h4>本次销售毛利</h4>
          <p class="profit">¥{{ profit.toFixed(2) }}</p>
        </div>

        <div class="form-actions">
          <button class="clear-btn" @click="clearForm">
            清空表单
          </button>
          <button class="confirm-btn" @click="handleSales">
            确认卖出
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

    <!-- 销售流水弹窗 -->
    <div class="flow-overlay" v-if="showSalesFlow" @click.self="showSalesFlow = false">
      <div class="flow-container">
        <div class="flow-header">
          <h2>销售流水</h2>
          <div class="flow-header-actions">
            <button class="export-btn" @click="exportSales">
              <Icon name="export" :size="14" />
              导出数据
            </button>
            <button class="close-btn" @click="showSalesFlow = false">
              <Icon name="close" :size="20" />
            </button>
          </div>
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
            <label class="filter-label">收款方式</label>
            <select class="filter-select" v-model="flowFilters.paymentMethod">
              <option value="">全部</option>
              <option value="微信">微信</option>
              <option value="支付宝">支付宝</option>
              <option value="现金">现金</option>
            </select>
          </div>
          <button class="filter-btn" @click="filterSalesFlow">
            <Icon name="filter" :size="12" />
            筛选
          </button>
        </div>

        <!-- 流水列表 -->
        <div class="flow-list">
          <div class="flow-item" v-for="flow in filteredSalesFlow" :key="flow._id">
            <div class="flow-header-info">
              <span class="flow-no">{{ flow.record_no }}</span>
              <span class="flow-time">{{ formatDate(flow.created_at) }}</span>
            </div>
            <div class="flow-product">
              {{ flow.product_info.style }} · {{ flow.product_info.color }} · {{ flow.product_info.size }}
            </div>
            <div class="flow-details">
              <span>数量: {{ flow.quantity }}双</span>
              <span>单价: ¥{{ flow.sale_price.toFixed(2) }}</span>
              <span>总销售额: ¥{{ flow.total_sale.toFixed(2) }}</span>
            </div>
            <div class="flow-profit">
              <span>毛利: ¥{{ flow.total_profit.toFixed(2) }}</span>
              <span>收款方式: {{ flow.payment_method }}</span>
            </div>
            <div class="flow-footer">
              <span class="flow-operator">{{ flow.operator }}</span>
            </div>
            <div class="flow-remark" v-if="flow.remark">
              备注: {{ flow.remark }}
            </div>
          </div>

          <div class="empty-flow" v-if="filteredSalesFlow.length === 0">
            <div class="empty-icon">
              <Icon name="calendar" :size="32" color="#FFB7C5" />
            </div>
            <p>暂无销售流水</p>
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
  name: 'Sales',
  components: {
    Icon
  },
  setup() {
    const router = useRouter()

    // 商品列表数据
    const products = ref([])

    // 库存数据
    const inventory = ref({})

    // 销售流水数据
    const salesFlow = ref([])

    // 搜索关键词
    const searchKeyword = ref('')
    // 搜索结果
    const searchResults = ref([])
    // 选中的商品
    const selectedProduct = ref(null)
    // 款式分组显示模式
    const showStyleGroup = ref(false)
    // 按款式分组的商品
    const styleGroupProducts = ref([])

    // 获取系统默认收款方式
    const getDefaultPaymentMethod = () => {
      const savedSettings = localStorage.getItem('settings')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        return settings.defaultPaymentMethod || '微信'
      }
      return '微信'
    }

    // 销售表单数据
    const formData = reactive({
      quantity: 1,
      sale_price: 0,
      payment_method: getDefaultPaymentMethod(),
      remark: ''
    })
    // 显示销售流水
    const showSalesFlow = ref(false)
    // 销售流水筛选条件
    const flowFilters = reactive({
      timeRange: 'today',
      paymentMethod: '',
      startDate: '',
      endDate: ''
    })

    // 计算毛利
    const profit = computed(() => {
      if (!selectedProduct.value) return 0
      const cost = selectedProduct.value.purchase_price * formData.quantity
      const revenue = formData.sale_price * formData.quantity
      return revenue - cost
    })

    // 筛选后的销售流水
    const filteredSalesFlow = computed(() => {
      let filtered = salesFlow.value

      // 按收款方式筛选
      if (flowFilters.paymentMethod) {
        filtered = filtered.filter(flow => flow.payment_method === flowFilters.paymentMethod)
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

    // 获取商品库存
    const getProductStock = (productId) => {
      return inventory.value[productId] || 0
    }

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
        showStyleGroup.value = false
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
        // 同一款式多个尺码，显示款式分组
        showStyleGroup.value = true
        styleGroupProducts.value = groups[0].products
        searchResults.value = []
      } else {
        // 显示普通搜索结果
        showStyleGroup.value = false
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
      formData.sale_price = product.sale_price
      // 使用系统默认收款方式或保持当前选择
      formData.payment_method = formData.payment_method || getDefaultPaymentMethod()
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
      if (selectedProduct.value) {
        const stock = getProductStock(selectedProduct.value._id)
        if (formData.quantity < stock) {
          formData.quantity++
        }
      }
    }

    // 清空表单
    const clearForm = () => {
      selectedProduct.value = null
      showStyleGroup.value = false
      styleGroupProducts.value = []
      formData.quantity = 1
      formData.sale_price = 0
      formData.payment_method = getDefaultPaymentMethod()
      formData.remark = ''
    }

    // 处理销售
    const handleSales = async () => {
      if (!selectedProduct.value) {
        alert('请先选择商品')
        return
      }

      const stock = getProductStock(selectedProduct.value._id)
      if (formData.quantity <= 0) {
        alert('销售数量不可小于1')
        return
      }

      if (formData.quantity > stock) {
        alert('库存不足，当前库存为' + stock + '双')
        formData.quantity = stock
        return
      }

      if (formData.sale_price <= 0) {
        alert('销售单价必须大于0')
        return
      }

      try {
        // 调用后端API保存销售记录
        const totalSale = formData.quantity * formData.sale_price
        const response = await api.post('/sales', {
          productId: selectedProduct.value._id,
          quantity: formData.quantity,
          unitPrice: formData.sale_price,
          totalAmount: totalSale,
          paymentMethod: formData.payment_method,
          notes: formData.remark,
          operator: localStorage.getItem('username') || '未知用户'
        })

        if (response.data.status === 'success') {
          // 扣减库存
          inventory.value[selectedProduct.value._id] = response.data.data.updatedStock

          alert('销售成功')
          clearForm()
          // 刷新销售流水
          fetchSalesFlow()
        }
      } catch (error) {
        console.error('销售失败:', error)
        alert('销售失败: ' + (error.response?.data?.message || error.message))
      }
    }

    // 获取销售流水
    const fetchSalesFlow = async () => {
      try {
        const response = await api.get('/sales')
        if (response.data.status === 'success') {
          // 将后端数据映射到前端格式
          salesFlow.value = response.data.data.map(item => {
            const totalProfit = (item.unitPrice - (item.productId?.costPrice || 0)) * item.quantity
            return {
              _id: item._id,
              record_no: `SL-${new Date(item.createdAt).toISOString().slice(0, 10).replace(/-/g, '')}-${String(item._id).slice(-3)}`,
              product_id: item.productId?._id || item.productId,
              barcode: '',
              custom_code: '',
              product_info: {
                style: item.productId?.name || '',
                color: item.productId?.color || '',
                size: item.productId?.size || ''
              },
              quantity: item.quantity,
              sale_price: item.unitPrice,
              total_sale: item.totalAmount,
              purchase_price: item.productId?.costPrice || 0,
              total_profit: totalProfit,
              payment_method: item.paymentMethod,
              operator: item.operator || '未知用户',
              remark: item.notes || '',
              status: '有效',
              created_at: item.createdAt
            }
          })
        }
      } catch (error) {
        console.error('获取销售流水失败:', error)
      }
    }

    // 获取商品列表
    const fetchProducts = async () => {
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

          // 更新库存数据
          products.value.forEach(p => {
            inventory.value[p._id] = p.stock
          })
        }
      } catch (error) {
        console.error('获取商品列表失败:', error)
      }
    }

    // 组件挂载时获取数据
    onMounted(() => {
      fetchProducts()
      fetchSalesFlow()
    })

    // 组件激活时刷新数据（从其他页面返回时）
    onActivated(() => {
      fetchProducts()
    })

    // 筛选销售流水
    const filterSalesFlow = () => {
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

    // 导出销售数据
    const exportSales = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/export/sales', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('导出失败')
        }

        // 获取文件名
        const contentDisposition = response.headers.get('content-disposition')
        let filename = '销售数据.csv'
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="(.+)"/)
          if (match) {
            filename = match[1]
          }
        }

        // 下载文件
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        alert('销售数据导出成功')
      } catch (error) {
        console.error('导出销售数据失败:', error)
        alert('导出销售数据失败: ' + error.message)
      }
    }

    // 格式化日期
    const formatDate = (date) => {
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }

    return {
      searchKeyword,
      searchResults,
      selectedProduct,
      showStyleGroup,
      styleGroupProducts,
      formData,
      profit,
      showSalesFlow,
      flowFilters,
      filteredSalesFlow,
      getProductStock,
      handleSearch,
      handleScanBarcode,
      selectProduct,
      decreaseQuantity,
      increaseQuantity,
      clearForm,
      handleSales,
      filterSalesFlow,
      exportSales,
      formatDate,
      fetchProducts,
      fetchSalesFlow,
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
.sales-container {
  padding-bottom: 70px;
}

.sales-form-section {
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

/* 款式分组结果样式 */
.style-group-results {
  border: 1px solid rgba(255, 183, 197, 0.3);
  border-radius: 12px;
  background: #FFFBF5;
  overflow: hidden;
}

.style-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
  color: #FFFFFF;
}

.style-group-header h4 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}

.style-group-header .product-name {
  font-weight: 700;
}

.style-count {
  font-size: 12px;
  opacity: 0.9;
}

.style-size-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  padding: 12px;
  max-height: 250px;
  overflow-y: auto;
}

.size-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 8px;
  background: #FFFFFF;
  border: 2px solid rgba(255, 183, 197, 0.3);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.size-option:hover:not(.out-of-stock) {
  border-color: #FFB7C5;
  background: #FFE4E9;
  transform: translateY(-2px);
}

.size-option.out-of-stock {
  opacity: 0.5;
  cursor: not-allowed;
  background: #F5F5F5;
}

.size-text {
  font-size: 14px;
  font-weight: 600;
  color: #4A4A4A;
  margin-bottom: 4px;
}

.size-stock {
  font-size: 11px;
  color: #888888;
}

.size-stock.low {
  color: #FF6B6B;
  font-weight: 500;
}

.sales-form {
  margin-top: 20px;
}

.product-info-card {
  background: linear-gradient(135deg, #FFFBF5 0%, #FFE4E9 100%);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 183, 197, 0.3);
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

.profit-section {
  background: linear-gradient(135deg, #C8F0E0 0%, #A8E6CF 100%);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  text-align: center;
}

.profit-section h4 {
  font-size: 14px;
  color: #2E7D5A;
  margin-bottom: 8px;
}

.profit {
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

/* 销售流水弹窗 */
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

.flow-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #A8E6CF 0%, #A8D8EA 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.export-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
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

.flow-profit {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #888888;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.flow-footer {
  display: flex;
  justify-content: flex-end;
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

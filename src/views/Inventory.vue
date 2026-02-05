<template>
  <div class="inventory-container">
    <!-- 库存管理头部 -->
    <div class="inventory-header">
      <div class="header-actions">
        <button class="scan-btn" @click="handleScanBarcode">
          <Icon name="scan" size="16" />
          <span>扫码查库存</span>
        </button>
        <div class="export-section">
          <select v-model="exportTimeRange" class="time-range-select">
            <option value="today">今日</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="year">本年</option>
            <option value="all">全部</option>
          </select>
          <button class="export-btn" @click="exportInventory">
            <Icon name="export" size="16" />
            <span>导出数据</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 库存概览 -->
    <div class="inventory-overview">
      <div class="overview-card total">
        <div class="card-icon">
          <Icon name="product" size="24" />
        </div>
        <div class="card-content">
          <h3>商品总数</h3>
          <p class="card-value">{{ totalProducts }}</p>
        </div>
      </div>
      <div class="overview-card low">
        <div class="card-icon">
          <Icon name="warning" size="24" />
        </div>
        <div class="card-content">
          <h3>预警商品</h3>
          <p class="card-value">{{ lowStockProducts }}</p>
        </div>
      </div>
      <div class="overview-card zero">
        <div class="card-icon">
          <Icon name="error" size="24" />
        </div>
        <div class="card-content">
          <h3>缺货商品</h3>
          <p class="card-value">{{ zeroStockProducts }}</p>
        </div>
      </div>
    </div>

    <!-- 功能切换 -->
    <div class="tab-section">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'all' }"
        @click="activeTab = 'all'"
      >
        全部库存
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'low' }"
        @click="activeTab = 'low'"
      >
        预警/缺货
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'history' }"
        @click="activeTab = 'history'"
      >
        库存变动
      </button>
    </div>

    <!-- 全部库存 -->
    <div class="inventory-list" v-if="activeTab === 'all'">
      <div class="search-bar">
        <input 
          type="text" 
          class="search-input" 
          v-model="searchKeyword" 
          placeholder="搜索商品..."
          @input="handleSearch"
        />
      </div>

      <div class="inventory-items">
        <div 
          class="inventory-item" 
          v-for="product in displayedProducts" 
          :key="product._id"
          :class="{
            'low-stock': getProductStock(product._id) < product.stock_alert && getProductStock(product._id) > 0,
            'zero-stock': getProductStock(product._id) === 0
          }"
          @click="showProductDetail(product)"
        >
          <div class="item-header">
            <h4 class="item-name">
              <span v-if="product.product_name" class="product-name">{{ product.product_name }}</span>
              {{ formatGenderType(product.gender_type) }}·{{ product.style }} · {{ product.color }} · {{ product.size }}
            </h4>
            <span class="stock-status" :class="getStockStatusClass(product._id)">
              {{ getStockStatusText(product._id, product.stock_alert) }}
            </span>
          </div>
          <div class="item-codes">
            <span class="code-item" v-if="product.barcode">条码: {{ product.barcode }}</span>
            <span class="code-item" v-if="product.custom_code">货号: {{ product.custom_code }}</span>
          </div>
          <div class="item-stock">
            <div class="stock-info">
              <span>当前库存: </span>
              <span class="stock-value">{{ getProductStock(product._id) }}双</span>
            </div>
            <div class="alert-info">
              <span>预警值: </span>
              <span>{{ product.stock_alert }}双</span>
            </div>
          </div>
          <div class="item-price">
            <span>进货价: ¥{{ product.purchase_price.toFixed(2) }}</span>
            <span>销售价: ¥{{ product.sale_price.toFixed(2) }}</span>
          </div>
        </div>

        <div class="empty-state" v-if="filteredProducts.length === 0">
          <div class="empty-icon">📦</div>
          <p>暂无商品库存数据</p>
        </div>

        <!-- 展开更多按钮 -->
        <div class="load-more" v-if="hasMoreProducts">
          <button class="load-more-btn" @click="showMore">
            <Icon name="chevron-down" :size="16" />
            展开更多（还剩 {{ remainingCount }} 个）
          </button>
        </div>
      </div>
    </div>

    <!-- 预警/缺货 -->
    <div class="low-stock-section" v-if="activeTab === 'low'">
      <div class="section-header">
        <h3>补货清单</h3>
        <button class="generate-btn" @click="generateReplenishList">
          生成补货单
        </button>
      </div>

      <div class="replenish-list">
        <div
          class="replenish-item"
          v-for="product in displayedLowStock"
          :key="product._id"
          :class="{
            'zero-stock': getProductStock(product._id) === 0
          }"
        >
          <div class="product-info">
            <h4 class="product-name">
              <span v-if="product.product_name" class="product-name-highlight">{{ product.product_name }}</span>
              {{ formatGenderType(product.gender_type) }}·{{ product.style }} · {{ product.color }} · {{ product.size }}
            </h4>
            <div class="product-codes">
              <span v-if="product.barcode">条码: {{ product.barcode }}</span>
              <span v-if="product.custom_code">货号: {{ product.custom_code }}</span>
            </div>
          </div>
          <div class="stock-info">
            <div class="current-stock">
              <span>当前库存: </span>
              <span class="stock-value">{{ getProductStock(product._id) }}双</span>
            </div>
            <div class="alert-stock">
              <span>预警值: </span>
              <span>{{ product.stock_alert }}双</span>
            </div>
          </div>
          <div class="replenish-input">
            <label>建议补货量:</label>
            <input 
              type="number" 
              class="replenish-qty" 
              v-model.number="replenishQuantities[product._id]"
              min="1"
              @input="updateReplenishTotal"
            />
          </div>
        </div>

        <div class="empty-state" v-if="lowStockList.length === 0">
          <div class="empty-icon">✅</div>
          <p>当前无预警商品</p>
          <p class="empty-subtext">所有商品库存充足</p>
        </div>

        <!-- 展开更多按钮 -->
        <div class="load-more" v-if="hasMoreLowStock">
          <button class="load-more-btn" @click="showMoreLow">
            <Icon name="chevron-down" :size="16" />
            展开更多（还剩 {{ remainingLowCount }} 个）
          </button>
        </div>
      </div>

      <!-- 补货汇总 -->
      <div class="replenish-summary" v-if="lowStockList.length > 0">
        <div class="summary-item">
          <span>需补货商品:</span>
          <span class="summary-value">{{ lowStockList.length }}个</span>
        </div>
        <div class="summary-item">
          <span>建议补货总量:</span>
          <span class="summary-value">{{ totalReplenishQty }}双</span>
        </div>
        <div class="summary-item">
          <span>预计采购金额:</span>
          <span class="summary-value">¥{{ totalReplenishAmount.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- 库存变动 -->
    <div class="stock-history-section" v-if="activeTab === 'history'">
      <div class="filter-section">
        <div class="filter-group">
          <label>时间范围</label>
          <select class="filter-select" v-model="historyFilters.timeRange">
            <option value="today">今日</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="all">全部</option>
          </select>
        </div>
        <div class="filter-group">
          <label>变动类型</label>
          <select class="filter-select" v-model="historyFilters.type">
            <option value="">全部</option>
            <option value="inbound">入库</option>
            <option value="sales">销售</option>
          </select>
        </div>
        <button class="filter-btn" @click="filterHistory">
          筛选
        </button>
      </div>

      <div class="history-list">
        <div 
          class="history-item" 
          v-for="record in filteredHistory" 
          :key="record._id"
          :class="{
            'inbound': record.type === 'inbound',
            'sales': record.type === 'sales'
          }"
        >
          <div class="history-header">
            <span class="record-type" :class="record.type">
              {{ record.type === 'inbound' ? '入库' : '销售' }}
            </span>
            <span class="record-time">{{ formatDate(record.created_at) }}</span>
          </div>
          <div class="history-product">
            {{ record.product_info.style }} · {{ record.product_info.color }} · {{ record.product_info.size }}
          </div>
          <div class="history-details">
            <span>数量: {{ record.quantity }}双</span>
            <span v-if="record.type === 'inbound'">单价: ¥{{ record.price.toFixed(2) }}</span>
            <span v-if="record.type === 'sales'">单价: ¥{{ record.sale_price.toFixed(2) }}</span>
          </div>
          <div class="history-operator">
            操作人: {{ record.operator }}
          </div>
        </div>

        <div class="empty-state" v-if="filteredHistory.length === 0">
          <div class="empty-icon">📋</div>
          <p>暂无库存变动记录</p>
        </div>
      </div>
    </div>

    <!-- 商品详情弹窗 -->
    <div class="detail-overlay" v-if="showDetail" @click.self="showDetail = false">
      <div class="detail-container">
        <div class="detail-header">
          <h3>商品库存详情</h3>
          <button class="close-btn" @click="showDetail = false">×</button>
        </div>
        
        <div class="detail-content" v-if="selectedProduct">
          <!-- 标签页切换 -->
          <div class="detail-tabs">
            <button 
              class="tab-btn" 
              :class="{ active: detailTab === 'overview' }"
              @click="detailTab = 'overview'"
            >
              库存概况
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: detailTab === 'inbound' }"
              @click="detailTab = 'inbound'"
            >
              入库历史
            </button>
          </div>

          <!-- 库存概况 -->
          <div v-if="detailTab === 'overview'" class="tab-content">
            <div class="product-info">
              <h4>
                <span v-if="selectedProduct.product_name" class="detail-product-name">{{ selectedProduct.product_name }}</span>
                {{ selectedProduct.style }} · {{ selectedProduct.color }} · {{ selectedProduct.size }}
              </h4>
              <div class="product-codes">
                <span v-if="selectedProduct.barcode">条码: {{ selectedProduct.barcode }}</span>
                <span v-if="selectedProduct.custom_code">货号: {{ selectedProduct.custom_code }}</span>
              </div>
              <div class="product-stock">
                <div class="stock-item">
                  <span>当前库存: </span>
                  <span class="stock-value">{{ getProductStock(selectedProduct._id) }}双</span>
                </div>
                <div class="stock-item">
                  <span>预警值: </span>
                  <span>{{ selectedProduct.stock_alert }}双</span>
                </div>
                <div class="stock-item">
                  <span>状态: </span>
                  <span :class="getStockStatusClass(selectedProduct._id)">
                    {{ getStockStatusText(selectedProduct._id, selectedProduct.stock_alert) }}
                  </span>
                </div>
              </div>
              <div class="product-price">
                <span>进货价: ¥{{ selectedProduct.purchase_price.toFixed(2) }}</span>
                <span>销售价: ¥{{ selectedProduct.sale_price.toFixed(2) }}</span>
              </div>
            </div>

            <div class="recent-changes">
              <h4>近期变动</h4>
              <div class="changes-list">
                <div 
                  class="change-item" 
                  v-for="(change, index) in getRecentChanges(selectedProduct._id)" 
                  :key="index"
                  :class="change.type"
                >
                  <span class="change-type">{{ change.type === 'inbound' ? '入库' : '销售' }}</span>
                  <span class="change-quantity">{{ change.quantity }}双</span>
                  <span class="change-time">{{ formatDate(change.created_at) }}</span>
                </div>
                <div class="empty-changes" v-if="getRecentChanges(selectedProduct._id).length === 0">
                  暂无变动记录
                </div>
              </div>
            </div>
          </div>

          <!-- 入库历史 -->
          <div v-if="detailTab === 'inbound'" class="tab-content">
            <div class="inbound-history">
              <h4>入库历史记录</h4>
              <div class="inbound-list" v-if="inboundHistory.length > 0">
                <div 
                  class="inbound-item" 
                  v-for="(record, index) in inboundHistory" 
                  :key="index"
                >
                  <div class="inbound-header">
                    <span class="inbound-date">{{ formatDate(record.createdAt) }}</span>
                    <span class="inbound-quantity">+{{ record.quantity }}双</span>
                  </div>
                  <div class="inbound-details">
                    <span class="inbound-price">单价: ¥{{ (record.totalCost / record.quantity).toFixed(2) }}</span>
                    <span class="inbound-supplier">供应商: {{ record.supplier || '-' }}</span>
                    <span class="inbound-operator">操作人: {{ record.operator || '-' }}</span>
                  </div>
                  <div class="inbound-total">
                    <span>总成本: ¥{{ record.totalCost.toFixed(2) }}</span>
                  </div>
                </div>
              </div>
              <div class="empty-inbound" v-else>
                暂无入库记录
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, reactive, onMounted } from 'vue'
import Icon from '../components/Icons/Icon.vue'
import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default {
  name: 'Inventory',
  components: {
    Icon
  },
  setup() {
    // 商品数据
    const products = ref([])

    // 库存数据
    const inventory = ref({})

    // 库存变动历史
    const stockHistory = ref([])

    // 响应式数据
    const activeTab = ref('all')
    const searchKeyword = ref('')
    const showDetail = ref(false)
    const selectedProduct = ref(null)
    const replenishQuantities = ref({})
    
    // 详情弹窗标签页
    const detailTab = ref('overview')
    const inboundHistory = ref([])
    
    // 导出时间范围
    const exportTimeRange = ref('month')
    
    // 历史记录筛选条件
    const historyFilters = reactive({
      timeRange: 'week',
      type: ''
    })

    // 分页显示配置
    const initialCount = 4
    const expandStep = 10
    const displayCountAll = ref(initialCount)
    const displayCountLow = ref(initialCount)

    // 计算属性
    const totalProducts = computed(() => products.value.length)
    
    const lowStockProducts = computed(() => {
      return products.value.filter(product => {
        const stock = inventory.value[product._id] || 0
        return stock > 0 && stock < product.stock_alert
      }).length
    })

    const zeroStockProducts = computed(() => {
      return products.value.filter(product => {
        return (inventory.value[product._id] || 0) === 0
      }).length
    })

    // 筛选商品
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

    // 低库存商品列表
    const lowStockList = computed(() => {
      return products.value.filter(product => {
        const stock = inventory.value[product._id] || 0
        return stock <= product.stock_alert
      })
    })

    // 实际显示的商品列表（分页）- 全部库存
    const displayedProducts = computed(() => {
      return filteredProducts.value.slice(0, displayCountAll.value)
    })

    // 实际显示的商品列表（分页）- 预警库存
    const displayedLowStock = computed(() => {
      return lowStockList.value.slice(0, displayCountLow.value)
    })

    // 是否还有更多商品
    const hasMoreProducts = computed(() => {
      return filteredProducts.value.length > displayCountAll.value
    })

    const hasMoreLowStock = computed(() => {
      return lowStockList.value.length > displayCountLow.value
    })

    // 剩余未显示商品数量
    const remainingCount = computed(() => {
      return Math.max(0, filteredProducts.value.length - displayCountAll.value)
    })

    const remainingLowCount = computed(() => {
      return Math.max(0, lowStockList.value.length - displayCountLow.value)
    })

    // 总补货数量
    const totalReplenishQty = computed(() => {
      return lowStockList.value.reduce((total, product) => {
        return total + (replenishQuantities.value[product._id] || calculateSuggestedQty(product))
      }, 0)
    })

    // 总补货金额
    const totalReplenishAmount = computed(() => {
      return lowStockList.value.reduce((total, product) => {
        const qty = replenishQuantities.value[product._id] || calculateSuggestedQty(product)
        return total + (qty * product.purchase_price)
      }, 0)
    })

    // 筛选历史记录
    const filteredHistory = computed(() => {
      let filtered = stockHistory.value

      // 按类型筛选
      if (historyFilters.type) {
        filtered = filtered.filter(record => record.type === historyFilters.type)
      }

      // 按时间范围筛选
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(todayStart)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      switch (historyFilters.timeRange) {
        case 'today':
          filtered = filtered.filter(record => new Date(record.created_at) >= todayStart)
          break
        case 'week':
          filtered = filtered.filter(record => new Date(record.created_at) >= weekStart)
          break
        case 'month':
          filtered = filtered.filter(record => new Date(record.created_at) >= monthStart)
          break
      }

      // 按时间倒序排序
      return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    })

    // 方法
    const getProductStock = (productId) => {
      return inventory.value[productId] || 0
    }

    const getStockStatusClass = (productId) => {
      const stock = inventory.value[productId] || 0
      const product = products.value.find(p => p._id === productId)
      if (!product) return ''
      
      if (stock === 0) return 'zero'
      if (stock < product.stock_alert) return 'low'
      return 'normal'
    }

    const getStockStatusText = (productId, alertValue) => {
      const stock = inventory.value[productId] || 0
      if (stock === 0) return '缺货'
      if (stock < alertValue) return '预警'
      return '正常'
    }

    const handleSearch = () => {
      // 搜索逻辑已在computed中实现
      // 重置显示数量
      displayCountAll.value = initialCount
    }

    const handleScanBarcode = () => {
      // TODO: 集成扫码库
      alert('扫码功能待实现')
    }

    const showProductDetail = async (product) => {
      selectedProduct.value = product
      detailTab.value = 'overview'
      inboundHistory.value = []
      showDetail.value = true
      
      // 获取入库历史
      await fetchInboundHistory(product._id)
    }
    
    // 获取商品入库历史
    const fetchInboundHistory = async (productId) => {
      try {
        const response = await api.get(`/inbound?productId=${productId}&limit=100`)
        if (response.data.status === 'success') {
          inboundHistory.value = response.data.data
        }
      } catch (error) {
        console.error('获取入库历史失败:', error)
      }
    }

    const calculateSuggestedQty = (product) => {
      const currentStock = inventory.value[product._id] || 0
      // 建议补货量 = 预警值 * 2 - 当前库存
      return Math.max(product.stock_alert * 2 - currentStock, product.stock_alert)
    }

    const generateReplenishList = () => {
      // 生成建议补货量
      products.value.forEach(product => {
        const stock = inventory.value[product._id] || 0
        if (stock <= product.stock_alert) {
          replenishQuantities.value[product._id] = calculateSuggestedQty(product)
        }
      })
      alert('补货单已生成')
    }

    const updateReplenishTotal = () => {
      // 自动更新补货总量
    }

    const exportInventory = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/export/inventory?timeRange=${exportTimeRange.value}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `导出失败: ${response.status}`)
        }

        // 获取文件名
        const contentDisposition = response.headers.get('content-disposition')
        let filename = 'inventory_data.csv'
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/)
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

        alert('库存数据导出成功')
      } catch (error) {
        console.error('导出库存数据失败:', error)
        alert('导出库存数据失败: ' + error.message)
      }
    }

    const filterHistory = () => {
      // 筛选逻辑已在computed中实现
    }

    // 展开更多商品 - 全部库存
    const showMore = () => {
      displayCountAll.value += expandStep
    }

    // 展开更多商品 - 预警库存
    const showMoreLow = () => {
      displayCountLow.value += expandStep
    }

    const getRecentChanges = (productId) => {
      return stockHistory.value
        .filter(record => record.product_id === productId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
    }

    const formatDate = (date) => {
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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
              stock_alert: item.stockAlert || 10,
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

    // 获取库存变动历史
    const fetchStockHistory = async () => {
      try {
        // 获取入库记录
        const inboundResponse = await api.get('/inbound')
        // 获取销售记录
        const salesResponse = await api.get('/sales')

        const history = []

        if (inboundResponse.data.status === 'success') {
          inboundResponse.data.data.forEach(item => {
            history.push({
              _id: 'in-' + item._id,
              type: 'inbound',
              product_id: item.productId?._id || item.productId,
              product_info: {
                style: item.productId?.name || '',
                color: item.productId?.color || '',
                size: item.productId?.size || ''
              },
              quantity: item.quantity,
              price: item.totalCost / item.quantity,
              operator: localStorage.getItem('username') || '未知用户',
              created_at: item.createdAt
            })
          })
        }

        if (salesResponse.data.status === 'success') {
          salesResponse.data.data.forEach(item => {
            history.push({
              _id: 'sl-' + item._id,
              type: 'sales',
              product_id: item.productId?._id || item.productId,
              product_info: {
                style: item.productId?.name || '',
                color: item.productId?.color || '',
                size: item.productId?.size || ''
              },
              quantity: item.quantity,
              sale_price: item.unitPrice,
              operator: localStorage.getItem('username') || '未知用户',
              created_at: item.createdAt
            })
          })
        }

        stockHistory.value = history
      } catch (error) {
        console.error('获取库存变动历史失败:', error)
      }
    }

    // 组件挂载时获取数据
    onMounted(() => {
      fetchProducts()
      fetchStockHistory()
    })

    return {
      activeTab,
      searchKeyword,
      showDetail,
      selectedProduct,
      replenishQuantities,
      detailTab,
      inboundHistory,
      exportTimeRange,
      historyFilters,
      totalProducts,
      lowStockProducts,
      zeroStockProducts,
      filteredProducts,
      displayedProducts,
      lowStockList,
      displayedLowStock,
      hasMoreProducts,
      hasMoreLowStock,
      remainingCount,
      remainingLowCount,
      totalReplenishQty,
      totalReplenishAmount,
      filteredHistory,
      getProductStock,
      getStockStatusClass,
      getStockStatusText,
      handleSearch,
      showMore,
      showMoreLow,
      handleScanBarcode,
      showProductDetail,
      fetchInboundHistory,
      generateReplenishList,
      updateReplenishTotal,
      exportInventory,
      filterHistory,
      getRecentChanges,
      formatDate,
      fetchProducts,
      fetchStockHistory,
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
.inventory-container {
  padding: 16px;
  padding-bottom: 70px;
}

.inventory-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.scan-btn {
  padding: 8px 12px;
  background: linear-gradient(135deg, #A8E6CF 0%, #A8D8EA 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.export-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-range-select {
  padding: 8px 12px;
  border: 1px solid rgba(255, 183, 197, 0.5);
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
  color: #4A4A4A;
  cursor: pointer;
  outline: none;
}

.time-range-select:focus {
  border-color: #FFB7C5;
}

.export-btn {
  padding: 8px 12px;
  background: linear-gradient(135deg, #A8D8EA 0%, #A8E6CF 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

/* 限制按钮中的图标大小 */
.scan-btn :deep(svg),
.export-btn :deep(svg) {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* 库存概览 */
.inventory-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.overview-card {
  background: linear-gradient(135deg, #FFB7C5 0%, #A8E6CF 100%);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #fff;
}

.overview-card.total {
  background: linear-gradient(135deg, #A8D8EA 0%, #A8E6CF 100%);
}

.overview-card.low {
  background: linear-gradient(135deg, #FFD93D 0%, #FFB7C5 100%);
}

.overview-card.zero {
  background: linear-gradient(135deg, #FFB7C5 0%, #FFD93D 100%);
}

.card-icon {
  font-size: 20px;
  margin-bottom: 6px;
}

.card-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.card-content h3 {
  font-size: 11px;
  color: #fff;
  margin-bottom: 2px;
  opacity: 0.9;
}

.card-value {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

/* 标签切换 */
.tab-section {
  display: flex;
  background-color: #f5f5f5;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border: none;
  background-color: transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background-color: #fff;
  color: #1890ff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 搜索栏 */
.search-bar {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

/* 库存列表 */
.inventory-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.inventory-item {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.inventory-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.inventory-item.low-stock {
  border-left: 4px solid #faad14;
}

.inventory-item.zero-stock {
  border-left: 4px solid #f5222d;
  opacity: 0.8;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  flex: 1;
  margin-right: 8px;
}

.item-name .product-name {
  display: block;
  color: #8B4513;
  font-weight: 700;
  margin-bottom: 2px;
}

.stock-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.stock-status.normal {
  background-color: #f6ffed;
  color: #52c41a;
}

.stock-status.low {
  background-color: #fff7e6;
  color: #faad14;
}

.stock-status.zero {
  background-color: #fff2f0;
  color: #f5222d;
}

.item-codes {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.code-item {
  font-size: 12px;
  color: #666;
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 6px;
}

.item-stock {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.stock-info, .alert-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stock-value {
  font-weight: 600;
  color: #333;
}

.item-price {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

/* 低库存 section */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.generate-btn {
  padding: 8px 16px;
  background-color: #1890ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.replenish-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.replenish-item {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #faad14;
}

.replenish-item.zero-stock {
  border-left-color: #f5222d;
}

.product-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.product-info h4 .product-name-highlight {
  display: block;
  color: #8B4513;
  font-weight: 700;
  margin-bottom: 2px;
}

.product-codes {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.stock-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 13px;
}

.current-stock, .alert-stock {
  display: flex;
  align-items: center;
  gap: 4px;
}

.replenish-input {
  display: flex;
  align-items: center;
  gap: 12px;
}

.replenish-input label {
  font-size: 13px;
  color: #666;
}

.replenish-qty {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

/* 补货汇总 */
.replenish-summary {
  background-color: #f0f9ff;
  border: 1px solid #91d5ff;
  border-radius: 12px;
  padding: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-value {
  font-weight: 600;
  color: #1890ff;
}

/* 历史记录 section */
.filter-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-group {
  flex: 1;
  min-width: 120px;
}

.filter-group label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.filter-select {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.filter-btn {
  padding: 0 16px;
  background-color: #1890ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  align-self: flex-end;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #1890ff;
}

.history-item.inbound {
  border-left-color: #52c41a;
}

.history-item.sales {
  border-left-color: #fa8c16;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.record-type {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.record-type.inbound {
  background-color: #f6ffed;
  color: #52c41a;
}

.record-type.sales {
  background-color: #fff7e6;
  color: #fa8c16;
}

.record-time {
  font-size: 12px;
  color: #999;
}

.history-product {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.history-details {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.history-operator {
  font-size: 12px;
  color: #999;
}

/* 详情弹窗 */
.detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.detail-container {
  background-color: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background-color: transparent;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.detail-content {
  padding: 20px;
  overflow-y: auto;
}

/* 标签页样式 */
.detail-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
}

.tab-btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
  color: #fff;
}

/* 入库历史样式 */
.inbound-history h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.inbound-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.inbound-item {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
  border-left: 3px solid #FFB7C5;
}

.inbound-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.inbound-date {
  font-size: 13px;
  color: #666;
}

.inbound-quantity {
  font-size: 14px;
  font-weight: 600;
  color: #52c41a;
}

.inbound-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.inbound-total {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  text-align: right;
  padding-top: 8px;
  border-top: 1px dashed #e0e0e0;
}

.empty-inbound {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

.product-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.product-info h4 .detail-product-name {
  display: block;
  color: #8B4513;
  font-weight: 700;
  margin-bottom: 4px;
}

.product-stock {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.stock-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.product-price {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-bottom: 20px;
}

.recent-changes h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.changes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.change-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
  font-size: 12px;
}

.change-item.inbound {
  border-left: 3px solid #52c41a;
}

.change-item.sales {
  border-left: 3px solid #fa8c16;
}

.change-type {
  font-weight: 500;
}

.change-quantity {
  flex: 1;
  text-align: center;
}

.change-time {
  color: #999;
}

.empty-changes {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 13px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
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

.empty-state p {
  font-size: 14px;
}

.empty-subtext {
  font-size: 12px;
  margin-top: 4px;
  color: #999;
}

/* 响应式适配 */
@media (max-width: 480px) {
  .inventory-overview {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .overview-card {
    padding: 12px 8px;
  }

  .card-content h3 {
    font-size: 11px;
  }

  .card-value {
    font-size: 16px;
  }

  .filter-section {
    flex-direction: column;
  }

  .filter-group {
    min-width: unset;
  }

  .filter-btn {
    align-self: stretch;
  }
}
</style>
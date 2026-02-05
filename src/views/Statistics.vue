<template>
  <div class="statistics-container">
    <!-- 统计概览 -->
    <div class="stats-overview">
      <div class="overview-card sales animate-float">
        <div class="card-icon gradient-primary">
          <Icon name="sales" :size="24" color="#FFFFFF" />
        </div>
        <div class="card-content">
          <h3>{{ salesLabel }}</h3>
          <p class="card-value">¥{{ currentSales.toFixed(0) }}</p>
          <p class="card-change" :class="{ positive: salesChange > 0, negative: salesChange < 0 }">
            <Icon v-if="salesChange > 0" name="trendUp" :size="12" />
            <Icon v-if="salesChange < 0" name="trendDown" :size="12" />
            {{ Math.abs(salesChange).toFixed(2) }}%
          </p>
        </div>
      </div>
      <div class="overview-card profit animate-float" style="animation-delay: 0.1s;">
        <div class="card-icon gradient-secondary">
          <Icon name="profit" :size="24" color="#FFFFFF" />
        </div>
        <div class="card-content">
          <h3>{{ profitLabel }}</h3>
          <p class="card-value">¥{{ currentProfit.toFixed(0) }}</p>
          <p class="card-change" :class="{ positive: profitChange > 0, negative: profitChange < 0 }">
            <Icon v-if="profitChange > 0" name="trendUp" :size="12" />
            <Icon v-if="profitChange < 0" name="trendDown" :size="12" />
            {{ Math.abs(profitChange).toFixed(2) }}%
          </p>
        </div>
      </div>
      <div class="overview-card inventory animate-float" style="animation-delay: 0.2s;">
        <div class="card-icon gradient-accent">
          <Icon name="package" :size="24" color="#FFFFFF" />
        </div>
        <div class="card-content">
          <h3>库存总值</h3>
          <p class="card-value">¥{{ inventoryValue.toFixed(0) }}</p>
          <p class="card-text">共{{ totalProducts }}个商品</p>
        </div>
      </div>
    </div>

    <!-- 时间筛选 -->
    <div class="time-filter">
      <button 
        class="time-btn" 
        :class="{ active: timeRange === 'today' }"
        @click="timeRange = 'today'"
      >
        今日
      </button>
      <button 
        class="time-btn" 
        :class="{ active: timeRange === 'week' }"
        @click="timeRange = 'week'"
      >
        本周
      </button>
      <button 
        class="time-btn" 
        :class="{ active: timeRange === 'month' }"
        @click="timeRange = 'month'"
      >
        本月
      </button>
      <button 
        class="time-btn" 
        :class="{ active: timeRange === 'year' }"
        @click="timeRange = 'year'"
      >
        本年
      </button>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <h3 class="section-title">快捷操作</h3>
      <div class="actions-grid">
        <div class="action-item" @click="goToProduct">
          <div class="action-icon add-product">
            <Icon name="add" :size="24" />
          </div>
          <span class="action-text">新增商品</span>
        </div>
        <div class="action-item" @click="goToInbound">
          <div class="action-icon inbound">
            <Icon name="inbound" :size="24" />
          </div>
          <span class="action-text">入库</span>
        </div>
        <div class="action-item" @click="goToSales">
          <div class="action-icon sales">
            <Icon name="sales" :size="24" />
          </div>
          <span class="action-text">销售</span>
        </div>
        <div class="action-item" @click="goToScan">
          <div class="action-icon scan">
            <Icon name="scan" :size="24" />
          </div>
          <span class="action-text">扫码</span>
        </div>
      </div>
    </div>

    <!-- 统计图表 -->
    <div class="charts-section">
      <!-- 商品分类占比 -->
      <div class="chart-card">
        <div class="chart-tabs">
          <button
            class="tab-btn"
            :class="{ active: categoryView === 'amount' }"
            @click="categoryView = 'amount'"
          >
            {{ amountTabLabel }}
          </button>
          <button
            class="tab-btn"
            :class="{ active: categoryView === 'quantity' }"
            @click="categoryView = 'quantity'"
          >
            {{ quantityTabLabel }}
          </button>
        </div>
        <div class="chart-content">
          <PieChart
            :data="categoryChartData"
            :height="160"
            :tooltip-label="categoryView === 'amount' ? '金额' : '数量'"
            :tooltip-unit="categoryView === 'amount' ? '¥' : '双'"
          />
        </div>
      </div>

      <!-- 趋势图切换卡片 -->
      <div class="chart-card">
        <div class="chart-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: trendTab === 'sales' }"
            @click="trendTab = 'sales'"
          >
            {{ salesTrendLabel }}
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: trendTab === 'margin' }"
            @click="trendTab = 'margin'"
          >
            {{ marginTrendLabel }}
          </button>
        </div>
        <div class="chart-content">
          <LineChart 
            v-if="trendTab === 'sales'" 
            :data="salesTrendData" 
            color="#FFB7C5" 
            :height="140" 
          />
          <LineChart 
            v-else 
            :data="marginTrendDataForChart" 
            color="#A8E6CF" 
            :height="140" 
          />
        </div>
      </div>
    </div>

    <!-- 销售排行 -->
    <div class="ranking-section">
      <div class="section-header">
        <h3>{{ hotProductsLabel }}</h3>
      </div>
      <div class="ranking-list">
        <div 
          class="ranking-item" 
          v-for="(product, index) in hotProducts.slice(0, 3)" 
          :key="product._id"
        >
          <div class="rank-number" :class="{ top: index < 3 }">{{ index + 1 }}</div>
          <div class="rank-product">
            <h4>{{ formatGenderType(product.gender_type) }}·{{ product.style }} · {{ product.color }} · {{ product.size }}</h4>
            <p v-if="product.custom_code" class="product-custom-code">货号: {{ product.custom_code }}</p>
          </div>
          <div class="rank-sales">
            <p class="sales-volume">{{ product.salesVolume }}双</p>
            <p class="sales-amount">¥{{ product.salesAmount.toFixed(2) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 库存分析 -->
    <div class="inventory-analysis">
      <div class="section-header">
        <h3>库存分析</h3>
      </div>
      <div class="inventory-stats">
        <div class="stats-item">
          <span class="stats-label">总库存量</span>
          <span class="stats-value">{{ totalInventory }}双</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">平均库存</span>
          <span class="stats-value">{{ avgInventory.toFixed(1) }}双</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">库存周转天数</span>
          <span class="stats-value">{{ inventoryTurnover }}天</span>
        </div>
      </div>
      <div class="inventory-category">
        <div class="category-item">
          <div class="category-info">
            <span class="category-name">正常库存</span>
            <span class="category-count">{{ normalInventoryCount }}个</span>
          </div>
          <div class="category-bar">
            <div 
              class="category-progress normal" 
              :style="{ width: normalInventoryPercentage + '%' }"
            ></div>
          </div>
        </div>
        <div class="category-item">
          <div class="category-info">
            <span class="category-name">预警库存</span>
            <span class="category-count">{{ lowInventoryCount }}个</span>
          </div>
          <div class="category-bar">
            <div 
              class="category-progress low" 
              :style="{ width: lowInventoryPercentage + '%' }"
            ></div>
          </div>
        </div>
        <div class="category-item">
          <div class="category-info">
            <span class="category-name">缺货</span>
            <span class="category-count">{{ zeroInventoryCount }}个</span>
          </div>
          <div class="category-bar">
            <div 
              class="category-progress zero" 
              :style="{ width: zeroInventoryPercentage + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Icon from '../components/Icons/Icon.vue'
import LineChart from '../components/Charts/LineChart.vue'
import PieChart from '../components/Charts/PieChart.vue'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default {
  name: 'Statistics',
  components: {
    Icon,
    LineChart,
    PieChart
  },
  setup() {
    const router = useRouter()

    // 响应式数据
    const timeRange = ref('today')
    const trendTab = ref('sales')
    const categoryView = ref('amount') // 'amount' | 'quantity'
    const loading = ref(false)
    const error = ref(null)

    // 数据状态
    const salesData = ref({
      today: 0,
      yesterday: 0,
      week: 0,
      month: 0,
      year: 0
    })

    const profitData = ref({
      today: 0,
      yesterday: 0,
      week: 0,
      month: 0,
      year: 0
    })

    const inventoryData = ref({
      total: 0,
      totalStock: 0,
      value: 0,
      normal: 0,
      low: 0,
      zero: 0
    })

    const salesTrendData = ref([])
    const marginTrendData = ref([])
    const categoryData = ref([])
    const hotProducts = ref([])

    // 计算属性
    const inventoryValue = computed(() => inventoryData.value.value)
    const totalProducts = computed(() => inventoryData.value.total)

    // 当前销售额（根据时间范围）
    const currentSales = computed(() => {
      switch (timeRange.value) {
        case 'today': return salesData.value.today
        case 'week': return salesData.value.week
        case 'month': return salesData.value.month
        case 'year': return salesData.value.year
        default: return salesData.value.today
      }
    })

    // 当前毛利（根据时间范围）
    const currentProfit = computed(() => {
      switch (timeRange.value) {
        case 'today': return profitData.value.today
        case 'week': return profitData.value.week
        case 'month': return profitData.value.month
        case 'year': return profitData.value.year
        default: return profitData.value.today
      }
    })

    // 动态标签
    const salesLabel = computed(() => {
      const labels = { today: '今日', week: '本周', month: '本月', year: '本年' }
      return labels[timeRange.value] + '销售额'
    })

    const profitLabel = computed(() => {
      const labels = { today: '今日', week: '本周', month: '本月', year: '本年' }
      return labels[timeRange.value] + '毛利'
    })

    // 金额占比和数量占比的标签
    const amountTabLabel = computed(() => {
      const labels = { today: '今日', week: '本周', month: '本月', year: '本年' }
      return `金额占比（${labels[timeRange.value]}）`
    })

    const quantityTabLabel = computed(() => {
      const labels = { today: '今日', week: '本周', month: '本月', year: '本年' }
      return `数量占比（${labels[timeRange.value]}）`
    })

    // 销售趋势和毛利率趋势的标签
    const salesTrendLabel = computed(() => {
      const labels = { today: '今日', week: '本周', month: '本月', year: '本年' }
      return `销售趋势（${labels[timeRange.value]}）`
    })

    const marginTrendLabel = computed(() => {
      const labels = { today: '今日', week: '本周', month: '本月', year: '本年' }
      return `毛利率趋势（${labels[timeRange.value]}）`
    })

    // 热销商品排行的标签
    const hotProductsLabel = computed(() => {
      const labels = { today: '今日', week: '本周', month: '本月', year: '本年' }
      return `热销商品排行（${labels[timeRange.value]}）`
    })

    // 销售变化率
    const salesChange = computed(() => {
      const today = salesData.value.today
      const yesterday = salesData.value.yesterday
      if (yesterday === 0) return 0
      return ((today - yesterday) / yesterday) * 100
    })

    // 毛利变化率
    const profitChange = computed(() => {
      const today = profitData.value.today
      const yesterday = profitData.value.yesterday
      if (yesterday === 0) return 0
      return ((today - yesterday) / yesterday) * 100
    })

    // 监听时间范围变化，重新加载数据
    watch(timeRange, (newRange) => {
      fetchStatisticsData(newRange)
    })

    // 库存统计
    const totalInventory = computed(() => {
      // 从库存数据计算总库存量
      return inventoryData.value.totalStock || 0
    })

    const avgInventory = computed(() => {
      if (inventoryData.value.total === 0) return 0
      return totalInventory.value / inventoryData.value.total
    })

    const inventoryTurnover = computed(() => {
      // 简化计算：库存周转天数 = 平均库存 / 日均销售成本
      // 这里使用固定值，实际应该根据销售数据计算
      const dailySalesCost = salesData.value.today > 0 ? salesData.value.today * 0.6 : 1
      const avgStock = totalInventory.value / (inventoryData.value.total || 1)
      return Math.round(avgStock / dailySalesCost * 30) || 0
    })

    // 库存状态百分比
    const normalInventoryPercentage = computed(() => {
      if (inventoryData.value.total === 0) return 0
      return (inventoryData.value.normal / inventoryData.value.total) * 100
    })

    const lowInventoryPercentage = computed(() => {
      if (inventoryData.value.total === 0) return 0
      return (inventoryData.value.low / inventoryData.value.total) * 100
    })

    const zeroInventoryPercentage = computed(() => {
      if (inventoryData.value.total === 0) return 0
      return (inventoryData.value.zero / inventoryData.value.total) * 100
    })

    const normalInventoryCount = computed(() => inventoryData.value.normal)
    const lowInventoryCount = computed(() => inventoryData.value.low)
    const zeroInventoryCount = computed(() => inventoryData.value.zero)

    // 为图表转换毛利率数据
    const marginTrendDataForChart = computed(() => {
      return marginTrendData.value.map(item => ({
        label: item.label,
        value: item.margin
      }))
    })

    // 商品分类图表数据（根据视图类型切换）
    const categoryChartData = computed(() => {
      if (categoryView.value === 'amount') {
        // 金额占比
        const totalAmount = categoryData.value.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
        return categoryData.value.map(item => ({
          name: item.name,
          value: item.totalAmount || 0,
          percentage: totalAmount > 0 ? Number((((item.totalAmount || 0) / totalAmount) * 100).toFixed(2)) : 0
        }))
      } else {
        // 数量占比
        const totalQuantity = categoryData.value.reduce((sum, item) => sum + (item.totalQuantity || 0), 0)
        return categoryData.value.map(item => ({
          name: item.name,
          value: item.totalQuantity || 0,
          percentage: totalQuantity > 0 ? Number((((item.totalQuantity || 0) / totalQuantity) * 100).toFixed(2)) : 0
        }))
      }
    })

    // 方法
    const fetchStatisticsData = async (range = 'today') => {
      loading.value = true
      error.value = null

      try {
        // 根据时间范围确定参数
        let days = 7
        let period = 'week'
        let categoryDays = 30

        switch (range) {
          case 'today':
            days = 1
            period = 'week'
            categoryDays = 1
            break
          case 'week':
            days = 7
            period = 'week'
            categoryDays = 7
            break
          case 'month':
            days = 30
            period = 'month'
            categoryDays = 30
            break
          case 'year':
            days = 365
            period = 'month'
            categoryDays = 365
            break
        }

        // 获取概览数据
        const overviewResponse = await api.get('/stats/overview')

        if (overviewResponse.data.status === 'success') {
          const data = overviewResponse.data.data
          // 更新库存数据
          if (data.products) {
            inventoryData.value = {
              total: data.products.totalProducts || 0,
              totalStock: data.products.totalStock || 0,
              value: data.products.totalValue || 0,
              normal: data.products.normal || 0,
              low: data.products.low || 0,
              zero: data.products.zero || 0
            }
          }

          // 更新销售数据
          if (data.sales) {
            salesData.value = {
              today: data.sales.today || 0,
              yesterday: data.sales.yesterday || 0,
              week: data.sales.week || 0,
              month: data.sales.month || 0,
              year: data.sales.year || 0
            }
          }
        }

        // 获取毛利数据
        const marginResponse = await api.get('/stats/profit/margin')

        if (marginResponse.data.status === 'success') {
          const data = marginResponse.data.data
          profitData.value = {
            today: data.today?.marginAmount || 0,
            yesterday: data.today?.marginAmount * 0.8 || 0,
            week: data.week?.marginAmount || 0,
            month: data.month?.marginAmount || 0,
            year: data.year?.marginAmount || 0
          }
        }

        // 获取销售趋势数据（根据时间范围）
        const salesTrendResponse = await api.get(`/stats/sales/trend?days=${days}`)

        if (salesTrendResponse.data.status === 'success') {
          salesTrendData.value = salesTrendResponse.data.data.map(item => ({
            label: item._id,
            value: item.salesAmount || 0
          }))
        }

        // 获取毛利趋势数据（根据时间范围）
        const marginTrendResponse = await api.get(`/stats/profit/trend?period=${period}`)

        if (marginTrendResponse.data.status === 'success') {
          marginTrendData.value = marginTrendResponse.data.data
        }

        // 获取分类销售数据（根据时间范围）
        const categoryResponse = await api.get(`/stats/categories/sales?days=${categoryDays}`)

        if (categoryResponse.data.status === 'success') {
          const categoryDataList = categoryResponse.data.data

          categoryData.value = categoryDataList.map(item => ({
            name: item._id || '其他',
            totalAmount: item.totalAmount || 0,
            totalQuantity: item.totalQuantity || 0
          }))
        }

        // 获取热销商品数据（根据时间范围）
        const hotProductsResponse = await api.get(`/stats/products/top?limit=5&days=${categoryDays}`)

        if (hotProductsResponse.data.status === 'success') {
          hotProducts.value = hotProductsResponse.data.data.map(item => ({
            _id: item.productId || Math.random().toString(36).substr(2, 9),
            barcode: item.productId || '',
            custom_code: item.customCode || '',
            style: item.productName || '未知',
            gender_type: item.genderType || 'unisex',
            color: item.color || '未知',
            size: item.size || '未知',
            salesVolume: item.totalQuantity || 0,
            salesAmount: item.totalAmount || 0
          }))
        }

      } catch (err) {
        console.error('获取统计数据失败:', err)
        error.value = '获取数据失败，请刷新页面重试'

        // 加载失败时使用默认数据
        loadDefaultData()
      } finally {
        loading.value = false
      }
    }

    // 加载默认数据（当API调用失败时使用）
    const loadDefaultData = () => {
      salesData.value = {
        today: 0,
        yesterday: 0,
        week: 0,
        month: 0,
        year: 0
      }

      profitData.value = {
        today: 0,
        yesterday: 0,
        week: 0,
        month: 0,
        year: 0
      }

      inventoryData.value = {
        total: 0,
        value: 0,
        normal: 0,
        low: 0,
        zero: 0
      }

      salesTrendData.value = []
      marginTrendData.value = []
      categoryData.value = []
      hotProducts.value = []
    }

    // 快捷操作跳转
    const goToProduct = () => {
      router.push('/home/product')
    }

    const goToInbound = () => {
      router.push('/home/inbound')
    }

    const goToSales = () => {
      router.push('/home/sales')
    }

    const goToScan = () => {
      router.push('/home/scan')
    }

    // 生命周期钩子
    onMounted(() => {
      fetchStatisticsData()
    })

    return {
      timeRange,
      trendTab,
      categoryView,
      loading,
      error,
      currentSales,
      currentProfit,
      salesLabel,
      profitLabel,
      amountTabLabel,
      quantityTabLabel,
      salesTrendLabel,
      marginTrendLabel,
      hotProductsLabel,
      inventoryValue,
      totalProducts,
      salesChange,
      profitChange,
      salesTrendData,
      marginTrendData,
      marginTrendDataForChart,
      categoryData,
      categoryChartData,
      hotProducts,
      totalInventory,
      avgInventory,
      inventoryTurnover,
      normalInventoryPercentage,
      lowInventoryPercentage,
      zeroInventoryPercentage,
      normalInventoryCount,
      lowInventoryCount,
      zeroInventoryCount,
      goToProduct,
      goToInbound,
      goToSales,
      goToScan,
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
.statistics-container {
  padding-bottom: 20px;
}

/* 统计概览 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
  width: 100%;
}

.stats-overview > * {
  min-width: 0;
}

.overview-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 10px 8px;
  box-shadow: 0 2px 8px rgba(255, 183, 197, 0.15);
  border: 1px solid rgba(255, 183, 197, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.3s ease;
}

.overview-card:hover {
  box-shadow: 0 4px 16px rgba(255, 183, 197, 0.25);
  transform: translateY(-2px);
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.gradient-primary {
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
}

.gradient-secondary {
  background: linear-gradient(135deg, #A8E6CF 0%, #A8D8EA 100%);
}

.gradient-accent {
  background: linear-gradient(135deg, #A8D8EA 0%, #FFB7C5 100%);
}

.card-content h3 {
  font-size: 11px;
  color: #888888;
  margin-bottom: 4px;
  font-weight: 500;
}

.card-value {
  font-size: 14px;
  font-weight: 700;
  color: #4A4A4A;
  margin-bottom: 2px;
}

.card-change {
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

/* 快捷操作 */
.quick-actions {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(255, 183, 197, 0.15);
  border: 1px solid rgba(255, 183, 197, 0.2);
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #4A4A4A;
  margin-bottom: 12px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.action-item:hover {
  background: #FFFBF5;
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon.add-product {
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
  color: #FFFFFF;
}

.action-icon.inbound {
  background: linear-gradient(135deg, #A8E6CF 0%, #A8D8EA 100%);
  color: #FFFFFF;
}

.action-icon.sales {
  background: linear-gradient(135deg, #B8B5FF 0%, #D4C4FB 100%);
  color: #FFFFFF;
}

.action-icon.scan {
  background: linear-gradient(135deg, #FFD1DC 0%, #FFB7C5 100%);
  color: #FFFFFF;
}

.action-text {
  font-size: 12px;
  color: #666666;
  font-weight: 500;
}

.card-change.positive {
  color: #52C41A;
}

.card-change.negative {
  color: #FF6B6B;
}

.card-text {
  font-size: 10px;
  color: #AAAAAA;
}

/* 动画 */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* 时间筛选 */
.time-filter {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 12px;
}

.time-btn {
  padding: 6px 12px;
  background: #FFFFFF;
  border: 1px solid rgba(255, 183, 197, 0.3);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #888888;
  cursor: pointer;
  transition: all 0.3s ease;
}

.time-btn.active {
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
  color: #FFFFFF;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(255, 183, 197, 0.3);
}

.time-btn:hover:not(.active) {
  border-color: #FFB7C5;
  color: #FFB7C5;
}

.export-btn {
  padding: 6px 12px;
  background: linear-gradient(135deg, #A8E6CF 0%, #A8D8EA 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.export-btn:hover {
  box-shadow: 0 4px 12px rgba(168, 230, 207, 0.4);
  transform: translateY(-2px);
}

/* 图表区域 */
.charts-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.chart-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(255, 183, 197, 0.15);
  border: 1px solid rgba(255, 183, 197, 0.2);
}

.chart-header {
  margin-bottom: 8px;
}

.chart-header h3 {
  font-size: 13px;
  font-weight: 600;
  color: #4A4A4A;
}

.chart-content {
  min-height: 140px;
}

/* 图表标签切换 */
.chart-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 183, 197, 0.2);
}

.tab-btn {
  flex: 1;
  padding: 8px 12px;
  background: #FFFBF5;
  border: 1px solid rgba(255, 183, 197, 0.3);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #888888;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
  color: #FFFFFF;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(255, 183, 197, 0.3);
}

.tab-btn:hover:not(.active) {
  border-color: #FFB7C5;
  color: #FFB7C5;
}

/* 排行区域 */
.ranking-section {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(255, 183, 197, 0.15);
  border: 1px solid rgba(255, 183, 197, 0.2);
  margin-bottom: 12px;
}

.section-header {
  margin-bottom: 10px;
}

.section-header h3 {
  font-size: 13px;
  font-weight: 600;
  color: #4A4A4A;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #FFFBF5;
  border-radius: 10px;
  border-left: 3px solid #FFB7C5;
  transition: all 0.3s ease;
}

.ranking-item:hover {
  box-shadow: 0 2px 8px rgba(255, 183, 197, 0.2);
}

.rank-number {
  width: 24px;
  height: 24px;
  background: #FFE4E9;
  color: #FFB7C5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.rank-number.top {
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
  color: #FFFFFF;
}

.rank-product {
  flex: 1;
}

.rank-product h4 {
  font-size: 12px;
  font-weight: 600;
  color: #4A4A4A;
  margin-bottom: 2px;
}

.product-custom-code {
  font-size: 11px;
  color: #888888;
  margin-top: 2px;
}

.product-codes {
  display: flex;
  gap: 6px;
  font-size: 10px;
  color: #AAAAAA;
}

.rank-sales {
  text-align: right;
}

.sales-volume {
  font-size: 11px;
  color: #888888;
  margin-bottom: 1px;
}

.sales-amount {
  font-size: 13px;
  font-weight: 700;
  color: #FFB7C5;
}

/* 库存分析 */
.inventory-analysis {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(255, 183, 197, 0.15);
  border: 1px solid rgba(255, 183, 197, 0.2);
  margin-bottom: 12px;
}

.inventory-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
  width: 100%;
}

.inventory-stats > * {
  min-width: 0;
}

.stats-item {
  background: #FFFBF5;
  border-radius: 10px;
  padding: 8px;
  text-align: center;
}

.stats-label {
  display: block;
  font-size: 11px;
  color: #888888;
  margin-bottom: 2px;
}

.stats-value {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #4A4A4A;
}

.inventory-category {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.category-name {
  font-weight: 500;
  color: #4A4A4A;
}

.category-count {
  font-size: 11px;
  color: #888888;
}

.category-bar {
  height: 6px;
  background: #FFFBF5;
  border-radius: 3px;
  overflow: hidden;
}

.category-progress {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.category-progress.normal {
  background: linear-gradient(90deg, #A8E6CF 0%, #A8D8EA 100%);
}

.category-progress.low {
  background: linear-gradient(90deg, #FFB7C5 0%, #FFE4E9 100%);
}

.category-progress.zero {
  background: linear-gradient(90deg, #FF9AA8 0%, #FFB7C5 100%);
}

/* 响应式适配 */
@media (max-width: 480px) {
  .time-filter {
    flex-direction: column;
  }

  .time-btn {
    flex: 1;
    text-align: center;
  }
}
</style>

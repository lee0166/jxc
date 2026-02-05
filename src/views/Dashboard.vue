<template>
  <div class="dashboard-container">
    <!-- 数据概览卡片 -->
    <div class="stats-cards">
      <div class="stat-card sales">
        <div class="stat-icon">
          <Icon name="sales" :size="24" color="#FFFFFF" />
        </div>
        <div class="stat-info">
          <span class="stat-label">今日销售额</span>
          <span class="stat-value">¥{{ formatNumber(todaySales) }}</span>
          <span class="stat-change" :class="{ positive: salesChange >= 0, negative: salesChange < 0 }">
            {{ salesChange >= 0 ? '+' : '' }}{{ salesChange }}%
          </span>
        </div>
      </div>

      <div class="stat-card profit">
        <div class="stat-icon">
          <Icon name="profit" :size="24" color="#FFFFFF" />
        </div>
        <div class="stat-info">
          <span class="stat-label">今日毛利</span>
          <span class="stat-value">¥{{ formatNumber(todayProfit) }}</span>
          <span class="stat-change" :class="{ positive: profitChange >= 0, negative: profitChange < 0 }">
            {{ profitChange >= 0 ? '+' : '' }}{{ profitChange }}%
          </span>
        </div>
      </div>

      <div class="stat-card inventory">
        <div class="stat-icon">
          <Icon name="inventory" :size="24" color="#FFFFFF" />
        </div>
        <div class="stat-info">
          <span class="stat-label">库存总值</span>
          <span class="stat-value">¥{{ formatNumber(inventoryValue) }}</span>
          <span class="stat-change" :class="{ positive: inventoryChange >= 0, negative: inventoryChange < 0 }">
            {{ inventoryChange >= 0 ? '+' : '' }}{{ inventoryChange }}%
          </span>
        </div>
      </div>
    </div>

    <!-- 快捷操作按钮 -->
    <div class="quick-actions">
      <h3 class="section-title">快捷操作</h3>
      <div class="action-grid">
        <button class="action-item" @click="goTo('/home/product')">
          <div class="action-icon add-product">
            <Icon name="add" :size="28" color="#FFFFFF" />
          </div>
          <span class="action-label">新增商品</span>
        </button>

        <button class="action-item" @click="goTo('/home/inbound')">
          <div class="action-icon inbound">
            <Icon name="inbound" :size="28" color="#FFFFFF" />
          </div>
          <span class="action-label">入库</span>
        </button>

        <button class="action-item" @click="goTo('/home/sales')">
          <div class="action-icon sales">
            <Icon name="sales" :size="28" color="#FFFFFF" />
          </div>
          <span class="action-label">销售</span>
        </button>

        <button class="action-item" @click="goTo('/home/scan')">
          <div class="action-icon scan">
            <Icon name="scan" :size="28" color="#FFFFFF" />
          </div>
          <span class="action-label">扫码</span>
        </button>
      </div>
    </div>

    <!-- 预警信息 -->
    <div class="alert-section" v-if="alerts.length > 0">
      <h3 class="section-title">
        <Icon name="warning" :size="18" color="#FF6B6B" />
        预警信息
        <span class="alert-badge">{{ alerts.length }}</span>
      </h3>
      <div class="alert-list">
        <div class="alert-item" v-for="(alert, index) in alerts" :key="index" :class="alert.type">
          <div class="alert-icon">
            <Icon :name="alert.icon" :size="20" />
          </div>
          <div class="alert-content">
            <span class="alert-title">{{ alert.title }}</span>
            <span class="alert-desc">{{ alert.description }}</span>
          </div>
          <button class="alert-action" @click="handleAlert(alert)">
            去处理
          </button>
        </div>
      </div>
    </div>

    <!-- 最近记录 -->
    <div class="recent-records">
      <h3 class="section-title">最近记录</h3>
      <div class="record-list">
        <div class="record-item" v-for="(record, index) in recentRecords" :key="index">
          <div class="record-icon" :class="record.type">
            <Icon :name="record.icon" :size="20" color="#FFFFFF" />
          </div>
          <div class="record-content">
            <div class="record-header">
              <span class="record-title">{{ record.title }}</span>
              <span class="record-amount" :class="record.type">
                {{ record.type === 'outbound' ? '-' : '+' }}{{ record.quantity }}件
              </span>
            </div>
            <div class="record-footer">
              <span class="record-time">{{ record.time }}</span>
              <span class="record-value">¥{{ formatNumber(record.value) }}</span>
            </div>
          </div>
        </div>

        <div class="empty-records" v-if="recentRecords.length === 0">
          <Icon name="calendar" :size="32" color="#CCCCCC" />
          <p>暂无记录</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../components/Icons/Icon.vue'

export default {
  name: 'Dashboard',
  components: {
    Icon
  },
  setup() {
    const router = useRouter()

    // 统计数据（从API获取）
    const todaySales = ref(0)
    const todayProfit = ref(0)
    const inventoryValue = ref(0)
    const salesChange = ref(0)
    const profitChange = ref(0)
    const inventoryChange = ref(0)

    // 预警信息（从API获取）
    const alerts = ref([])

    // 最近记录（从API获取）
    const recentRecords = ref([])

    // 格式化数字
    const formatNumber = (num) => {
      return num.toLocaleString('zh-CN')
    }

    // 页面跳转
    const goTo = (path) => {
      router.push(path)
    }

    // 处理预警
    const handleAlert = (alert) => {
      router.push(alert.action)
    }

    // 获取仪表板数据
    const fetchDashboardData = async () => {
      try {
        // 获取统计数据
        const statsResponse = await fetch('/api/stats/overview')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          if (statsData.status === 'success') {
            // 更新今日销售额
            todaySales.value = statsData.data.sales.today || 0
            // 更新库存总值
            inventoryValue.value = statsData.data.products.totalValue || 0
            // 计算销售变化（今日 vs 昨日）
            const yesterdaySales = statsData.data.sales.yesterday || 0
            if (yesterdaySales > 0) {
              salesChange.value = parseFloat(((todaySales.value - yesterdaySales) / yesterdaySales * 100).toFixed(1))
            } else {
              salesChange.value = 0
            }
          }
        }

        // 获取毛利数据
        const profitResponse = await fetch('/api/stats/profit/margin')
        if (profitResponse.ok) {
          const profitData = await profitResponse.json()
          if (profitData.status === 'success') {
            todayProfit.value = profitData.data.today.marginAmount || 0
            profitChange.value = profitData.data.today.margin || 0
          }
        }

        // 获取最近记录
        const recordsResponse = await fetch('/api/stats/recent-records?limit=5')
        if (recordsResponse.ok) {
          const recordsData = await recordsResponse.json()
          if (recordsData.status === 'success') {
            recentRecords.value = recordsData.data.map(record => ({
              type: record.type,
              icon: record.icon,
              title: record.title,
              time: record.time,
              quantity: record.quantity,
              value: record.value
            }))
          }
        }

        // 获取预警信息（低库存商品）
        const lowStockResponse = await fetch('/api/products?limit=100')
        if (lowStockResponse.ok) {
          const lowStockData = await lowStockResponse.json()
          if (lowStockData.status === 'success') {
            const lowStockProducts = lowStockData.data.filter(product => 
              product.stock > 0 && product.stock < product.stockAlert
            )
            const zeroStockProducts = lowStockData.data.filter(product => 
              product.stock === 0
            )
            
            alerts.value = []
            
            if (lowStockProducts.length > 0) {
              alerts.value.push({
                type: 'warning',
                icon: 'warning',
                title: '库存不足预警',
                description: `有 ${lowStockProducts.length} 款商品库存低于预警值`,
                action: '/home/inventory'
              })
            }
            
            if (zeroStockProducts.length > 0) {
              alerts.value.push({
                type: 'error',
                icon: 'error',
                title: '缺货预警',
                description: `有 ${zeroStockProducts.length} 款商品已缺货`,
                action: '/home/inventory'
              })
            }
          }
        }
      } catch (error) {
        console.error('获取仪表板数据失败:', error)
      }
    }

    onMounted(() => {
      fetchDashboardData()
    })

    return {
      todaySales,
      todayProfit,
      inventoryValue,
      salesChange,
      profitChange,
      inventoryChange,
      alerts,
      recentRecords,
      formatNumber,
      goTo,
      handleAlert
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 16px;
  padding-bottom: 80px;
}

/* 数据概览卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(255, 183, 197, 0.15);
  border: 1px solid rgba(255, 183, 197, 0.2);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 183, 197, 0.25);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card.sales .stat-icon {
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
}

.stat-card.profit .stat-icon {
  background: linear-gradient(135deg, #A8E6CF 0%, #A8D8EA 100%);
}

.stat-card.inventory .stat-icon {
  background: linear-gradient(135deg, #A8D8EA 0%, #D4A5E0 100%);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #888888;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #4A4A4A;
}

.stat-change {
  font-size: 11px;
  font-weight: 500;
}

.stat-change.positive {
  color: #52C41A;
}

.stat-change.negative {
  color: #FF6B6B;
}

/* 快捷操作 */
.quick-actions {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #4A4A4A;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.action-item {
  background: #FFFFFF;
  border: none;
  border-radius: 16px;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 183, 197, 0.15);
}

.action-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 183, 197, 0.25);
}

.action-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon.add-product {
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
}

.action-icon.inbound {
  background: linear-gradient(135deg, #A8E6CF 0%, #A8D8EA 100%);
}

.action-icon.sales {
  background: linear-gradient(135deg, #A8D8EA 0%, #D4A5E0 100%);
}

.action-icon.scan {
  background: linear-gradient(135deg, #D4A5E0 0%, #FFB7C5 100%);
}

.action-label {
  font-size: 13px;
  color: #4A4A4A;
  font-weight: 500;
}

/* 预警信息 */
.alert-section {
  margin-bottom: 20px;
}

.alert-badge {
  background: #FF6B6B;
  color: #FFFFFF;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: auto;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(255, 183, 197, 0.1);
  border-left: 4px solid;
}

.alert-item.warning {
  border-left-color: #FF6B6B;
}

.alert-item.info {
  border-left-color: #A8D8EA;
}

.alert-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alert-item.warning .alert-icon {
  background: #FFE4E9;
  color: #FF6B6B;
}

.alert-item.info .alert-icon {
  background: #E8F4F8;
  color: #A8D8EA;
}

.alert-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.alert-title {
  font-size: 14px;
  font-weight: 500;
  color: #4A4A4A;
}

.alert-desc {
  font-size: 12px;
  color: #888888;
}

.alert-action {
  padding: 6px 12px;
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.alert-action:hover {
  box-shadow: 0 4px 12px rgba(255, 183, 197, 0.4);
}

/* 最近记录 */
.recent-records {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(255, 183, 197, 0.15);
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #FFFBF5 0%, #FFFFFF 100%);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.record-item:hover {
  background: #FFE4E9;
}

.record-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.record-icon.inbound {
  background: linear-gradient(135deg, #A8E6CF 0%, #A8D8EA 100%);
}

.record-icon.outbound {
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
}

.record-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-title {
  font-size: 14px;
  font-weight: 500;
  color: #4A4A4A;
}

.record-amount {
  font-size: 14px;
  font-weight: 600;
}

.record-amount.inbound {
  color: #52C41A;
}

.record-amount.outbound {
  color: #FF6B6B;
}

.record-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-time {
  font-size: 12px;
  color: #888888;
}

.record-value {
  font-size: 13px;
  color: #4A4A4A;
  font-weight: 500;
}

.empty-records {
  text-align: center;
  padding: 40px 20px;
  color: #888888;
}

.empty-records p {
  margin-top: 8px;
  font-size: 14px;
}

/* 响应式适配 */
@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .stat-card {
    padding: 10px 8px;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
  }

  .stat-icon .icon-svg {
    width: 20px;
    height: 20px;
  }

  .stat-label {
    font-size: 11px;
  }

  .stat-value {
    font-size: 14px;
  }

  .stat-change {
    font-size: 10px;
  }

  .action-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .action-item {
    padding: 12px 4px;
  }

  .action-icon {
    width: 44px;
    height: 44px;
  }

  .action-label {
    font-size: 11px;
  }
}
</style>

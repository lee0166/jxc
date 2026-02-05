<template>
  <div class="records-container">
    <!-- 模块头部 -->
    <div class="records-header">
      <h2>流水记录</h2>
      <button class="export-btn" @click="exportAllRecords">
        📤 导出全部
      </button>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <div class="filter-group">
        <label class="filter-label">操作类型</label>
        <select class="filter-select" v-model="filters.type">
          <option value="">全部类型</option>
          <option value="inbound">入库</option>
          <option value="sales">销售</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">时间范围</label>
        <select class="filter-select" v-model="filters.timeRange">
          <option value="today">今日</option>
          <option value="week">本周</option>
          <option value="month">本月</option>
          <option value="quarter">本季度</option>
          <option value="year">本年</option>
          <option value="custom">自定义</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">商品信息</label>
        <input 
          type="text" 
          class="filter-input" 
          v-model="filters.productKeyword"
          placeholder="条码/货号/款式"
        />
      </div>

      <div class="filter-actions">
        <button class="search-btn" @click="searchRecords">
          🔍 搜索
        </button>
        <button class="reset-btn" @click="resetFilters">
          重置
        </button>
      </div>
    </div>

    <!-- 自定义时间范围（展开） -->
    <div class="custom-time-section" v-if="filters.timeRange === 'custom'">
      <div class="time-inputs">
        <div class="time-group">
          <label>开始日期</label>
          <input 
            type="date" 
            class="date-input" 
            v-model="customTime.start"
          />
        </div>
        <div class="time-group">
          <label>结束日期</label>
          <input 
            type="date" 
            class="date-input" 
            v-model="customTime.end"
          />
        </div>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-section">
      <div class="stats-card">
        <div class="stats-icon">📋</div>
        <div class="stats-content">
          <h3>记录总数</h3>
          <p class="stats-value">{{ filteredRecords.length }}</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-icon">📥</div>
        <div class="stats-content">
          <h3>入库记录</h3>
          <p class="stats-value">{{ inboundCount }}</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-icon">📤</div>
        <div class="stats-content">
          <h3>销售记录</h3>
          <p class="stats-value">{{ salesCount }}</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-icon">💰</div>
        <div class="stats-content">
          <h3>总金额</h3>
          <p class="stats-value">¥{{ totalAmount.toFixed(2) }}</p>
        </div>
      </div>
    </div>

    <!-- 流水列表 -->
    <div class="records-list">
      <div 
        class="record-item" 
        v-for="record in paginatedRecords" 
        :key="record._id"
        :class="{
          'inbound': record.type === 'inbound',
          'sales': record.type === 'sales'
        }"
        @click="showRecordDetail(record)"
      >
        <div class="record-header">
          <div class="record-type" :class="record.type">
            {{ record.type === 'inbound' ? '入库' : '销售' }}
          </div>
          <div class="record-time">
            {{ formatDateTime(record.created_at) }}
          </div>
        </div>

        <div class="record-product">
          {{ record.product_info.style }} · {{ record.product_info.color }} · {{ record.product_info.size }}
        </div>

        <div class="record-details">
          <div class="detail-row">
            <span class="detail-label">单据编号:</span>
            <span class="detail-value">{{ record.record_no }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">数量:</span>
            <span class="detail-value">{{ record.quantity }}双</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">单价:</span>
            <span class="detail-value">¥{{ getPriceValue(record).toFixed(2) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">总金额:</span>
            <span class="detail-value total">¥{{ getTotalValue(record).toFixed(2) }}</span>
          </div>
        </div>

        <div class="record-footer">
          <div class="record-operator">
            操作人: {{ record.operator }}
          </div>
          <div class="record-status" :class="record.status">
            {{ record.status }}
          </div>
        </div>

        <div class="record-remark" v-if="record.remark">
          <span class="remark-label">备注:</span>
          <span class="remark-content">{{ record.remark }}</span>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-if="filteredRecords.length === 0">
        <div class="empty-icon">📋</div>
        <p class="empty-text">暂无流水记录</p>
        <p class="empty-subtext">请调整筛选条件后重试</p>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="filteredRecords.length > 0">
      <button 
        class="page-btn" 
        :disabled="currentPage === 1"
        @click="currentPage--"
      >
        上一页
      </button>
      <span class="page-info">
        {{ currentPage }} / {{ totalPages }}
      </span>
      <button 
        class="page-btn" 
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >
        下一页
      </button>
    </div>

    <!-- 记录详情弹窗 -->
    <div class="detail-overlay" v-if="showDetail" @click.self="showDetail = false">
      <div class="detail-container">
        <div class="detail-header">
          <h3>记录详情</h3>
          <button class="close-btn" @click="showDetail = false">×</button>
        </div>
        
        <div class="detail-content" v-if="selectedRecord">
          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="detail-grid">
              <div class="grid-item">
                <span class="item-label">操作类型:</span>
                <span class="item-value" :class="selectedRecord.type">
                  {{ selectedRecord.type === 'inbound' ? '入库' : '销售' }}
                </span>
              </div>
              <div class="grid-item">
                <span class="item-label">单据编号:</span>
                <span class="item-value">{{ selectedRecord.record_no }}</span>
              </div>
              <div class="grid-item">
                <span class="item-label">操作时间:</span>
                <span class="item-value">{{ formatDateTime(selectedRecord.created_at) }}</span>
              </div>
              <div class="grid-item">
                <span class="item-label">操作人:</span>
                <span class="item-value">{{ selectedRecord.operator }}</span>
              </div>
              <div class="grid-item">
                <span class="item-label">状态:</span>
                <span class="item-value" :class="selectedRecord.status">
                  {{ selectedRecord.status }}
                </span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>商品信息</h4>
            <div class="product-info">
              <div class="product-name">
                {{ selectedRecord.product_info.style }} · {{ selectedRecord.product_info.color }} · {{ selectedRecord.product_info.size }}
              </div>
              <div class="product-codes">
                <span v-if="selectedRecord.barcode">条码: {{ selectedRecord.barcode }}</span>
                <span v-if="selectedRecord.custom_code">货号: {{ selectedRecord.custom_code }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>交易信息</h4>
            <div class="transaction-info">
              <div class="info-row">
                <span class="info-label">数量:</span>
                <span class="info-value">{{ selectedRecord.quantity }}双</span>
              </div>
              <div class="info-row">
                <span class="info-label">单价:</span>
                <span class="info-value">¥{{ getPriceValue(selectedRecord).toFixed(2) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">总金额:</span>
                <span class="info-value total">¥{{ getTotalValue(selectedRecord).toFixed(2) }}</span>
              </div>
              <div class="info-row" v-if="selectedRecord.type === 'sales'">
                <span class="info-label">收款方式:</span>
                <span class="info-value">{{ selectedRecord.payment_method }}</span>
              </div>
              <div class="info-row" v-if="selectedRecord.type === 'sales'">
                <span class="info-label">毛利:</span>
                <span class="info-value profit">¥{{ getProfitValue(selectedRecord).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="selectedRecord.remark">
            <h4>备注信息</h4>
            <div class="remark-info">
              {{ selectedRecord.remark }}
            </div>
          </div>

          <div class="detail-actions">
            <button class="print-btn" @click="printRecord(selectedRecord)">
              🖨️ 打印单据
            </button>
            <button class="export-btn" @click="exportSingleRecord(selectedRecord)">
              📤 导出详情
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'

export default {
  name: 'Records',
  setup() {
    // 响应式数据
    const filters = reactive({
      type: '',
      timeRange: 'month',
      productKeyword: '',
      status: ''
    })

    const customTime = reactive({
      start: '',
      end: ''
    })

    const currentPage = ref(1)
    const pageSize = ref(10)
    const showDetail = ref(false)
    const selectedRecord = ref(null)

    // 流水记录数据
    const recordsData = ref([])

    // 计算属性
    const filteredRecords = computed(() => {
      let filtered = recordsData.value

      // 按类型筛选
      if (filters.type) {
        filtered = filtered.filter(record => record.type === filters.type)
      }

      // 按商品关键字筛选
      if (filters.productKeyword) {
        const keyword = filters.productKeyword.toLowerCase()
        filtered = filtered.filter(record => {
          return (
            record.barcode?.toLowerCase().includes(keyword) ||
            record.custom_code?.toLowerCase().includes(keyword) ||
            record.product_info?.style?.toLowerCase().includes(keyword) ||
            record.product_info?.color?.toLowerCase().includes(keyword)
          )
        })
      }

      // 按时间范围筛选
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(todayStart)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
      const yearStart = new Date(now.getFullYear(), 0, 1)

      switch (filters.timeRange) {
        case 'today':
          filtered = filtered.filter(record => new Date(record.created_at) >= todayStart)
          break
        case 'week':
          filtered = filtered.filter(record => new Date(record.created_at) >= weekStart)
          break
        case 'month':
          filtered = filtered.filter(record => new Date(record.created_at) >= monthStart)
          break
        case 'quarter':
          filtered = filtered.filter(record => new Date(record.created_at) >= quarterStart)
          break
        case 'year':
          filtered = filtered.filter(record => new Date(record.created_at) >= yearStart)
          break
        case 'custom':
          if (customTime.start && customTime.end) {
            const startDate = new Date(customTime.start)
            const endDate = new Date(customTime.end)
            endDate.setHours(23, 59, 59, 999)
            filtered = filtered.filter(record => {
              const recordDate = new Date(record.created_at)
              return recordDate >= startDate && recordDate <= endDate
            })
          }
          break
      }

      // 按时间倒序排序
      return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    })

    // 分页数据
    const paginatedRecords = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredRecords.value.slice(start, end)
    })

    // 总页数
    const totalPages = computed(() => {
      return Math.ceil(filteredRecords.value.length / pageSize.value)
    })

    // 统计数据
    const inboundCount = computed(() => {
      return filteredRecords.value.filter(record => record.type === 'inbound').length
    })

    const salesCount = computed(() => {
      return filteredRecords.value.filter(record => record.type === 'sales').length
    })

    const totalAmount = computed(() => {
      return filteredRecords.value.reduce((total, record) => {
        return total + getTotalValue(record)
      }, 0)
    })

    // 方法
    const searchRecords = () => {
      currentPage.value = 1
      // 搜索逻辑已在computed中实现
    }

    const resetFilters = () => {
      filters.type = ''
      filters.timeRange = 'month'
      filters.productKeyword = ''
      filters.status = ''
      customTime.start = ''
      customTime.end = ''
      currentPage.value = 1
    }

    const showRecordDetail = (record) => {
      selectedRecord.value = record
      showDetail.value = true
    }

    const getPriceValue = (record) => {
      return record.type === 'inbound' ? record.price : record.sale_price
    }

    const getTotalValue = (record) => {
      return record.type === 'inbound' ? record.total_amount : record.total_sale
    }

    const getProfitValue = (record) => {
      return record.type === 'sales' ? record.total_profit : 0
    }

    const formatDateTime = (date) => {
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }

    const exportAllRecords = () => {
      alert('全部流水记录导出功能已触发')
    }

    const exportSingleRecord = (record) => {
      alert('单条记录导出功能已触发')
    }

    const printRecord = (record) => {
      alert('单据打印功能已触发')
    }

    return {
      filters,
      customTime,
      currentPage,
      pageSize,
      showDetail,
      selectedRecord,
      filteredRecords,
      paginatedRecords,
      totalPages,
      inboundCount,
      salesCount,
      totalAmount,
      searchRecords,
      resetFilters,
      showRecordDetail,
      getPriceValue,
      getTotalValue,
      getProfitValue,
      formatDateTime,
      exportAllRecords,
      exportSingleRecord,
      printRecord
    }
  }
}
</script>

<style scoped>
.records-container {
  padding: 16px;
  padding-bottom: 70px;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.records-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.export-btn {
  padding: 8px 16px;
  background-color: #1890ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.export-btn:hover {
  background-color: #40a9ff;
}

/* 筛选区域 */
.filter-section {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.filter-select,
.filter-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.filter-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.search-btn {
  flex: 2;
  padding: 10px;
  background-color: #1890ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reset-btn {
  flex: 1;
  padding: 10px;
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* 自定义时间 */
.custom-time-section {
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.time-inputs {
  display: flex;
  gap: 12px;
}

.time-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-group label {
  font-size: 12px;
  color: #666;
}

.date-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

/* 统计卡片 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stats-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
}

.stats-icon {
  font-size: 24px;
}

.stats-content h3 {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stats-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 流水列表 */
.records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.record-item {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #1890ff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.record-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.record-item.inbound {
  border-left-color: #52c41a;
}

.record-item.sales {
  border-left-color: #fa8c16;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
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

.record-product {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
  line-height: 1.4;
}

.record-details {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: #666;
}

.detail-value {
  color: #333;
  font-weight: 500;
}

.detail-value.total {
  color: #1890ff;
  font-weight: 600;
}

.record-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.record-operator {
  color: #999;
}

.record-status {
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}

.record-status.有效 {
  background-color: #f6ffed;
  color: #52c41a;
}

.record-status.无效 {
  background-color: #fff2f0;
  color: #f5222d;
}

.record-remark {
  padding: 8px 12px;
  background-color: #f0f0f0;
  border-radius: 6px;
  font-size: 12px;
}

.remark-label {
  color: #666;
  margin-right: 4px;
}

.remark-content {
  color: #333;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.page-btn {
  padding: 8px 16px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:disabled {
  background-color: #f9f9f9;
  color: #ccc;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 14px;
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
  max-width: 500px;
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
  background-color: transparent;
  border: none;
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
  flex: 1;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.item-label {
  color: #666;
  font-size: 12px;
}

.item-value {
  color: #333;
  font-weight: 500;
}

.item-value.inbound {
  color: #52c41a;
}

.item-value.sales {
  color: #fa8c16;
}

.item-value.有效 {
  color: #52c41a;
}

.item-value.无效 {
  color: #f5222d;
}

.product-info {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.product-codes {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #999;
  flex-wrap: wrap;
}

.transaction-info {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.info-label {
  color: #666;
}

.info-value {
  color: #333;
  font-weight: 500;
}

.info-value.total {
  color: #1890ff;
  font-weight: 600;
}

.info-value.profit {
  color: #52c41a;
  font-weight: 600;
}

.remark-info {
  background-color: #f0f0f0;
  border-radius: 6px;
  padding: 12px;
  font-size: 13px;
  color: #333;
  line-height: 1.4;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.print-btn,
.export-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.print-btn {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.export-btn {
  background-color: #1890ff;
  color: #fff;
}

/* 响应式适配 */
@media (max-width: 480px) {
  .stats-section {
    grid-template-columns: 1fr;
  }

  .filter-section {
    gap: 8px;
  }

  .time-inputs {
    flex-direction: column;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-actions {
    flex-direction: column;
  }
}
</style>
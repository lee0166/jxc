<template>
  <div class="config-container">
    <!-- 模块头部 -->
    <div class="config-header">
      <h2>系统配置</h2>
    </div>

    <!-- 应用信息卡片 - 始终显示在顶部 -->
    <div class="about-card app-header-card">
      <div class="app-logo">
        <Icon name="shop" size="24" />
      </div>
      <h2>{{ aboutInfo.appName }}</h2>
      <p class="app-version">{{ aboutInfo.version }}</p>
      <p class="app-description">{{ aboutInfo.description }}</p>
    </div>

    <!-- 配置菜单 -->
    <div class="config-menu">
      <button 
        class="menu-item" 
        :class="{ active: activeMenu === 'system' }"
        @click="activeMenu = 'system'"
      >
        <span class="menu-icon"><Icon name="computer" size="18" /></span>
        <span class="menu-text">系统信息</span>
      </button>
      <button 
        class="menu-item" 
        :class="{ active: activeMenu === 'user' }"
        @click="activeMenu = 'user'"
      >
        <span class="menu-icon"><Icon name="user" size="18" /></span>
        <span class="menu-text">用户管理</span>
      </button>
      <button 
        class="menu-item" 
        :class="{ active: activeMenu === 'settings' }"
        @click="activeMenu = 'settings'"
      >
        <span class="menu-icon"><Icon name="setting" size="18" /></span>
        <span class="menu-text">系统设置</span>
      </button>
      <button 
        class="menu-item" 
        :class="{ active: activeMenu === 'backup' }"
        @click="activeMenu = 'backup'"
      >
        <span class="menu-icon"><Icon name="database" size="18" /></span>
        <span class="menu-text">数据备份</span>
      </button>
      <button 
        class="menu-item" 
        :class="{ active: activeMenu === 'about' }"
        @click="activeMenu = 'about'"
      >
        <span class="menu-icon"><Icon name="info" size="18" /></span>
        <span class="menu-text">关于系统</span>
      </button>
    </div>

    <!-- 系统信息 -->
    <div class="config-content" v-if="activeMenu === 'system'">
      <div class="system-info">
        <div class="info-card">
          <h3>系统状态</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">系统版本</span>
              <span class="info-value">{{ systemInfo.version }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">运行状态</span>
              <span class="info-value status online">{{ systemInfo.status }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">上次登录</span>
              <span class="info-value">{{ formatDateTime(systemInfo.lastLogin) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">登录用户</span>
              <span class="info-value">{{ systemInfo.currentUser }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">服务器时间</span>
              <span class="info-value">{{ formatDateTime(new Date()) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">数据库状态</span>
              <span class="info-value status online">{{ systemInfo.dbStatus }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- 用户管理 -->
    <div class="config-content" v-if="activeMenu === 'user'">
      <div class="user-management">
        <div class="section-header">
          <h3>用户列表</h3>
          <button class="add-btn" @click="showAddUser = true">
            <Icon name="add" size="12" />
            <span>添加用户</span>
          </button>
        </div>

        <div class="user-list">
          <div 
            class="user-item" 
            v-for="user in users" 
            :key="user._id"
            :class="{ 'current-user': user.username === currentUser.username }"
          >
            <div class="user-info">
              <div class="user-avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
              <div class="user-details">
                <h4>{{ user.username }}</h4>
                <p class="user-role">{{ user.role === 'admin' ? '管理员' : '普通用户' }}</p>
                <p class="user-status">{{ user.status === 'active' ? '活跃' : '禁用' }}</p>
              </div>
            </div>
            <div class="user-actions">
              <button 
                class="action-btn edit" 
                @click="editUser(user)"
                :disabled="user.username === currentUser.username"
              >
                编辑
              </button>
              <button 
                class="action-btn delete" 
                @click="deleteUser(user)"
                :disabled="user.username === currentUser.username"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        <!-- 添加用户弹窗 -->
        <div class="modal-overlay" v-if="showAddUser" @click.self="showAddUser = false">
          <div class="modal-container">
            <div class="modal-header">
              <h3>添加用户</h3>
              <button class="close-btn" @click="showAddUser = false">×</button>
            </div>
            <div class="modal-content">
              <div class="form-group">
                <label>用户名</label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="newUser.username"
                  placeholder="请输入用户名"
                />
              </div>
              <div class="form-group">
                <label>密码</label>
                <input 
                  type="password" 
                  class="form-input" 
                  v-model="newUser.password"
                  placeholder="请输入密码"
                />
              </div>
              <div class="form-group">
                <label>角色</label>
                <select class="form-select" v-model="newUser.role">
                  <option value="admin">管理员</option>
                  <option value="user">普通用户</option>
                </select>
              </div>
              <div class="form-group">
                <label>状态</label>
                <select class="form-select" v-model="newUser.status">
                  <option value="active">活跃</option>
                  <option value="disabled">禁用</option>
                </select>
              </div>
            </div>
            <div class="modal-actions">
              <button class="cancel-btn" @click="showAddUser = false">取消</button>
              <button class="confirm-btn" @click="addUser">确认添加</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 系统设置 -->
    <div class="config-content" v-if="activeMenu === 'settings'">
      <div class="settings-form">
        <div class="form-card">
          <h3>库存设置</h3>
          <div class="form-group">
            <label>默认库存预警值</label>
            <input 
              type="number" 
              class="form-input" 
              v-model.number="settings.inventoryAlert"
              min="1"
              max="100"
            />
            <p class="form-hint">当商品库存低于此值时会显示预警</p>
          </div>
          <div class="form-group">
            <label>自动补货建议倍数</label>
            <input 
              type="number" 
              class="form-input" 
              v-model.number="settings.replenishMultiplier"
              min="1"
              max="5"
              step="0.5"
            />
            <p class="form-hint">建议补货量 = 预警值 × 此倍数</p>
          </div>
        </div>

        <div class="form-card">
          <h3>销售设置</h3>
          <div class="form-group">
            <label>默认收款方式</label>
            <select class="form-select" v-model="settings.defaultPaymentMethod">
              <option value="微信">微信</option>
              <option value="支付宝">支付宝</option>
              <option value="现金">现金</option>
            </select>
          </div>
          <div class="form-group">
            <label>允许低于成本价销售</label>
            <div class="toggle-switch">
              <input 
                type="checkbox" 
                id="allowNegativeProfit"
                v-model="settings.allowNegativeProfit"
              />
              <label for="allowNegativeProfit">{{ settings.allowNegativeProfit ? '允许' : '禁止' }}</label>
            </div>
          </div>
        </div>

        <div class="form-card">
          <h3>系统设置</h3>
          <div class="form-group">
            <label>语言设置</label>
            <select class="form-select" v-model="settings.language">
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
          <div class="form-group">
            <label>自动备份频率</label>
            <select class="form-select" v-model="settings.backupFrequency">
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
              <option value="manual">手动</option>
            </select>
          </div>
        </div>

        <div class="form-actions">
          <button class="save-btn" @click="saveSettings">保存设置</button>
          <button class="reset-btn" @click="resetSettings">恢复默认</button>
        </div>
      </div>
    </div>

    <!-- 数据备份 -->
    <div class="config-content" v-if="activeMenu === 'backup'">
      <div class="backup-section">
        <div class="backup-card">
          <h3>手动备份</h3>
          <p class="backup-hint">创建当前系统数据的完整备份</p>
          <button class="backup-btn" @click="createBackup">
            <Icon name="download" size="16" />
            <span>创建备份</span>
          </button>
        </div>

        <div class="backup-card">
          <h3>备份记录</h3>
          <div class="backup-list">
            <div 
              class="backup-item" 
              v-for="(backup, index) in backupRecords" 
              :key="index"
            >
              <div class="backup-info">
                <h4>{{ backup.filename }}</h4>
                <p class="backup-time">{{ formatDateTime(backup.createdAt) }}</p>
                <p class="backup-size">{{ backup.size }}</p>
              </div>
              <div class="backup-actions">
                <button class="action-btn restore" @click="restoreBackup(backup)">
                  恢复
                </button>
                <button class="action-btn download" @click="downloadBackup(backup)">
                  下载
                </button>
                <button class="action-btn delete" @click="deleteBackup(backup)">
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="backup-card danger-zone">
          <h3>⚠️ 危险操作</h3>
          <p class="danger-hint">清空数据库将删除所有商品、库存、入库和销售记录，此操作不可恢复！</p>
          <button class="clear-database-btn" @click="clearDatabase">
            <Icon name="warning" size="16" />
            <span>清空数据库</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 关于系统 -->
    <div class="config-content" v-if="activeMenu === 'about'">
      <div class="about-section">
        <div class="about-card">
          <h3>系统信息</h3>
          <div class="about-info">
            <div class="info-row">
              <span class="info-label">开发团队</span>
              <span class="info-value">{{ aboutInfo.team }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">联系邮箱</span>
              <span class="info-value">{{ aboutInfo.email }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">官方网站</span>
              <span class="info-value">{{ aboutInfo.website }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">更新时间</span>
              <span class="info-value">{{ aboutInfo.updateTime }}</span>
            </div>
          </div>
        </div>

        <div class="about-card">
          <h3>技术栈</h3>
          <div class="tech-stack">
            <div class="tech-item">Vue 3</div>
            <div class="tech-item">Vue Router</div>
            <div class="tech-item">JavaScript</div>
            <div class="tech-item">HTML5</div>
            <div class="tech-item">CSS3</div>
            <div class="tech-item">MongoDB</div>
            <div class="tech-item">Node.js</div>
          </div>
        </div>

        <div class="about-card">
          <h3>许可证</h3>
          <p class="license-info">{{ aboutInfo.license }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import Icon from '../components/Icons/Icon.vue'

export default {
  name: 'Config',
  components: {
    Icon
  },
  setup() {
    // 响应式数据
    const activeMenu = ref('system')
    const showAddUser = ref(false)

    // 系统信息（从API获取）
    const systemInfo = reactive({
      version: '-',
      status: '-',
      lastLogin: null,
      currentUser: '-',
      dbStatus: '-'
    })

    // 系统统计
    const systemStats = reactive({
      products: 0,
      inventory: 0,
      sales: 0,
      inbound: 0
    })

    // 用户数据
    const users = ref([])

    // 当前用户（从localStorage或API获取）
    const currentUser = reactive({
      username: localStorage.getItem('username') || '-',
      role: 'admin'
    })

    // 新用户表单
    const newUser = reactive({
      username: '',
      password: '',
      role: 'user',
      status: 'active'
    })

    // 系统设置
    const settings = reactive({
      // 库存设置
      inventoryAlert: 10,
      replenishMultiplier: 2,
      // 销售设置
      defaultPaymentMethod: '微信',
      allowNegativeProfit: false,
      // 系统设置
      language: 'zh-CN',
      backupFrequency: 'weekly'
    })

    // 备份记录
    const backupRecords = ref([])

    // 关于系统（从配置文件或API获取）
    const aboutInfo = reactive({
      appName: '村霸管理系统',
      version: '-',
      description: '柳柳家的鞋店日进斗金系统',
      team: '冬月南山',
      email: 'lzn1115@iCloud.com',
      website: '-',
      updateTime: '2026年1月',
      license: '-'
    })

    // 方法
    const formatDateTime = (date) => {
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }

    const editUser = (user) => {
      alert(`编辑用户: ${user.username}`)
    }

    const deleteUser = (user) => {
      if (confirm(`确定要删除用户 ${user.username} 吗？`)) {
        const index = users.value.findIndex(u => u._id === user._id)
        if (index > -1) {
          users.value.splice(index, 1)
          alert('用户删除成功')
        }
      }
    }

    const addUser = async () => {
      if (!newUser.username || !newUser.password) {
        alert('请填写用户名和密码')
        return
      }

      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: newUser.username,
            password: newUser.password,
            role: newUser.role,
            status: newUser.status
          })
        })

        const data = await response.json()
        if (data.status === 'success') {
          // 重置表单
          newUser.username = ''
          newUser.password = ''
          newUser.role = 'user'
          newUser.status = 'active'

          showAddUser.value = false
          alert('用户添加成功')

          // 刷新用户列表
          fetchUsers()
        } else {
          alert('添加失败：' + data.message)
        }
      } catch (error) {
        console.error('添加用户失败:', error)
        alert('添加用户失败：' + error.message)
      }
    }

    const saveSettings = () => {
      // 保存到 localStorage
      localStorage.setItem('settings', JSON.stringify(settings))
      alert('系统设置已保存')
    }

    const resetSettings = () => {
      if (confirm('确定要恢复默认设置吗？')) {
        settings.inventoryAlert = 10
        settings.replenishMultiplier = 2
        settings.defaultPaymentMethod = '微信'
        settings.allowNegativeProfit = false
        settings.language = 'zh-CN'
        settings.backupFrequency = 'weekly'
        alert('默认设置已恢复')
      }
    }

    const createBackup = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/backup', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        const data = await response.json()
        if (data.status === 'success') {
          alert(`备份创建成功！\n文件名：${data.data.filename}\n大小：${data.data.size}\n包含记录：商品${data.data.recordCount.products}条，入库${data.data.recordCount.inbounds}条，销售${data.data.recordCount.sales}条，库存${data.data.recordCount.inventories}条`)
          // 刷新备份列表
          fetchBackupRecords()
        } else {
          alert('备份创建失败：' + data.message)
        }
      } catch (error) {
        console.error('创建备份失败:', error)
        alert('创建备份失败：' + error.message)
      }
    }

    const fetchBackupRecords = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/backup', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()
        if (data.status === 'success') {
          backupRecords.value = data.data.map((backup, index) => ({
            _id: index,
            filename: backup.filename,
            size: backup.size,
            createdAt: backup.createdAt
          }))
        }
      } catch (error) {
        console.error('获取备份列表失败:', error)
      }
    }

    const restoreBackup = (backup) => {
      alert('数据恢复功能暂未实现，请手动导入CSV文件')
    }

    const downloadBackup = (backup) => {
      try {
        const token = localStorage.getItem('token')
        const downloadUrl = `/api/backup/${encodeURIComponent(backup.filename)}/download`
        
        // 创建临时链接下载
        fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
          .then(response => {
            if (!response.ok) {
              throw new Error('下载失败')
            }
            return response.blob()
          })
          .then(blob => {
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = backup.filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
          })
          .catch(error => {
            console.error('下载备份失败:', error)
            alert('下载备份失败：' + error.message)
          })
      } catch (error) {
        console.error('下载备份失败:', error)
        alert('下载备份失败：' + error.message)
      }
    }

    const deleteBackup = async (backup) => {
      if (confirm(`确定要删除备份 ${backup.filename} 吗？`)) {
        try {
          const token = localStorage.getItem('token')
          const response = await fetch(`/api/backup/${encodeURIComponent(backup.filename)}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          const data = await response.json()
          if (data.status === 'success') {
            alert('备份删除成功')
            // 刷新备份列表
            fetchBackupRecords()
          } else {
            alert('删除失败：' + data.message)
          }
        } catch (error) {
          console.error('删除备份失败:', error)
          alert('删除备份失败：' + error.message)
        }
      }
    }

    const clearDatabase = async () => {
      // 第一次确认
      if (!confirm('⚠️ 警告：您确定要清空数据库吗？\n\n此操作将删除所有数据，包括：\n- 所有商品信息\n- 所有库存记录\n- 所有入库记录\n- 所有销售记录\n\n此操作不可恢复！')) {
        return
      }

      // 第二次确认
      if (!confirm('⚠️ 最后确认：您真的要清空所有数据吗？\n\n此操作将永久删除所有业务数据，无法恢复！\n\n点击"确定"继续，点击"取消"放弃操作。')) {
        alert('操作已取消')
        return
      }

      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/system/clear-database', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        const data = await response.json()
        if (data.status === 'success') {
          alert('数据库已清空')
          // 刷新页面数据
          window.location.reload()
        } else {
          alert('清空失败：' + data.message)
        }
      } catch (error) {
        console.error('清空数据库失败:', error)
        alert('清空数据库失败：' + error.message)
      }
    }

    // 获取用户列表
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        if (data.status === 'success') {
          users.value = data.data.map(user => ({
            _id: user.id || user._id,
            username: user.username,
            role: user.role,
            status: 'active',
            created_at: user.createdAt || new Date()
          }))
        }
      } catch (error) {
        console.error('获取用户列表失败:', error)
      }
    }

    // 初始化
    onMounted(() => {
      // 从 localStorage 获取登录时间
      const loginTime = localStorage.getItem('loginTime')
      if (loginTime) {
        systemInfo.lastLogin = new Date(loginTime)
      }

      // 从 localStorage 读取设置
      const savedSettings = localStorage.getItem('settings')
      if (savedSettings) {
        try {
          Object.assign(settings, JSON.parse(savedSettings))
        } catch (e) {
          console.error('读取设置失败:', e)
        }
      }

      // 获取用户列表
      fetchUsers()

      // 获取备份列表
      fetchBackupRecords()
    })

    return {
      activeMenu,
      showAddUser,
      systemInfo,
      systemStats,
      users,
      currentUser,
      newUser,
      settings,
      backupRecords,
      aboutInfo,
      formatDateTime,
      editUser,
      deleteUser,
      addUser,
      saveSettings,
      resetSettings,
      createBackup,
      fetchBackupRecords,
      restoreBackup,
      downloadBackup,
      deleteBackup,
      clearDatabase
    }
  }
}
</script>

<style scoped>
.config-container {
  padding-bottom: 70px;
}

.config-header {
  margin-bottom: 20px;
}

.config-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

/* 配置菜单 */
.config-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: #f5f5f5;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.menu-item:hover {
  background-color: #f0f0f0;
}

.menu-item.active {
  background: linear-gradient(135deg, #FFB7C5 0%, #A8E6CF 100%);
  color: #fff;
}

.menu-icon {
  font-size: 18px;
}

/* 系统信息 */
.system-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.info-card h3 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #666;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.status.online {
  color: #52c41a;
}

.status.offline {
  color: #f5222d;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stats-item {
  text-align: center;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.stats-number {
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(135deg, #FFB7C5 0%, #A8D8EA 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 12px;
  color: #666;
}

/* 用户管理 */
.user-management {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.add-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #A8E6CF 0%, #A8D8EA 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #1890ff;
}

.user-item.current-user {
  border-left-color: #52c41a;
  background-color: #f6ffed;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #FFB7C5 0%, #A8D8EA 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.user-details h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.user-role, .user-status {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.user-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.edit {
  background: linear-gradient(135deg, #A8D8EA 0%, #A8E6CF 100%);
  color: #fff;
  border-color: transparent;
}

.action-btn.delete {
  background-color: #fff0f0;
  color: #FFB7C5;
  border-color: #FFB7C5;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 模态框 */
.modal-overlay {
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

.modal-container {
  background-color: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
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

.modal-content {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.form-input, .form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.form-hint {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.cancel-btn {
  flex: 1;
  padding: 10px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.confirm-btn {
  flex: 1;
  padding: 10px;
  background: linear-gradient(135deg, #FFB7C5 0%, #A8E6CF 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
}

/* 系统设置 */
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-card h3 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-switch input[type="checkbox"] {
  width: 40px;
  height: 20px;
  appearance: none;
  background-color: #f5f5f5;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-switch input[type="checkbox"]:checked {
  background: linear-gradient(135deg, #FFB7C5 0%, #A8E6CF 100%);
}

.toggle-switch input[type="checkbox"]::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background-color: #fff;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: all 0.3s ease;
}

.toggle-switch input[type="checkbox"]:checked::before {
  left: 22px;
}

.form-actions {
  display: flex;
  gap: 12px;
}

.save-btn {
  flex: 2;
  padding: 12px;
  background: linear-gradient(135deg, #A8E6CF 0%, #A8D8EA 100%);
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
  padding: 12px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* 数据备份 */
.backup-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.backup-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.backup-card h3 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.backup-hint, .clean-hint {
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
}

.backup-btn, .clean-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #A8D8EA 0%, #A8E6CF 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.clean-btn {
  background: linear-gradient(135deg, #FFD93D 0%, #FFB7C5 100%);
}

/* 危险区域 */
.danger-zone {
  border: 2px solid #ff4d4f;
  background-color: #fff2f0;
}

.danger-zone h3 {
  color: #ff4d4f;
}

.danger-hint {
  font-size: 13px;
  color: #ff4d4f;
  margin-bottom: 16px;
  line-height: 1.5;
}

.clear-database-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.clear-database-btn:hover {
  opacity: 0.9;
}

/* 限制按钮中的图标大小 */
.backup-btn :deep(svg),
.clean-btn :deep(svg),
.clear-database-btn :deep(svg) {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.backup-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.backup-info h4 {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.backup-time, .backup-size {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.backup-actions {
  display: flex;
  gap: 4px;
}

.action-btn.restore {
  background: linear-gradient(135deg, #A8E6CF 0%, #A8D8EA 100%);
  color: #fff;
  border-color: transparent;
}

.action-btn.download {
  background: linear-gradient(135deg, #A8D8EA 0%, #A8E6CF 100%);
  color: #fff;
  border-color: transparent;
}

/* 关于系统 */
.about-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.about-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

/* 固定在顶部的应用信息卡片 */
.app-header-card {
  margin-bottom: 16px;
}

.app-logo {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-version {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.app-description {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  margin: 0;
}

.about-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.info-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 13px;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.tech-item {
  padding: 4px 8px;
  background-color: #f0f0f0;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
}

.license-info {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

/* 响应式适配 */
@media (max-width: 480px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .user-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .user-actions {
    align-self: flex-end;
  }

  .modal-container {
    margin: 20px;
  }
}
</style>
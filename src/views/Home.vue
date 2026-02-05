<template>
  <div class="home-container">
    <!-- 顶部操作栏 -->
    <header class="top-bar">
      <h1>{{ title }}</h1>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 底部导航栏 -->
    <footer class="bottom-nav">
      <router-link to="/home/statistics" class="nav-item" active-class="active">
        <Icon name="statistics" :size="24" />
        <span class="nav-text">首页</span>
      </router-link>
      <router-link to="/home/product" class="nav-item" active-class="active">
        <Icon name="product" :size="24" />
        <span class="nav-text">商品</span>
      </router-link>
      <router-link to="/home/inventory" class="nav-item" active-class="active">
        <Icon name="inventory" :size="24" />
        <span class="nav-text">库存</span>
      </router-link>
      <router-link to="/home/config" class="nav-item" active-class="active">
        <Icon name="settings" :size="24" />
        <span class="nav-text">我的</span>
      </router-link>
    </footer>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '../components/Icons/Icon.vue'

export default {
  name: 'Home',
  components: {
    Icon
  },
  setup() {
    const route = useRoute()

    const title = computed(() => {
      const path = route.path
      if (path.includes('dashboard')) return '本村小霸王吸金系统'
      if (path.includes('product')) return '商品管理'
      if (path.includes('inbound')) return '入库管理'
      if (path.includes('sales')) return '销售管理'
      if (path.includes('inventory')) return '库存管理'
      if (path.includes('statistics')) return '平静下来，财富悄然而至'
      if (path.includes('records')) return '流水记录'
      if (path.includes('config')) return '系统配置'
      return '本村小霸王吸金系统'
    })

    return {
      title
    }
  }
}
</script>

<style scoped>
.home-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #FFFBF5;
}

.top-bar {
  height: 56px;
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 16px;
  box-shadow: 0 2px 8px rgba(255, 183, 197, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
}

.top-bar h1 {
  font-size: 18px;
  font-weight: 700;
  color: #8B4513;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.bottom-nav {
  height: 64px;
  background: #FFFFFF;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2px 8px rgba(255, 183, 197, 0.15);
  position: sticky;
  bottom: 0;
  z-index: 100;
  border-top: 1px solid rgba(255, 183, 197, 0.2);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  color: #888888;
  text-decoration: none;
  transition: all 0.3s ease;
  gap: 4px;
  padding: 8px;
}

.nav-item .icon-svg {
  width: 24px;
  height: 24px;
}

.nav-item.active {
  color: #FFB7C5;
}

.nav-item.active .icon-svg {
  filter: drop-shadow(0 2px 4px rgba(255, 183, 197, 0.4));
}

.nav-text {
  font-size: 11px;
  font-weight: 500;
}

/* 过渡动画 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

/* 响应式适配 */
@media (max-width: 480px) {
  .top-bar {
    height: 52px;
    padding: 0 12px;
  }

  .top-bar h1 {
    font-size: 16px;
  }

  .bottom-nav {
    height: 60px;
  }

  .nav-text {
    font-size: 10px;
  }
}
</style>

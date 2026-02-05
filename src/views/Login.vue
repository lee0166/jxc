<template>
  <div class="login-container">
    <!-- 装饰背景 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <!-- 头部品牌区域 -->
    <div class="login-header">
      <div class="brand-logo">
        <div class="logo-icon">👑</div>
      </div>
      <h1 class="app-title">小霸王财富管理系统</h1>
      <p class="app-slogan">让每一双鞋都创造价值</p>
      <div class="app-tags">
        <span class="tag">📱 移动优先</span>
        <span class="tag">⚡ 极速开单</span>
        <span class="tag">📊 智能分析</span>
      </div>
    </div>

    <!-- 登录表单 -->
    <div class="login-form">
      <div class="form-header">
        <h2 class="form-title">欢迎回来</h2>
        <p class="form-subtitle">请登录您的账户</p>
      </div>

      <div class="form-group">
        <label class="form-label">
          <span class="label-icon">👤</span>
          用户名
        </label>
        <input 
          type="text" 
          class="form-input" 
          v-model="username" 
          placeholder="请输入用户名"
          @blur="validateUsername"
        />
        <div class="error-message" v-if="errors.username">
          <span class="error-icon">⚠️</span>
          {{ errors.username }}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">
          <span class="label-icon">🔒</span>
          密码
        </label>
        <div class="password-input-wrapper">
          <input 
            :type="showPassword ? 'text' : 'password'" 
            class="form-input" 
            v-model="password" 
            placeholder="请输入密码"
            @blur="validatePassword"
            @keyup.enter="handleLogin"
          />
          <button 
            type="button" 
            class="toggle-password-btn"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? '🙈' : '🙉' }}
          </button>
        </div>
        <div class="error-message" v-if="errors.password">
          <span class="error-icon">⚠️</span>
          {{ errors.password }}
        </div>
      </div>

      <button 
        class="login-btn" 
        @click="handleLogin"
        :disabled="isLoading"
        :class="{ 'loading': isLoading }"
      >
        <span v-if="!isLoading" class="btn-content">
          <span class="btn-icon">🚀</span>
          立即登录
        </span>
        <span v-else class="btn-loading">
          <span class="loading-spinner"></span>
          登录中...
        </span>
      </button>

      <div class="login-divider">
        <span class="divider-line"></span>
        <span class="divider-text">温馨提示</span>
        <span class="divider-line"></span>
      </div>

      <div class="login-tips">
        <div class="tip-item">
          <span class="tip-icon">💡</span>
          <span>登录状态保持30天，无需重复登录</span>
        </div>
        <div class="tip-item">
          <span class="tip-icon">🔐</span>
          <span>支持微信、Chrome、Safari等主流浏览器</span>
        </div>
      </div>
    </div>

    <!-- 底部版权 -->
    <div class="login-footer">
      <p class="copyright">© 2024 小霸王财富管理系统 · 让生意更简单</p>
      <div class="version">v2.0</div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const username = ref('')
    const password = ref('')
    const showPassword = ref(false)
    const isLoading = ref(false)
    const errors = reactive({})

    const validateUsername = () => {
      if (!username.value) {
        errors.username = '请输入用户名'
        return false
      }
      if (username.value.length < 2) {
        errors.username = '用户名至少2个字符'
        return false
      }
      delete errors.username
      return true
    }

    const validatePassword = () => {
      if (!password.value) {
        errors.password = '请输入密码'
        return false
      }
      if (password.value.length < 6) {
        errors.password = '密码至少6个字符'
        return false
      }
      delete errors.password
      return true
    }

    const handleLogin = async () => {
      if (!validateUsername() || !validatePassword()) return

      isLoading.value = true
      try {
        const response = await fetch('/api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: username.value,
            password: password.value
          })
        })

        const data = await response.json()

        if (response.ok && data.status === 'success') {
          localStorage.setItem('isLoggedIn', 'true')
          localStorage.setItem('username', data.data.username)
          localStorage.setItem('token', data.data.token)
          localStorage.setItem('loginTime', new Date().toISOString())
          router.push('/home')
        } else {
          alert(data.message || '用户名或密码错误')
        }
      } catch (error) {
        console.error('登录请求失败:', error)
        alert('登录请求失败，请检查网络连接')
      } finally {
        isLoading.value = false
      }
    }

    return {
      username,
      password,
      showPassword,
      isLoading,
      errors,
      validateUsername,
      validatePassword,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFFBF5 0%, #FFF5F7 50%, #FFFBF5 100%);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

/* 装饰背景 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.15;
}

.circle-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
  top: -100px;
  right: -100px;
  animation: float 6s ease-in-out infinite;
}

.circle-2 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #A8E6CF 0%, #A8D8EA 100%);
  bottom: 100px;
  left: -50px;
  animation: float 8s ease-in-out infinite reverse;
}

.circle-3 {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #FFD93D 0%, #FFE4B5 100%);
  bottom: -30px;
  right: 50px;
  animation: float 7s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

/* 头部品牌区域 */
.login-header {
  text-align: center;
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
  padding-top: 20px;
}

.brand-logo {
  margin-bottom: 16px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #FFB7C5 0%, #FFE4E9 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin: 0 auto;
  box-shadow: 0 8px 24px rgba(255, 183, 197, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.app-title {
  font-size: 28px;
  font-weight: 800;
  color: #8B4513;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(255, 183, 197, 0.3);
  letter-spacing: 1px;
}

.app-slogan {
  font-size: 14px;
  color: #A0522D;
  margin-bottom: 16px;
  font-weight: 500;
}

.app-tags {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  background: rgba(255, 183, 197, 0.2);
  color: #8B4513;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid rgba(255, 183, 197, 0.3);
}

/* 登录表单 */
.login-form {
  background: #FFFFFF;
  border-radius: 24px;
  padding: 32px 24px;
  box-shadow: 0 8px 32px rgba(255, 183, 197, 0.2);
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 183, 197, 0.2);
}

.form-header {
  text-align: center;
  margin-bottom: 24px;
}

.form-title {
  font-size: 22px;
  font-weight: 700;
  color: #4A4A4A;
  margin-bottom: 4px;
}

.form-subtitle {
  font-size: 14px;
  color: #888888;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #4A4A4A;
  margin-bottom: 8px;
}

.label-icon {
  font-size: 16px;
}

.form-input {
  width: 100%;
  height: 52px;
  padding: 0 16px;
  border: 2px solid rgba(255, 183, 197, 0.3);
  border-radius: 14px;
  font-size: 16px;
  color: #4A4A4A;
  background: #FFFBF5;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #FFB7C5;
  background: #FFFFFF;
  box-shadow: 0 0 0 4px rgba(255, 183, 197, 0.15);
}

.form-input::placeholder {
  color: #CCCCCC;
}

.password-input-wrapper {
  position: relative;
}

.password-input-wrapper .form-input {
  padding-right: 50px;
}

.toggle-password-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.toggle-password-btn:hover {
  opacity: 1;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #FF6B6B;
  margin-top: 6px;
  padding-left: 4px;
}

.error-icon {
  font-size: 12px;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 54px;
  background: linear-gradient(135deg, #FFB7C5 0%, #FF9AAE 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
  box-shadow: 0 4px 16px rgba(255, 183, 197, 0.4);
  position: relative;
  overflow: hidden;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 183, 197, 0.5);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-icon {
  font-size: 20px;
}

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 分隔线 */
.login-divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  gap: 12px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 183, 197, 0.5), transparent);
}

.divider-text {
  font-size: 12px;
  color: #FFB7C5;
  font-weight: 500;
}

/* 登录提示 */
.login-tips {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #888888;
  padding: 8px 12px;
  background: rgba(255, 183, 197, 0.08);
  border-radius: 10px;
}

.tip-icon {
  font-size: 14px;
}

/* 底部版权 */
.login-footer {
  margin-top: auto;
  padding-top: 24px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.copyright {
  font-size: 12px;
  color: #AAAAAA;
  margin-bottom: 4px;
}

.version {
  display: inline-block;
  background: rgba(255, 183, 197, 0.2);
  color: #FFB7C5;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

/* 响应式适配 */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }

  .login-header {
    padding-top: 10px;
    margin-bottom: 24px;
  }

  .logo-icon {
    width: 70px;
    height: 70px;
    font-size: 36px;
    border-radius: 20px;
  }

  .app-title {
    font-size: 24px;
  }

  .app-tags {
    gap: 6px;
  }

  .tag {
    padding: 4px 10px;
    font-size: 11px;
  }

  .login-form {
    padding: 24px 20px;
    border-radius: 20px;
  }

  .form-title {
    font-size: 20px;
  }

  .form-input {
    height: 48px;
    border-radius: 12px;
  }

  .login-btn {
    height: 50px;
    border-radius: 12px;
    font-size: 16px;
  }
}

@media (min-width: 768px) {
  .login-container {
    justify-content: center;
    padding: 40px;
  }

  .login-form {
    max-width: 420px;
    margin: 0 auto;
    width: 100%;
  }

  .login-header {
    margin-bottom: 40px;
  }
}
</style>

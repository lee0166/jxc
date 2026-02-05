<template>
  <div class="scan-container">
    <div class="scan-header">
      <h2 class="scan-title">商品扫码</h2>
      <button class="back-btn" @click="handleBack">
        ← 返回
      </button>
    </div>

    <div class="scan-content">
      <!-- 初始状态：显示启动摄像头按钮 -->
      <div class="start-camera-section" v-if="!cameraStarted && !loading && !hasCamera && !cameraError">
        <div class="camera-icon-large">📷</div>
        <h3>开始扫码</h3>
        <p>点击按钮启动摄像头扫描商品条码</p>
        
        <!-- 访问方式提示 -->
        <div class="access-hint" :class="{ 'is-localhost': isLocalhost }">
          <p v-if="isLocalhost">
            ✅ 当前使用 localhost 访问，摄像头应该可以正常工作
          </p>
          <p v-else class="warning">
            ⚠️ 当前使用 IP 地址访问，摄像头可能无法工作<br>
            <span class="hint-detail">建议使用 http://localhost:5174 访问</span>
          </p>
        </div>
        
        <button class="start-camera-btn" @click="startCamera">
          启动摄像头
        </button>
        
        <!-- 手动输入和图片识别 -->
        <div class="alternative-methods">
          <div class="divider">
            <span>其他方式</span>
          </div>
          
          <!-- 手动输入 -->
          <div class="input-method">
            <h4>手动输入条码</h4>
            <div class="manual-input-container">
              <input 
                type="text" 
                class="manual-input" 
                v-model="manualBarcode" 
                placeholder="输入商品条码"
                @keyup.enter="handleManualInput"
              />
              <button class="manual-submit-btn" @click="handleManualInput">
                查询
              </button>
            </div>
          </div>
          
          <!-- 图片识别 -->
          <div class="image-method">
            <h4>上传图片识别</h4>
            <div class="file-input-wrapper">
              <input 
                type="file" 
                ref="fileInput"
                accept="image/*" 
                @change="handleImageUpload"
                class="file-input"
              />
              <button class="upload-btn" @click="triggerFileInput">
                📷 选择图片
              </button>
            </div>
            <p class="upload-hint">支持拍照或从相册选择</p>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div class="loading-state" v-else-if="loading">
        <div class="loading-spinner"></div>
        <p>{{ loadingMessage }}</p>
        <p class="loading-hint" v-if="retryCount > 0">正在重试 ({{ retryCount }}/{{ maxRetries }})...</p>
      </div>

      <!-- 扫码区域 -->
      <div class="scan-area" v-else-if="hasCamera && !scanning">
        <div class="scan-preview">
          <video 
            ref="video" 
            class="camera-preview" 
            autoplay 
            playsinline 
            muted
            @loadedmetadata="onVideoLoaded"
          ></video>
          <div class="scan-frame">
            <div class="scan-line"></div>
            <div class="scan-corner top-left"></div>
            <div class="scan-corner top-right"></div>
            <div class="scan-corner bottom-left"></div>
            <div class="scan-corner bottom-right"></div>
          </div>
          <div class="scan-hint">
            <p>请将商品条码对准扫描框内</p>
          </div>
        </div>
        
        <!-- 扫码控制按钮 -->
        <div class="scan-controls">
          <button class="control-btn primary" @click="startScan" :disabled="!videoReady">
            {{ videoReady ? '开始扫码' : '摄像头准备中...' }}
          </button>
          <button class="control-btn secondary" @click="stopCamera">
            关闭摄像头
          </button>
        </div>
      </div>

      <!-- 摄像头错误状态 -->
      <div class="error-section" v-else-if="cameraError && !loading">
        <div class="error-icon">⚠️</div>
        <h3>摄像头访问失败</h3>
        <p class="error-message">{{ cameraError }}</p>
        
        <!-- 针对性解决方案 -->
        <div class="solution-box">
          <h4>解决方案：</h4>
          <div class="solution-content" v-html="errorSolution"></div>
        </div>
        
        <div class="error-actions">
          <button class="action-btn primary" @click="retryInitScanner" v-if="retryCount < maxRetries">
            重试
          </button>
          <button class="action-btn secondary" @click="resetCamera">
            重新启动
          </button>
        </div>

        <!-- 备用方案 -->
        <div class="alternative-methods error-alternative">
          <h4>或使用以下方式：</h4>
          
          <!-- 手动输入 -->
          <div class="input-method">
            <div class="manual-input-container">
              <input 
                type="text" 
                class="manual-input" 
                v-model="manualBarcode" 
                placeholder="输入商品条码"
                @keyup.enter="handleManualInput"
              />
              <button class="manual-submit-btn" @click="handleManualInput">
                查询
              </button>
            </div>
          </div>
          
          <!-- 图片识别 -->
          <div class="image-method">
            <div class="file-input-wrapper">
              <input 
                type="file" 
                ref="fileInputError"
                accept="image/*" 
                @change="handleImageUpload"
                class="file-input"
              />
              <button class="upload-btn" @click="triggerFileInputError">
                📷 上传图片识别
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 图片识别结果 -->
      <div class="image-result" v-if="imageScanning">
        <div class="result-icon" :class="{ success: imageScanSuccess, error: !imageScanSuccess }">
          {{ imageScanSuccess ? '✅' : '❌' }}
        </div>
        <h3>{{ imageScanSuccess ? '识别成功' : '识别失败' }}</h3>
        <p v-if="imageScanSuccess" class="result-code">{{ imageScanResult }}</p>
        <p v-else class="error-text">{{ imageErrorMessage }}</p>
        <div class="result-actions">
          <button class="action-btn primary" @click="handleImageResult">
            {{ imageScanSuccess ? '查看商品' : '重新上传' }}
          </button>
          <button class="action-btn secondary" @click="resetImageScan">
            返回
          </button>
        </div>
      </div>

      <!-- 扫描结果 -->
      <div class="scan-result" v-if="scanning">
        <div class="result-icon" :class="{ success: scanSuccess, error: !scanSuccess }">
          {{ scanSuccess ? '✅' : '❌' }}
        </div>
        <h3>{{ scanSuccess ? '扫码成功' : '扫码失败' }}</h3>
        <p v-if="scanSuccess" class="result-code">{{ scanResult }}</p>
        <p v-else class="error-text">{{ errorMessage }}</p>
        <div class="result-actions">
          <button class="action-btn primary" @click="handleResult">
            {{ scanSuccess ? '查看商品' : '重新扫描' }}
          </button>
          <button class="action-btn secondary" @click="resetScan">
            返回
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { BrowserQRCodeReader, HTMLCanvasElementLuminanceSource, BinaryBitmap, HybridBinarizer } from '@zxing/library'

export default {
  name: 'Scan',
  setup() {
    const router = useRouter()
    const video = ref(null)
    const scanner = ref(null)
    const stream = ref(null)
    const fileInput = ref(null)
    const fileInputError = ref(null)
    
    // 状态管理
    const cameraStarted = ref(false)
    const hasCamera = ref(false)
    const videoReady = ref(false)
    const loading = ref(false)
    const loadingMessage = ref('')
    const cameraError = ref(null)
    const retryCount = ref(0)
    const maxRetries = 3
    
    // 扫码状态
    const scanning = ref(false)
    const scanSuccess = ref(false)
    const scanResult = ref('')
    const errorMessage = ref('')
    
    // 图片识别状态
    const imageScanning = ref(false)
    const imageScanSuccess = ref(false)
    const imageScanResult = ref('')
    const imageErrorMessage = ref('')
    
    // 手动输入
    const manualBarcode = ref('')

    // 检测访问方式
    const isLocalhost = computed(() => {
      return window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1'
    })

    // 获取错误解决方案
    const errorSolution = computed(() => {
      if (!cameraError.value) return ''
      
      let solution = '<ol>'
      
      if (!isLocalhost.value) {
        solution += `
          <li><strong>使用 localhost 访问</strong><br>
          在浏览器地址栏输入：<code>http://localhost:5174</code><br>
          而不是使用IP地址访问</li>
        `
      }
      
      solution += `
        <li><strong>检查摄像头权限</strong><br>
        确保浏览器已允许访问摄像头</li>
        
        <li><strong>关闭其他应用</strong><br>
        关闭微信、QQ、Zoom等可能使用摄像头的应用</li>
        
        <li><strong>使用其他浏览器</strong><br>
        尝试使用Chrome、Edge或Firefox浏览器</li>
        
        <li><strong>使用图片识别功能</strong><br>
        点击"上传图片识别"按钮，选择包含条码的图片</li>
      `
      
      solution += '</ol>'
      return solution
    })

    // 启动摄像头（用户主动触发）
    const startCamera = async () => {
      cameraStarted.value = true
      await initScanner()
    }

    // 初始化扫码器
    const initScanner = async () => {
      try {
        loading.value = true
        loadingMessage.value = '正在启动摄像头...'
        cameraError.value = null
        videoReady.value = false
        
        console.log('浏览器信息:', {
          userAgent: navigator.userAgent,
          mediaDevices: !!navigator.mediaDevices,
          getUserMedia: !!navigator.mediaDevices?.getUserMedia,
          isSecureContext: window.isSecureContext,
          hostname: window.location.hostname,
          isLocalhost: isLocalhost.value
        })

        // 检查浏览器支持
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('浏览器不支持摄像头')
        }

        // 停止之前的流
        await stopStream()

        // 请求摄像头权限
        loadingMessage.value = '正在请求摄像头权限...'
        
        try {
          stream.value = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          })
        } catch (err) {
          // 尝试使用前置摄像头
          console.warn('后置摄像头失败，尝试前置摄像头:', err)
          stream.value = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          })
        }

        hasCamera.value = true
        loadingMessage.value = '正在初始化视频...'

        // 设置视频源
        if (video.value) {
          video.value.srcObject = stream.value
          
          // 等待视频准备好
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('视频初始化超时'))
            }, 10000)
            
            video.value.onloadedmetadata = () => {
              clearTimeout(timeout)
              resolve()
            }
            
            video.value.onerror = (err) => {
              clearTimeout(timeout)
              reject(new Error('视频加载失败'))
            }
          })
          
          // 尝试播放视频
          await video.value.play()
          videoReady.value = true
        }

        // 初始化扫码器
        scanner.value = new BrowserQRCodeReader()
        console.log('摄像头启动成功')
        
        // 重置重试计数
        retryCount.value = 0
        
      } catch (error) {
        console.error('摄像头启动失败:', error)
        hasCamera.value = false
        cameraError.value = getFriendlyErrorMessage(error)
      } finally {
        loading.value = false
      }
    }

    // 视频加载完成
    const onVideoLoaded = () => {
      console.log('视频元数据加载完成')
      videoReady.value = true
    }

    // 停止视频流
    const stopStream = async () => {
      if (stream.value) {
        const tracks = stream.value.getTracks()
        tracks.forEach(track => {
          track.stop()
          console.log('停止视频轨道:', track.label)
        })
        stream.value = null
      }
      
      if (video.value) {
        video.value.srcObject = null
      }
      
      videoReady.value = false
    }

    // 停止摄像头
    const stopCamera = async () => {
      await stopStream()
      hasCamera.value = false
      cameraStarted.value = false
      scanning.value = false
      cameraError.value = null
    }

    // 重置摄像头
    const resetCamera = async () => {
      await stopCamera()
      retryCount.value = 0
    }

    // 重试初始化
    const retryInitScanner = async () => {
      if (retryCount.value >= maxRetries) {
        cameraError.value = '已达到最大重试次数'
        return
      }
      
      retryCount.value++
      loadingMessage.value = `正在重试 (${retryCount.value}/${maxRetries})...`
      
      // 延迟重试，给系统时间释放资源
      await new Promise(resolve => setTimeout(resolve, 2000))
      await initScanner()
    }

    // 开始扫码
    const startScan = async () => {
      if (!videoReady.value || !scanner.value) {
        errorMessage.value = '摄像头未准备好'
        scanning.value = true
        scanSuccess.value = false
        return
      }

      try {
        scanning.value = true
        scanSuccess.value = false
        
        const result = await scanner.value.decodeFromVideoElement(video.value)
        scanResult.value = result.text
        scanSuccess.value = true
        
        // 扫码成功后停止摄像头
        await stopStream()
      } catch (error) {
        console.error('扫码失败:', error)
        errorMessage.value = '未能识别条码，请重试'
        scanSuccess.value = false
      }
    }

    // 处理扫码结果
    const handleResult = () => {
      if (scanSuccess.value) {
        router.push(`/home/product?code=${encodeURIComponent(scanResult.value)}`)
      } else {
        resetScan()
      }
    }

    // 重置扫码状态
    const resetScan = () => {
      scanning.value = false
      scanSuccess.value = false
      scanResult.value = ''
      errorMessage.value = ''
    }

    // 触发文件选择
    const triggerFileInput = () => {
      fileInput.value?.click()
    }

    const triggerFileInputError = () => {
      fileInputError.value?.click()
    }

    // 处理图片上传
    const handleImageUpload = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      imageScanning.value = true
      imageScanSuccess.value = false
      imageScanResult.value = ''
      imageErrorMessage.value = ''

      try {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const img = new Image()
            img.onload = async () => {
              try {
                // 创建canvas并绘制图片
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                canvas.width = img.width
                canvas.height = img.height
                ctx.drawImage(img, 0, 0)

                // 获取图片数据
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                
                // 使用zxing解码
                const luminanceSource = new HTMLCanvasElementLuminanceSource(canvas)
                const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource))
                const codeReader = new BrowserQRCodeReader()
                
                const result = await codeReader.decodeFromImageElement(img)
                
                imageScanResult.value = result.text
                imageScanSuccess.value = true
              } catch (decodeError) {
                console.error('图片解码失败:', decodeError)
                imageErrorMessage.value = '未能识别图片中的条码，请尝试：\n1. 确保图片清晰\n2. 条码完整可见\n3. 光线充足'
                imageScanSuccess.value = false
              }
            }
            img.onerror = () => {
              imageErrorMessage.value = '图片加载失败'
              imageScanSuccess.value = false
            }
            img.src = e.target.result
          } catch (error) {
            console.error('图片处理失败:', error)
            imageErrorMessage.value = '图片处理失败，请重试'
            imageScanSuccess.value = false
          }
        }
        reader.onerror = () => {
          imageErrorMessage.value = '文件读取失败'
          imageScanSuccess.value = false
        }
        reader.readAsDataURL(file)
      } catch (error) {
        console.error('图片上传失败:', error)
        imageErrorMessage.value = '图片上传失败，请重试'
        imageScanSuccess.value = false
      }
    }

    // 处理图片识别结果
    const handleImageResult = () => {
      if (imageScanSuccess.value) {
        router.push(`/home/product?code=${encodeURIComponent(imageScanResult.value)}`)
      } else {
        resetImageScan()
      }
    }

    // 重置图片识别状态
    const resetImageScan = () => {
      imageScanning.value = false
      imageScanSuccess.value = false
      imageScanResult.value = ''
      imageErrorMessage.value = ''
      // 清空文件输入
      if (fileInput.value) fileInput.value.value = ''
      if (fileInputError.value) fileInputError.value.value = ''
    }

    // 处理手动输入
    const handleManualInput = () => {
      const code = manualBarcode.value.trim()
      if (!code) {
        alert('请输入商品条码')
        return
      }
      router.push(`/home/product?code=${encodeURIComponent(code)}`)
    }

    // 返回
    const handleBack = () => {
      router.back()
    }

    // 获取友好的错误信息
    const getFriendlyErrorMessage = (error) => {
      const errorName = error.name || ''
      const errorMessage = error.message || ''
      
      if (errorName === 'NotAllowedError' || errorMessage.includes('Permission denied')) {
        if (!isLocalhost.value) {
          return '摄像头权限被拒绝。\n\n可能原因：您正在使用IP地址访问，浏览器阻止了摄像头访问。\n\n解决方案：请使用 http://localhost:5174 访问本页面。'
        }
        return '摄像头权限被拒绝。请在浏览器设置中允许访问摄像头，然后重试。'
      }
      
      if (errorName === 'NotFoundError' || errorMessage.includes('Requested device not found')) {
        return '未找到摄像头设备。请确保您的设备有摄像头且未被其他应用占用。'
      }
      
      if (errorName === 'NotReadableError' || errorMessage.includes('Could not start video source')) {
        let msg = '无法启动摄像头。'
        if (!isLocalhost.value) {
          msg += '\n\n重要提示：您正在使用IP地址访问，这是导致问题的主要原因。'
          msg += '\n请使用 http://localhost:5174 访问本页面。'
        } else {
          msg += '\n可能原因：\n1. 摄像头被其他应用占用（微信、QQ、Zoom等）\n2. 摄像头硬件故障\n3. 驱动问题'
          msg += '\n\n请关闭其他应用后重试，或使用下方的"上传图片识别"功能。'
        }
        return msg
      }
      
      if (errorName === 'OverconstrainedError') {
        return '摄像头参数不支持。请尝试使用其他浏览器或设备。'
      }
      
      if (errorName === 'AbortError') {
        return '摄像头请求被中止。请重试。'
      }
      
      if (errorMessage.includes('不支持') || errorMessage.includes('not supported')) {
        return '您的浏览器不支持摄像头功能。请使用最新版的Chrome、Safari或Edge浏览器。'
      }
      
      if (errorMessage.includes('超时')) {
        return '摄像头启动超时。请检查摄像头是否正常工作，或使用"上传图片识别"功能。'
      }
      
      return `摄像头访问失败：${errorMessage}`
    }

    // 组件卸载时清理
    onUnmounted(() => {
      stopStream()
      if (scanner.value) {
        scanner.value.reset()
      }
    })

    return {
      video,
      fileInput,
      fileInputError,
      cameraStarted,
      hasCamera,
      videoReady,
      loading,
      loadingMessage,
      cameraError,
      retryCount,
      maxRetries,
      scanning,
      scanSuccess,
      scanResult,
      errorMessage,
      imageScanning,
      imageScanSuccess,
      imageScanResult,
      imageErrorMessage,
      manualBarcode,
      isLocalhost,
      errorSolution,
      startCamera,
      startScan,
      stopCamera,
      resetCamera,
      retryInitScanner,
      resetScan,
      handleResult,
      handleBack,
      handleManualInput,
      onVideoLoaded,
      triggerFileInput,
      triggerFileInputError,
      handleImageUpload,
      handleImageResult,
      resetImageScan
    }
  }
}
</script>

<style scoped>
.scan-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.scan-header {
  background-color: #fff;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.scan-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.back-btn {
  background: none;
  border: none;
  font-size: 14px;
  color: #1890ff;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
}

.back-btn:hover {
  background-color: #f0f0f0;
}

.scan-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 启动摄像头区域 */
.start-camera-section {
  text-align: center;
  padding: 40px 20px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.camera-icon-large {
  font-size: 64px;
  margin-bottom: 20px;
}

.start-camera-section h3 {
  font-size: 20px;
  color: #333;
  margin-bottom: 8px;
}

.start-camera-section > p {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

/* 访问方式提示 */
.access-hint {
  margin-bottom: 20px;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
}

.access-hint.is-localhost {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.access-hint.warning {
  background-color: #fff7e6;
  border: 1px solid #ffd591;
  color: #fa8c16;
}

.access-hint .hint-detail {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

.start-camera-btn {
  width: 100%;
  padding: 14px 24px;
  background-color: #1890ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-bottom: 24px;
}

.start-camera-btn:hover {
  background-color: #40a9ff;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.loading-hint {
  font-size: 12px;
  color: #999;
}

/* 扫码区域 */
.scan-area {
  width: 100%;
  max-width: 400px;
}

.scan-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background-color: #000;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
}

.camera-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scan-frame {
  position: absolute;
  top: 25%;
  left: 25%;
  width: 50%;
  height: 50%;
  border: 2px solid rgba(0, 255, 0, 0.5);
  pointer-events: none;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #00ff00;
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}

.scan-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 3px solid #00ff00;
}

.scan-corner.top-left {
  top: -3px;
  left: -3px;
  border-bottom: none;
  border-right: none;
}

.scan-corner.top-right {
  top: -3px;
  right: -3px;
  border-bottom: none;
  border-left: none;
}

.scan-corner.bottom-left {
  bottom: -3px;
  left: -3px;
  border-top: none;
  border-right: none;
}

.scan-corner.bottom-right {
  bottom: -3px;
  right: -3px;
  border-top: none;
  border-left: none;
}

.scan-hint {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  text-align: center;
}

.scan-hint p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  background-color: rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  border-radius: 16px;
  display: inline-block;
}

/* 扫码控制按钮 */
.scan-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-btn {
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn.primary {
  background-color: #1890ff;
  color: #fff;
}

.control-btn.primary:hover:not(:disabled) {
  background-color: #40a9ff;
}

.control-btn.primary:disabled {
  background-color: #d9d9d9;
  color: #999;
  cursor: not-allowed;
}

.control-btn.secondary {
  background-color: #f0f0f0;
  color: #333;
}

.control-btn.secondary:hover {
  background-color: #d9d9d9;
}

/* 错误区域 */
.error-section {
  text-align: center;
  padding: 40px 20px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-section h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 12px;
}

.error-message {
  font-size: 14px;
  color: #666;
  white-space: pre-line;
  margin-bottom: 20px;
  line-height: 1.6;
  text-align: left;
  padding: 12px;
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
}

/* 解决方案框 */
.solution-box {
  text-align: left;
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
}

.solution-box h4 {
  font-size: 14px;
  color: #52c41a;
  margin-bottom: 12px;
}

.solution-content {
  font-size: 13px;
  color: #333;
  line-height: 1.8;
}

.solution-content ol {
  padding-left: 20px;
}

.solution-content li {
  margin-bottom: 12px;
}

.solution-content code {
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
}

/* 扫描结果 */
.scan-result,
.image-result {
  text-align: center;
  padding: 40px 20px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.result-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.result-icon.success {
  color: #52c41a;
}

.result-icon.error {
  color: #f5222d;
}

.scan-result h3,
.image-result h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 8px;
}

.result-code {
  font-size: 16px;
  color: #1890ff;
  font-family: monospace;
  background-color: #f0f0f0;
  padding: 8px 16px;
  border-radius: 4px;
  margin: 16px 0;
  word-break: break-all;
}

.error-text {
  font-size: 14px;
  color: #f5222d;
  margin: 16px 0;
  white-space: pre-line;
}

.result-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: center;
}

.action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.primary {
  background-color: #1890ff;
  color: #fff;
}

.action-btn.primary:hover {
  background-color: #40a9ff;
}

.action-btn.secondary {
  background-color: #f0f0f0;
  color: #333;
}

.action-btn.secondary:hover {
  background-color: #d9d9d9;
}

/* 备用方案区域 */
.alternative-methods {
  margin-top: 24px;
  padding-top: 24px;
}

.alternative-methods.error-alternative {
  border-top: 1px solid #e8e8e8;
}

.alternative-methods h4 {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.divider {
  position: relative;
  text-align: center;
  margin-bottom: 20px;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #e8e8e8;
}

.divider span {
  position: relative;
  background-color: #fff;
  padding: 0 16px;
  color: #999;
  font-size: 14px;
}

.input-method,
.image-method {
  margin-bottom: 20px;
}

.input-method h4,
.image-method h4 {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  text-align: left;
}

.manual-input-container {
  display: flex;
  gap: 8px;
}

.manual-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.manual-input:focus {
  border-color: #1890ff;
}

.manual-submit-btn {
  padding: 10px 16px;
  background-color: #52c41a;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.manual-submit-btn:hover {
  background-color: #73d13d;
}

/* 文件上传 */
.file-input-wrapper {
  position: relative;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.upload-btn {
  width: 100%;
  padding: 12px;
  background-color: #fa8c16;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.upload-btn:hover {
  background-color: #ffa940;
}

.upload-hint {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

/* 响应式适配 */
@media (max-width: 480px) {
  .scan-content {
    padding: 16px;
  }
  
  .start-camera-section,
  .error-section,
  .scan-result,
  .image-result {
    padding: 30px 16px;
  }
  
  .result-actions,
  .error-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
  
  .manual-input-container {
    flex-direction: column;
  }
}
</style>
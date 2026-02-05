<template>
  <div ref="chartRef" class="line-chart"></div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

export default {
  name: 'LineChart',
  props: {
    data: {
      type: Array,
      required: true
    },
    xField: {
      type: String,
      default: 'label'
    },
    yField: {
      type: String,
      default: 'value'
    },
    color: {
      type: String,
      default: '#FFB7C5'
    },
    height: {
      type: Number,
      default: 200
    },
    showArea: {
      type: Boolean,
      default: true
    },
    smooth: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const chartRef = ref(null)
    let chart = null

    const initChart = () => {
      if (!chartRef.value) return
      
      chart = echarts.init(chartRef.value)
      updateChart()
      
      window.addEventListener('resize', handleResize)
    }

    const updateChart = () => {
      if (!chart) return

      const xData = props.data.map(item => item[props.xField])
      const yData = props.data.map(item => item[props.yField])

      const option = {
        grid: {
          top: 10,
          right: 10,
          bottom: 30,
          left: 50
        },
        xAxis: {
          type: 'category',
          data: xData,
          axisLine: {
            lineStyle: {
              color: 'rgba(255, 183, 197, 0.3)'
            }
          },
          axisLabel: {
            color: '#888888',
            fontSize: 11
          },
          axisTick: {
            show: false
          }
        },
        yAxis: {
          type: 'value',
          axisLine: {
            show: false
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255, 183, 197, 0.15)',
              type: 'dashed'
            }
          },
          axisLabel: {
            color: '#888888',
            fontSize: 11,
            formatter: value => {
              if (value >= 1000) {
                return (value / 1000).toFixed(1) + 'k'
              }
              return value
            }
          }
        },
        series: [{
          data: yData,
          type: 'line',
          smooth: props.smooth,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            color: props.color,
            width: 3,
            shadowColor: props.color,
            shadowBlur: 10
          },
          itemStyle: {
            color: props.color,
            borderColor: '#fff',
            borderWidth: 2
          },
          areaStyle: props.showArea ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: props.color + '60' },
              { offset: 1, color: props.color + '10' }
            ])
          } : null
        }],
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: 'rgba(255, 183, 197, 0.3)',
          borderWidth: 1,
          textStyle: {
            color: '#4A4A4A'
          },
          formatter: params => {
            const data = params[0]
            return `<div style="font-weight:600">${data.name}</div>
                    <div style="color:${props.color}">¥${data.value.toLocaleString()}</div>`
          }
        }
      }

      chart.setOption(option)
    }

    const handleResize = () => {
      chart && chart.resize()
    }

    onMounted(() => {
      initChart()
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      chart && chart.dispose()
    })

    watch(() => props.data, () => {
      updateChart()
    }, { deep: true })

    return {
      chartRef
    }
  }
}
</script>

<style scoped>
.line-chart {
  width: 100%;
  height: 200px;
}
</style>

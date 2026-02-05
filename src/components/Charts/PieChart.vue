<template>
  <div ref="chartRef" class="pie-chart"></div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

export default {
  name: 'PieChart',
  props: {
    data: {
      type: Array,
      required: true
    },
    nameField: {
      type: String,
      default: 'name'
    },
    valueField: {
      type: String,
      default: 'value'
    },
    colors: {
      type: Array,
      default: () => ['#FFB7C5', '#A8E6CF', '#A8D8EA', '#FFE4E9', '#FF9AA8']
    },
    height: {
      type: Number,
      default: 200
    },
    donut: {
      type: Boolean,
      default: true
    },
    tooltipLabel: {
      type: String,
      default: '金额'
    },
    tooltipUnit: {
      type: String,
      default: '¥'
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

      const chartData = props.data.map((item, index) => ({
        name: item[props.nameField],
        value: item[props.valueField],
        itemStyle: {
          color: props.colors[index % props.colors.length]
        }
      }))

      const option = {
        series: [{
          type: 'pie',
          radius: props.donut ? ['45%', '70%'] : '70%',
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{d}%',
            color: '#4A4A4A',
            fontSize: 11
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 10,
            lineStyle: {
              color: 'rgba(255, 183, 197, 0.3)'
            }
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'bold'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.1)'
            }
          },
          data: chartData
        }],
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: 'rgba(255, 183, 197, 0.3)',
          borderWidth: 1,
          textStyle: {
            color: '#4A4A4A'
          },
          formatter: params => {
            const valueStr = props.tooltipUnit === '¥'
              ? '¥' + params.value.toLocaleString()
              : params.value.toLocaleString() + props.tooltipUnit
            return `<div style="font-weight:600">${params.name}</div>
                    <div>${props.tooltipLabel}: ${valueStr}</div>
                    <div>占比: ${params.percent}%</div>`
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
.pie-chart {
  width: 100%;
  height: 220px;
}
</style>

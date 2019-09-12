/*
 * @Description:
 * @Author: codexu
 * @Date: 1985-10-26 16:15:00
 * @LastEditTime: 2019-09-12 16:39:00
 */

import axios from 'axios';
import echarts from 'echarts'

import audioData from './audio.wav'
import Player from './player'

const player = new Player()

const option = {
  xAxis: {
    type: 'category',
    show: false
  },
  yAxis: {
    type: 'value',
    max: 105,
    show: false
  },
  animation: false
};

const audioChart = echarts.init(document.getElementById('audio-chart'));
audioChart.setOption(option)

document.querySelector('#btn').addEventListener('click', () => {
  axios({
    url: audioData,
    method: 'get',
    responseType: 'blob'
  }).then(res => {
    const reader = new FileReader()
    reader.readAsArrayBuffer(res.data)
    reader.onload = e => {
      const data = e.target.result
      let offset = 0
      setInterval(() => {
        const audioData = new Int16Array(data, 0, data.byteLength / 2).slice(offset, offset + 1200)
        player.play(audioData)
        offset += 1200
      }, 25);
      getByteFrequencyData()
    }
  })
})

// 循环获取音频数据(用于可视化)
function getByteFrequencyData() {
  const data = player.getByteFrequencyData().map(item => item += 5)
  audioChart.setOption({
    series: [{
      data,
      type: 'bar'
    }]
  })
  requestAnimationFrame(getByteFrequencyData)
}

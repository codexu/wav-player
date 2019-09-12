/*
 * @Description: Player
 * @Author: codexu
 * @Date: 2019-09-11 15:31:01
 * @LastEditTime: 2019-09-12 16:35:32
 */
export default class Player {
  constructor({
    NumChannels = 1,
    SampleRate = 48000,
    BitsPerSample = 16,
    Catch = 2,
    FFT = 64
  } = {}) {
    // 默认参数
    this.WavHeadLength = 44 // 头信息长度
    // 预设参数
    this.NumChannels = NumChannels // 声道数
    this.SampleRate = SampleRate // 采样率
    this.BitsPerSample = BitsPerSample // 采样位数
    this.Catch = Catch

    this.audioContext = new AudioContext()
    this.audioAnalyser = this.audioContext.createAnalyser()
    this.audioAnalyser.connect(this.audioContext.destination)
    this.audioAnalyser.fftSize = FFT
    this.bufferLength = this.audioAnalyser.fftSize;
    this.frequencyData = new Uint8Array(this.bufferLength);

    this.audioBuffer = null
    this.audioDataOffset = 0 // 音频数据偏移量
  }
  play(audioData) {
    const block = this.packWavBlock(audioData)
    if (block) {
      this.audioContext.decodeAudioData(block, buffer => {
        const audioSource = this.audioContext.createBufferSource()
        audioSource.buffer = buffer
        audioSource.connect(this.audioAnalyser);
        audioSource.start()
      }, function (e) {
        console.error(e)
      })
    }
  }
  // 获取音频数据 用于音频可视化
  getByteFrequencyData() {
    this.audioAnalyser.getByteFrequencyData(this.frequencyData);
    return [...this.frequencyData.map(item => item / 128 * 100 / 2)]
  }
  packWavBlock(audioData) {
    const ByteRate = this.SampleRate * this.NumChannels * this.BitsPerSample / 8
    const BlockAlign = this.NumChannels * this.BitsPerSample / 8

    let offset = 0 // 定义偏移量

    // 播放时间 = ( 总字节数 - 头信息字节数(44) ) / ( 采样率 \* 采样位数 * 声道 / 8 )
    const arrayBufferCatchSize = this.Catch * this.SampleRate * this.BitsPerSample * this.NumChannels / 8 + this.WavHeadLength
    if (this.audioDataOffset === 0) this.audioBuffer = new ArrayBuffer(arrayBufferCatchSize)
    let dataView = new DataView(this.audioBuffer)

    // 音频数据
    for (let i = 0; i < audioData.length; i++) {
      dataView.setInt16(this.WavHeadLength + this.audioDataOffset, audioData[i], true)
      this.audioDataOffset += 2
    }

    /* ----- RIFF区块 ----- */

    // 资源交换文件标志
    dataView.setInt8(offset, 'R'.charCodeAt(), true)
    offset += 1
    dataView.setInt8(offset, 'I'.charCodeAt(), true)
    offset += 1
    dataView.setInt8(offset, 'F'.charCodeAt(), true)
    offset += 1
    dataView.setInt8(offset, 'F'.charCodeAt(), true)
    offset += 1

    // 总字节数
    dataView.setUint32(offset, arrayBufferCatchSize - 8, true)
    offset += 4

    // WAV 文件标志
    dataView.setInt8(offset, 'W'.charCodeAt(), true)
    offset += 1
    dataView.setInt8(offset, 'A'.charCodeAt(), true)
    offset += 1
    dataView.setInt8(offset, 'V'.charCodeAt(), true)
    offset += 1
    dataView.setInt8(offset, 'E'.charCodeAt(), true)
    offset += 1

    /* ----- FORMAT 区块 ----- */

    // 波形格式标志
    dataView.setInt8(offset, 'f'.charCodeAt(), true)
    offset += 1
    dataView.setInt8(offset, 'm'.charCodeAt(), true)
    offset += 1
    dataView.setInt8(offset, 't'.charCodeAt(), true)
    offset += 1
    dataView.setInt8(offset, ' '.charCodeAt(), true)
    offset += 1

    // 过滤字节 FORMAT 区块长度
    dataView.setUint32(offset, 16, true)
    offset += 4
    // 格式种类
    dataView.setUint16(offset, 1, true)
    offset += 2
    // 声道数
    dataView.setUint16(offset, this.NumChannels, true)
    offset += 2
    // 采样率
    dataView.setUint32(offset, this.SampleRate, true)
    offset += 4
    // 位速
    dataView.setUint32(offset, ByteRate, true)
    offset += 4
    // 数据块对齐
    dataView.setUint16(offset, BlockAlign, true)
    offset += 2
    // 采样位数
    dataView.setUint16(offset, this.BitsPerSample, true)
    offset += 2

    /* ----- DATA 区块 ----- */

    // 数据标志符
    dataView.setInt8(offset, 'd'.charCodeAt())
    offset += 1
    dataView.setInt8(offset, 'a'.charCodeAt())
    offset += 1
    dataView.setInt8(offset, 't'.charCodeAt())
    offset += 1
    dataView.setInt8(offset, 'a'.charCodeAt())
    offset += 1
    // 音频数据的长度
    dataView.setUint32(offset, arrayBufferCatchSize - this.WavHeadLength, true)
    offset += 4 // dwDataSize

    if (this.audioDataOffset + this.WavHeadLength < arrayBufferCatchSize) return null

    this.audioDataOffset = 0
    return this.audioBuffer
  }
}
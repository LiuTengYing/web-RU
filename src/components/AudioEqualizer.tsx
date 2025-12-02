import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Slider from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  RotateCcw,
  Download
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { savePreset as savePresetAPI } from '@/services/audioPresetService'

interface EqualizerBand {
  frequency: number
  gain: number
  q: number
}

const AudioEqualizer: React.FC = () => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  
  // 36段全频段配置 (Hz)
  const frequencies = [20, 24, 29, 36, 45, 53, 65, 80, 100, 125, 150, 180, 210, 250, 300, 350, 420, 500, 600, 700, 800, 1000, 1300, 1600, 1900, 2300, 2800, 3400, 4100, 5000, 6100, 7500, 9000, 11000, 14000, 17000, 20000]

  // 状态管理
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [equalizerBands, setEqualizerBands] = useState<EqualizerBand[]>(() =>
    frequencies.map(freq => ({ frequency: freq, gain: 0, q: 1 }))
  )
  const [masterGain, setMasterGain] = useState(0)
  const [balance, setBalance] = useState(0)
  const [showSpectrum, setShowSpectrum] = useState(true)

  // 音频相关引用
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const filtersRef = useRef<BiquadFilterNode[]>([])

  const gainNodeRef = useRef<GainNode | null>(null)
  const balanceNodeRef = useRef<StereoPannerNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // 初始化音频上下文
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // 创建分析器
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      analyserRef.current.smoothingTimeConstant = 0.8
      
      // 创建主增益节点
      gainNodeRef.current = audioContextRef.current.createGain()
      
      // 创建平衡节点
      balanceNodeRef.current = audioContextRef.current.createStereoPanner()
      
      // 创建滤波器
      filtersRef.current = frequencies.map(freq => {
        const filter = audioContextRef.current!.createBiquadFilter()
        filter.type = 'peaking'
        filter.frequency.value = freq
        filter.Q.value = 1
        filter.gain.value = 0
        return filter
      })
    }

    return () => {
      stopPlayback()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // 加载预置音频文件（从 public/audio/ 目录）
  const loadAudioFile = async (filename: string): Promise<AudioBuffer | null> => {
    if (!audioContextRef.current) return null
    
    try {
             const response = await fetch(`/audio/${filename}`)
       if (!response.ok) {
        throw new Error(`Failed to load ${filename}`)
       }
       
       const arrayBuffer = await response.arrayBuffer()
       const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer)
       return audioBuffer
     } catch (error) {
       console.error(`Failed to load audio file ${filename}:`, error)
      showToast({
        type: 'error',
        title: t('audioEqualizer.errors.loadFailed'),
        description: `${t('audioEqualizer.errors.fileNotFound')}: ${filename}`
      })
      return null
    }
  }

  // 当前音频源引用
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 停止当前播放
  const stopPlayback = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop()
      } catch (error) {
        // 忽略停止错误
      }
      currentSourceRef.current = null
    }
    
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current)
      timeIntervalRef.current = null
    }
    
    setIsPlaying(false)
    setCurrentTime(0)
  }

  // 音频播放控制
  const togglePlay = async () => {
    if (isPlaying) {
      stopPlayback()
      return
    }

    try {
      // 检查音频上下文状态，如果已关闭则重新创建
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        // 如果存在旧的上下文，先清理
        if (audioContextRef.current) {
          try {
            audioContextRef.current.close()
          } catch (error) {
            // 忽略关闭错误
          }
        }
        
        // 创建新的音频上下文
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        // 重新初始化音频链
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        analyserRef.current.smoothingTimeConstant = 0.8
        
        gainNodeRef.current = audioContextRef.current.createGain()
        balanceNodeRef.current = audioContextRef.current.createStereoPanner()
        
        // 创建滤波器
        filtersRef.current = frequencies.map(freq => {
          const filter = audioContextRef.current!.createBiquadFilter()
          filter.type = 'peaking'
          filter.frequency.value = freq
          filter.Q.value = 1
          filter.gain.value = 0
          return filter
        })
        
        console.log('AudioContext recreated, state:', audioContextRef.current.state)
      }
      
      // 应用当前均衡器设置
      equalizerBands.forEach((band, index) => {
        if (filtersRef.current[index]) {
          filtersRef.current[index].gain.value = band.gain
        }
      })
      
      // 应用当前音量和平衡设置
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = (isMuted ? 0 : volume) * Math.pow(10, masterGain / 20)
      }
      
      if (balanceNodeRef.current) {
        balanceNodeRef.current.pan.value = balance
      }
      
      // 检查并恢复音频上下文状态
      console.log('AudioContext state before resume:', audioContextRef.current.state)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
        console.log('AudioContext resumed, new state:', audioContextRef.current.state)
      }
      
      // 加载预置音频文件
      const audioBuffer = await loadAudioFile('guitar-test.wav')
      
      if (!audioBuffer || !audioContextRef.current) {
         return
       }
      
      // 创建音频源
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.loop = true
      currentSourceRef.current = source
      
      // 重新连接音频链：源 → 增益 → 滤波器链 → 平衡 → 分析器 → 输出
      console.log('Connecting audio chain...')
      
      // 先断开所有连接
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect()
      }
      if (balanceNodeRef.current) {
        balanceNodeRef.current.disconnect()
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect()
      }
      
      // 重新连接
      source.connect(gainNodeRef.current!)
      console.log('Source connected to gain node')
      
      // 连接滤波器链
      let currentNode: AudioNode = gainNodeRef.current!
      filtersRef.current.forEach((filter, index) => {
        filter.disconnect() // 断开之前的连接
        currentNode.connect(filter)
        currentNode = filter
        if (index % 10 === 0) { // 每10个滤波器记录一次
          console.log(`Connected filter ${index + 1}/${filtersRef.current.length}`)
        }
      })
      
      // 连接平衡和分析器
      currentNode.connect(balanceNodeRef.current!)
      console.log('Filters connected to balance node')
      balanceNodeRef.current!.connect(analyserRef.current!)
      console.log('Balance node connected to analyser')
      analyserRef.current!.connect(audioContextRef.current.destination)
      console.log('Analyser connected to destination')
      
      // 开始播放
      source.start()
      setIsPlaying(true)
      
                          // 设置持续时间
      const audioDuration = audioBuffer.duration
      setDuration(audioDuration)
      
      // 开始时间更新
      const startTime = Date.now()
      timeIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000
        setCurrentTime(elapsed % audioDuration)
      }, 100)
      
      // 监听播放结束
      source.onended = () => {
        if (currentSourceRef.current === source) {
          // 只有当前源才处理结束事件
          stopPlayback()
        }
      }
      
      console.log('Audio playback started:', {
        duration: audioDuration,
        sampleRate: audioContextRef.current.sampleRate,
        bufferLength: audioBuffer.length,
        numberOfChannels: audioBuffer.numberOfChannels
      })
       
       showToast({
         type: 'success',
         title: t('audioEqualizer.messages.audioPlaybackStarted'),
        description: t('audioEqualizer.messages.audioPlaybackStarted')
       })
      
         } catch (error) {
       console.error('Audio playback error:', error)
       showToast({
         type: 'error',
         title: t('audioEqualizer.messages.audioPlaybackError'),
         description: t('audioEqualizer.messages.playbackErrorDesc')
       })
       stopPlayback()
     }
  }

  // 更新均衡器设置
  const updateEqualizerBand = (index: number, gain: number) => {
    const newBands = [...equalizerBands]
    newBands[index].gain = gain
    setEqualizerBands(newBands)
    
    if (filtersRef.current[index]) {
      filtersRef.current[index].gain.value = gain
    }
  }

  // 重置均衡器
  const resetEqualizer = () => {
    const newBands = equalizerBands.map(band => ({ ...band, gain: 0 }))
    setEqualizerBands(newBands)
    setMasterGain(0)
    setBalance(0)
    
    // 重置滤波器增益
    filtersRef.current.forEach(filter => {
      filter.gain.value = 0
    })
    
    // 重置主增益和平衡
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = (isMuted ? 0 : volume)
    }
    
    if (balanceNodeRef.current) {
      balanceNodeRef.current.pan.value = 0
    }
    
         showToast({
       type: 'success',
       title: t('audioEqualizer.messages.resetComplete'),
       description: t('audioEqualizer.messages.resetCompleteDesc')
     })
  }

  // 简单音频测试
  const testSimpleAudio = async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 440 // A4音符
      gainNode.gain.value = 0.1
      
      oscillator.start()
      setTimeout(() => {
        oscillator.stop()
        audioContext.close()
      }, 1000)
      
             showToast({
         type: 'success',
         title: t('audioEqualizer.messages.simpleTestSuccess'),
         description: t('audioEqualizer.messages.simpleTestSuccessDesc')
       })
     } catch (error) {
       console.error('Simple audio test failed:', error)
       showToast({
         type: 'error',
         title: t('audioEqualizer.messages.simpleTestError'),
         description: t('audioEqualizer.messages.simpleTestErrorDesc')
       })
     }
  }

  // 保存预设
  const savePreset = async () => {
    try {
      const preset = {
        name: `${t('audioEqualizer.controls.savePreset')}_${new Date().toLocaleString()}`,
        settings: {
          bass: equalizerBands.find(band => band.frequency <= 250)?.gain || 0,
          treble: equalizerBands.find(band => band.frequency >= 8000)?.gain || 0,
          mid: equalizerBands.find(band => band.frequency > 250 && band.frequency < 8000)?.gain || 0,
          volume: Math.round(volume * 100),
          masterGain,
          balance
        }
      }
      
      await savePresetAPI(preset)
      
      showToast({
        type: 'success',
        title: t('audioEqualizer.messages.presetSaved'),
        description: t('audioEqualizer.messages.presetSavedDesc')
      })
    } catch (error) {
      console.error('保存预设失败:', error)
      showToast({
        type: 'error',
        title: t('audioEqualizer.messages.presetSaveError'),
        description: t('audioEqualizer.messages.presetSaveErrorDesc')
      })
    }
  }



  // 频谱分析
  const drawSpectrum = () => {
    if (!analyserRef.current || !showSpectrum) return

    const canvas = document.getElementById('spectrumCanvas') as HTMLCanvasElement
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserRef.current.getByteFrequencyData(dataArray)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 垂直频谱显示
    const barHeight = canvas.height / bufferLength
    const barWidth = canvas.width

    for (let i = 0; i < bufferLength; i++) {
      const barWidthPercent = dataArray[i] / 255
      const width = barWidthPercent * barWidth
      
      // 颜色渐变：从低频(底部,红色)到高频(顶部,蓝色)
      const hue = ((bufferLength - i) / bufferLength) * 240 // 240度表示蓝色，0度表示红色
      ctx.fillStyle = `hsl(${hue}, 70%, 60%)`
      
      // 从底部向上绘制
      ctx.fillRect(
        0,
        canvas.height - (i + 1) * barHeight,
        width,
        barHeight - 1
      )
    }

    animationFrameRef.current = requestAnimationFrame(drawSpectrum)
  }

  useEffect(() => {
    if (showSpectrum && isPlaying) {
      drawSpectrum()
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [showSpectrum, isPlaying])



  // 更新平衡
  useEffect(() => {
    if (balanceNodeRef.current) {
      balanceNodeRef.current.pan.value = balance
    }
  }, [balance])

  // 更新音量
  useEffect(() => {
    if (gainNodeRef.current) {
      const finalVolume = (isMuted ? 0 : volume) * Math.pow(10, masterGain / 20)
      gainNodeRef.current.gain.value = finalVolume
    }
  }, [volume, isMuted, masterGain])



  // 格式化时间
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 频率标签格式化
  const formatFrequency = (freq: number) => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(1)}k`
    }
    return freq.toString()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 音频播放器和控制 */}
      <Card>
        <CardHeader>
                                <CardTitle className="flex items-center justify-between">
             <span>{t('audioEqualizer.title')}</span>
             <div className="flex gap-2">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setShowSpectrum(!showSpectrum)}
               >
                 {showSpectrum ? t('audioEqualizer.controls.hideSpectrum') : t('audioEqualizer.controls.showSpectrum')}
               </Button>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={savePreset}
               >
                 <Download className="h-4 w-4 mr-2" />
                 {t('audioEqualizer.controls.savePreset')}
               </Button>
                              <Button
                  variant="outline"
                  size="sm"
                  onClick={resetEqualizer}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('audioEqualizer.controls.reset')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testSimpleAudio}
                >
                  {t('audioEqualizer.controls.simpleTest')}
                </Button>
             </div>
           </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
                     {/* 音频播放器 */}
           <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
             {/* 音频播放提示 */}
                           <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                                 <div className="text-blue-600 dark:text-blue-400 text-sm">
                  {t('audioEqualizer.tips.eqAdjustment')}
                </div>
                </div>
              </div>

            {/* 使用说明 */}
            <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="text-green-600 dark:text-green-400 text-sm">
                {t('audioEqualizer.tips.howToUse')}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <Button
                onClick={togglePlay}
                size="sm"
                className="flex-shrink-0"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
                <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="flex-shrink-0"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              
              <div className="w-20">
                <Slider
                  value={[volume * 100]}
                  onValueChange={([value]: number[]) => setVolume(value / 100)}
                  max={100}
                  step={1}
                  className="w-full"
                />
                 </div>
               </div>
            

          </div>

          {/* 主音量与平衡控制 */}
                     <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-sm font-medium">{t('audioEqualizer.labels.masterVolume')}</label>
               <div className="flex items-center gap-4">
                 <Slider
                   value={[masterGain]}
                   onValueChange={([value]: number[]) => setMasterGain(value)}
                   min={-20}
                   max={20}
                   step={0.1}
                   className="flex-1"
                 />
                 <span className="text-sm font-mono w-12 text-right">
                   {masterGain.toFixed(1)}dB
                 </span>
               </div>
             </div>
             
             <div className="space-y-2">
               <label className="text-sm font-medium">{t('audioEqualizer.labels.balance')}</label>
               <div className="flex items-center gap-4">
                 <Slider
                   value={[balance]}
                   onValueChange={([value]: number[]) => setBalance(value)}
                   min={-1}
                   max={1}
                   step={0.01}
                   className="flex-1"
                 />
                 <span className="text-sm font-mono w-12 text-right">
                   {balance.toFixed(2)}
                 </span>
               </div>
             </div>
           </div>
        </CardContent>
      </Card>

      {/* 主要布局：左侧频谱，右侧均衡器 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 频谱分析器 - 固定在左侧 */}
                 {showSpectrum && (
           <div className="lg:col-span-1">
             <Card className="h-full">
               <CardHeader>
                 <CardTitle className="text-sm">{t('audioEqualizer.labels.realTimeSpectrum')}</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="bg-black rounded-lg p-4">
                   <canvas
                     id="spectrumCanvas"
                     width={200}
                     height={400}
                     className="w-full h-96 rounded"
                   />
                 </div>
               </CardContent>
             </Card>
           </div>
         )}

        {/* EQ均衡器 */}
                 <div className={showSpectrum ? "lg:col-span-3" : "lg:col-span-4"}>
           <Card>
             <CardHeader>
               <CardTitle className="text-lg">
                 {t('audioEqualizer.eqBands.37')}
               </CardTitle>
             </CardHeader>
            <CardContent>
                             <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-20 xl:grid-cols-24 2xl:grid-cols-32 gap-3">
                 {equalizerBands.map((band, index) => (
                   <div key={index} className="flex flex-col items-center space-y-2">
                     <div className="text-center text-xs text-gray-600 dark:text-gray-400 font-mono">
                       {formatFrequency(band.frequency)}
                     </div>
                     <div className="relative h-40 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg p-2 min-w-[24px] border border-gray-200 dark:border-gray-700">
                       <Slider
                         orientation="vertical"
                         value={[band.gain]}
                         onValueChange={([value]: number[]) => updateEqualizerBand(index, value)}
                         min={-12}
                         max={12}
                         step={0.1}
                         className="h-36"
                       />
                     </div>
                     <div className="text-center text-xs font-mono font-semibold text-gray-700 dark:text-gray-300">
                       {band.gain.toFixed(1)}dB
                     </div>
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AudioEqualizer

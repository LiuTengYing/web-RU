import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AudioGenerator } from '@/utils/audioGenerator'
import { Download, Music, Pin, Zap } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

const AudioGeneratorPage: React.FC = () => {
  const { showToast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([])

  const handleGenerateAll = async () => {
    setIsGenerating(true)
    try {
      const generator = new AudioGenerator()
      await generator.generateAllAudioFiles()
      
      setGeneratedFiles([
        'piano-music.wav',
        'pop-music.wav', 
        'jazz-music.wav',
        'guitar-test.wav',
        'frequency-test.wav'
      ])
      
      showToast({
        type: 'success',
        title: '音频文件生成完成',
        description: '所有音频文件已生成并开始下载'
      })
    } catch (error) {
      console.error('生成音频文件失败:', error)
      showToast({
        type: 'error',
        title: '生成失败',
        description: '音频文件生成过程中出现错误'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateSingle = async (type: string) => {
    setIsGenerating(true)
    try {
      const generator = new AudioGenerator()
      
      switch (type) {
        case 'piano':
          const pianoBuffer = await generator.generatePianoMusic()
          const pianoBlob = await generator.audioBufferToBlob(pianoBuffer)
          generator.downloadFile(pianoBlob, 'piano-music.wav', '钢琴音乐')
          break
        case 'pop':
          const popBuffer = await generator.generatePopMusic()
          const popBlob = await generator.audioBufferToBlob(popBuffer)
          generator.downloadFile(popBlob, 'pop-music.wav', '流行音乐')
          break
        case 'jazz':
          const jazzBuffer = await generator.generateJazzMusic()
          const jazzBlob = await generator.audioBufferToBlob(jazzBuffer)
          generator.downloadFile(jazzBlob, 'jazz-music.wav', '爵士音乐')
          break
        case 'guitar':
          const guitarBuffer = await generator.generateGuitarTest()
          const guitarBlob = await generator.audioBufferToBlob(guitarBuffer)
          generator.downloadFile(guitarBlob, 'guitar-test.wav', '吉他测试音频')
          break
        case 'frequency':
          const freqBuffer = await generator.generateFrequencyTest()
          const freqBlob = await generator.audioBufferToBlob(freqBuffer)
          generator.downloadFile(freqBlob, 'frequency-test.wav', '频率测试音频')
          break
      }
      
      showToast({
        type: 'success',
        title: '音频文件生成完成',
        description: `${type}音频文件已生成并开始下载`
      })
    } catch (error) {
      console.error('生成音频文件失败:', error)
      showToast({
        type: 'error',
        title: '生成失败',
        description: '音频文件生成过程中出现错误'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-6 w-6" />
            高质量音频文件生成器
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <div className="text-blue-600 dark:text-blue-400 text-sm">
                💡 <strong>说明：</strong>这个工具可以生成高质量的音频文件，用于音频均衡器测试。生成的音频文件比实时生成的音频更加自然和悦耳。
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Pin className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">钢琴音乐</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  20秒循环的钢琴音乐，包含自然的钢琴音色和颤音效果
                </p>
                <Button
                  onClick={() => handleGenerateSingle('piano')}
                  disabled={isGenerating}
                  className="w-full"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  生成钢琴音乐
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Music className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">流行音乐</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  16秒循环的流行音乐，包含鼓点、贝斯线和和弦伴奏
                </p>
                <Button
                  onClick={() => handleGenerateSingle('pop')}
                  disabled={isGenerating}
                  className="w-full"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  生成流行音乐
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Music className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold">爵士音乐</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  20秒循环的爵士音乐，包含萨克斯风音色和摇摆节奏
                </p>
                <Button
                  onClick={() => handleGenerateSingle('jazz')}
                  disabled={isGenerating}
                  className="w-full"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  生成爵士音乐
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold">吉他测试</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  12秒循环的吉他弦测试音频，包含吉他特有的谐波结构
                </p>
                <Button
                  onClick={() => handleGenerateSingle('guitar')}
                  disabled={isGenerating}
                  className="w-full"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  生成吉他测试
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold">频率测试</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  15秒循环的多频测试音频，用于音频系统测试
                </p>
                <Button
                  onClick={() => handleGenerateSingle('frequency')}
                  disabled={isGenerating}
                  className="w-full"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  生成频率测试
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Download className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold">全部生成</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  一次性生成所有类型的音频文件
                </p>
                <Button
                  onClick={handleGenerateAll}
                  disabled={isGenerating}
                  className="w-full"
                  size="sm"
                  variant="destructive"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGenerating ? '生成中...' : '生成全部'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {generatedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">已生成的文件</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {generatedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <Download className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-mono">{file}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="text-green-600 dark:text-green-400 text-sm">
                    ✅ 音频文件已生成完成！请将下载的文件放入 <code className="bg-green-100 dark:bg-green-800 px-1 rounded">public/audio/</code> 目录中，然后在音频均衡器中使用。
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">使用说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">步骤1：生成音频文件</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  点击上面的按钮生成音频文件，文件会自动下载到您的下载目录。
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">步骤2：放置音频文件</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  将下载的音频文件移动到项目的 <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">public/audio/</code> 目录中。
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">步骤3：在均衡器中使用</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  修改音频均衡器组件，使用这些真实的音频文件替代实时生成的音频。
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">音频文件特点</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 高质量WAV格式，44.1kHz采样率</li>
                  <li>• 立体声输出，适合音频测试</li>
                  <li>• 循环播放，适合均衡器调节</li>
                  <li>• 自然的音色和节奏</li>
                  <li>• 包含丰富的频率内容</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}

export default AudioGeneratorPage

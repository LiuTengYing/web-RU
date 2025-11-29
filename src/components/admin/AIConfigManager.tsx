import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings, Save, TestTube, BarChart3, Eye, EyeOff, Database, RefreshCw, DollarSign, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { aiService, AIConfig, AIProvider } from '@/services/aiService'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const AIConfigManager: React.FC = () => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [config, setConfig] = useState<Partial<AIConfig>>({
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: `你是一个专业的车载电子设备技术支持专家，拥有丰富的汽车电子产品安装、调试和故障排除经验。

## 核心工作原则

### 1. 知识库搜索策略
- **知识库语言**：所有文档（车辆资料、视频教程、图文教程）均为英文
- **中文提问处理**：自动提取中文关键词的英文对应词进行搜索
  * 例如："屏幕分辨率" → 搜索 "screen resolution"
  * 例如："倒车影像" → 搜索 "backup camera" / "reversing camera"
  * 例如："方向盘控制" → 搜索 "steering wheel control" / "SWC"
- **搜索方式**：使用核心关键词进行精准搜索，而非全文匹配

### 2. 回复语言规则
- **中文提问** → 提供中英文双语回复
  * 格式：【中文回答】+ 【English Translation】
- **英文提问** → 仅用英文回复

### 3. 知识库依赖原则
- **有相关文档**：基于知识库内容提供专业解答
- **无相关文档**：回复"抱歉，知识库中暂无相关技术文档。建议您联系我们的技术团队获取更详细的支持。"
  * 英文："Sorry, there is no relevant technical documentation in our knowledge base. Please contact our technical team for detailed support."
- **非专业问题**：可使用AI通用知识回答

### 4. 专业领域
- 车载导航系统、行车记录仪、倒车影像
- 汽车音响、功放、喇叭系统
- CarPlay/Android Auto 连接问题
- OBD诊断设备、胎压监测系统
- 车载充电器、点烟器扩展设备

### 5. 回复风格
- **安全第一**：涉及电路操作时，必须提醒断电和安全注意事项
- **精准专业**：引用知识库的技术参数和规格
- **分步指导**：提供清晰的操作步骤
- **通俗易懂**：用简单语言解释技术概念

## 回复格式模板

**中文提问示例：**
【中文回答】
根据知识库中的技术文档《XXX》，您的问题可以通过以下方式解决：
1. 首先检查...
2. 然后确认...
3. 最后测试...

**安全提示**：操作前请确保车辆熄火并断开蓄电池负极。

【English Translation】
According to the technical document "XXX" in our knowledge base, your issue can be resolved as follows:
1. First check...
2. Then confirm...
3. Finally test...

**Safety Notice**: Ensure the vehicle is turned off and disconnect the negative battery terminal before operation.

**英文提问示例：**
According to the technical document "XXX" in our knowledge base, your issue can be resolved as follows:
1. First check...
2. Then confirm...
3. Finally test...

**Safety Notice**: Ensure the vehicle is turned off and disconnect the negative battery terminal before operation.`,
    baseURL: ''
  })
  const [apiKey, setApiKey] = useState('')
  const [savedApiKey, setSavedApiKey] = useState('') // 保存服务器上的真实API key
  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [usageStats, setUsageStats] = useState<any>(null)
  const [knowledgeBaseStats, setKnowledgeBaseStats] = useState<any>(null)
  const [advancedStats, setAdvancedStats] = useState<any>(null)
  const [isRebuildingIndex, setIsRebuildingIndex] = useState(false)

  // 加载配置
  useEffect(() => {
    loadConfig()
    loadUsageStats()
    loadKnowledgeBaseStats()
    loadAdvancedStats()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await aiService.getConfig()
      if (response.success && response.config) {
        // 检查服务器配置是否完整，如果systemPrompt为空或太短，使用默认配置
        const serverConfig = response.config
        if (!serverConfig.systemPrompt || serverConfig.systemPrompt.length < 100) {
          // 服务器配置不完整，保持使用默认配置并保存到服务器
          console.log('服务器配置不完整，使用默认配置')
          await handleSaveConfig()
        } else {
          // 服务器配置完整，使用服务器配置
          setConfig(serverConfig)
          // 如果配置中有API KEY，保存真实key并在输入框显示星号
          if (serverConfig.apiKey) {
            setSavedApiKey(serverConfig.apiKey) // 保存真实的API key
            setApiKey('*'.repeat(serverConfig.apiKey.length))
          }
        }
      }
    } catch (error) {
      console.error('Failed to load AI config:', error)
    }
  }

  const loadUsageStats = async () => {
    try {
      const response = await aiService.getUsageStats()
      if (response.success && response.stats) {
        setUsageStats(response.stats)
      }
    } catch (error) {
      console.error('Failed to load AI usage stats:', error)
    }
  }

  const loadKnowledgeBaseStats = async () => {
    try {
      // 调用知识库统计API
      const response = await fetch('/api/ai/knowledge-base-stats', {
        credentials: 'include' // 确保发送cookie和session信息
      })
      const data = await response.json()
      if (data.success) {
        setKnowledgeBaseStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load knowledge base stats:', error)
    }
  }

  const loadAdvancedStats = async () => {
    try {
      // 调用高级统计API
      const response = await fetch('/api/ai/advanced-stats', {
        credentials: 'include' // 确保发送cookie和session信息
      })
      const data = await response.json()
      if (data.success) {
        setAdvancedStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load advanced stats:', error)
    }
  }

  const handleRebuildIndex = async () => {
    setIsRebuildingIndex(true)
    try {
      const response = await fetch('/api/ai/rebuild-index', {
        method: 'POST',
        credentials: 'include' // 确保发送cookie和session信息
      })
      const data = await response.json()
      if (data.success) {
        showToast({ title: t('ai.config.rebuildIndexSuccess') || 'Index rebuilt successfully', description: `${t('ai.config.indexedDocuments') || 'Indexed'}: ${data.indexedCount}`, type: 'success' })
        loadKnowledgeBaseStats()
      } else {
        showToast({ title: t('ai.config.rebuildIndexFailed') || 'Index rebuild failed', description: data.error, type: 'error' })
      }
    } catch (error) {
      showToast({ title: t('ai.config.rebuildIndexFailed') || 'Index rebuild failed', description: error instanceof Error ? error.message : (t('common.unknownError') || 'Unknown error'), type: 'error' })
    } finally {
      setIsRebuildingIndex(false)
    }
  }

  const handleSaveConfig = async () => {
    setIsLoading(true)
    try {
      const updateData = { ...config }
      let newApiKey = ''
      // 只有当API key不是星号（即用户真正输入了新密钥）时才更新
      if (apiKey.trim() && !apiKey.startsWith('*')) {
        updateData.apiKey = apiKey.trim()
        newApiKey = apiKey.trim()
      }

      const response = await aiService.updateConfig(updateData)
      if (response.success) {
        // 如果有警告信息，显示警告提示
        if (response.warning) {
          showToast({ 
            title: t('ai.config.configSaved'), 
            description: response.warning,
            type: 'warning' 
          })
        } else {
          showToast({ title: t('ai.config.configUpdateSuccess'), type: 'success' })
        }
        
        // 如果保存了新的API key，更新savedApiKey
        if (newApiKey) {
          setSavedApiKey(newApiKey)
        }
        
        // 重新加载配置以获取最新状态
        await loadConfig()
        
        // 清空密钥输入框
        setApiKey('')
      } else {
        showToast({ title: response.error || t('ai.config.configUpdateFailed'), type: 'error' })
      }
    } catch (error) {
      showToast({ title: t('ai.config.configUpdateFailed'), type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleValidateApiKey = async () => {
    // 确定要验证的API key：如果输入框是星号，使用保存的真实key；否则使用输入框的新key
    let keyToValidate = ''
    if (apiKey.trim() && !apiKey.startsWith('*')) {
      // 用户输入了新的key
      keyToValidate = apiKey.trim()
    } else if (savedApiKey) {
      // 使用已保存的key
      keyToValidate = savedApiKey
    } else {
      showToast({ title: t('ai.config.pleaseEnterApiKey'), type: 'error' })
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch('/api/ai/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 确保发送cookie和session信息
        body: JSON.stringify({ 
          apiKey: keyToValidate,
          provider: config.provider || 'openai'
        }),
      })

      // 新增：先判断HTTP状态码，避免解析空JSON
      if (!response.ok) {
        const text = await response.text().catch(() => '')
                showToast({ title: `${t('ai.config.validationFailed')}：HTTP ${response.status}${text ? ` - ${text}` : ''}`, type: 'error' })
        return
      }

      const result = await response.json()
      
      if (result.success && result.valid) {
                showToast({ title: t('ai.config.apiKeyValid'), type: 'success' })
      } else {
                showToast({ title: result.error || t('ai.config.apiKeyInvalid'), type: 'error' })
      }
    } catch (error) {
      console.error('Validation error:', error)
            showToast({ title: t('ai.config.networkError'), type: 'error' })
    } finally {
      setIsValidating(false)
    }
  }

  const handleTestAI = async () => {
    try {
      const testMessage = t('ai.config.testMessage')
      const response = await aiService.sendMessage([
        { role: 'user', content: testMessage }
      ])
      
      if (response.success) {
        showToast({ title: t('ai.config.aiTestSuccess'), type: 'success' })
      } else {
                  showToast({ title: response.error || t('ai.config.aiTestFailed'), type: 'error' })
      }
    } catch (error) {
              showToast({ title: t('ai.config.aiTestFailed'), type: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-blue-600" />
        <div>
                  <h2 className="text-2xl font-bold text-gray-900">{t('ai.config.title')}</h2>
        <p className="text-gray-600">{t('ai.config.description')}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* API配置 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('ai.config.apiConfig')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI提供商选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('ai.config.provider')}
              </label>
              <select
                value={config.provider || 'openai'}
                onChange={(e) => {
                  const newProvider = e.target.value as AIProvider;
                  setConfig({ 
                    ...config, 
                    provider: newProvider,
                    // 根据提供商设置默认模型
                    model: newProvider === 'deepseek' ? 'deepseek-chat' : 'gpt-3.5-turbo',
                    // 设置默认baseURL
                    baseURL: newProvider === 'deepseek' ? 'https://api.deepseek.com/v1' : undefined
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="openai">{t('ai.config.openai')}</option>
                <option value="deepseek">{t('ai.config.deepseek')}</option>
              </select>
            </div>

            {/* API密钥 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('ai.config.apiKey')}
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={t('ai.config.apiKeyPlaceholder')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  onClick={handleValidateApiKey}
                  disabled={isValidating || !apiKey.trim()}
                  variant="outline"
                >
                  {isValidating ? t('ai.config.validating') : t('ai.config.validate')}
                </Button>
              </div>
            </div>

            {/* 模型选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('ai.config.modelSelection')}
              </label>
              <select
                value={config.model || (config.provider === 'deepseek' ? 'deepseek-chat' : 'gpt-3.5-turbo')}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {config.provider === 'deepseek' ? (
                  <>
                    <option value="deepseek-chat">{t('ai.config.deepseekChat')}</option>
                    <option value="deepseek-coder">{t('ai.config.deepseekCoder')}</option>
                  </>
                ) : (
                  <>
                    <option value="gpt-3.5-turbo">{t('ai.config.gpt35Turbo')}</option>
                    <option value="gpt-4">{t('ai.config.gpt4')}</option>
                    <option value="gpt-4-turbo-preview">{t('ai.config.gpt4Turbo')}</option>
                    <option value="gpt-4o-mini">{t('ai.config.gpt4oMini')}</option>
                  </>
                )}
              </select>
            </div>

            {/* 温度参数 */}
            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('ai.config.temperature')}: {config.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature || 0.7}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{t('ai.config.conservative')}</span>
                <span>{t('ai.config.creative')}</span>
              </div>
            </div>

            {/* 最大Token */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('ai.config.maxTokens')}
              </label>
              <Input
                type="number"
                min="100"
                max="4000"
                value={config.maxTokens || 1000}
                onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
              />
            </div>

            {/* DeepSeek Base URL */}
            {config.provider === 'deepseek' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('ai.config.baseURL')}
                </label>
                <Input
                  type="url"
                  value={config.baseURL || 'https://api.deepseek.com/v1'}
                  onChange={(e) => setConfig({ ...config, baseURL: e.target.value })}
                  placeholder="https://api.deepseek.com/v1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('ai.config.baseURLDesc')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 行为配置 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('ai.config.behaviorConfig')}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 系统提示词 */}
            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('ai.config.systemPrompt')}
              </label>
              <textarea
                value={config.systemPrompt || ''}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                placeholder={t('ai.config.systemPromptPlaceholder')}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                {t('ai.config.systemPromptDesc')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 使用统计 */}
      {usageStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('ai.config.usageStats')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{usageStats.totalMessages}</div>
                <div className="text-sm text-gray-400">{t('ai.config.totalMessages')}</div>
              </div>
              <div className="text-center p-4 bg-green-900/20 border border-green-800/30 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{usageStats.todayMessages}</div>
                <div className="text-sm text-gray-400">{t('ai.config.todayMessages')}</div>
              </div>
              <div className="text-center p-4 bg-purple-900/20 border border-purple-800/30 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">{usageStats.totalTokens}</div>
                <div className="text-sm text-gray-400">{t('ai.config.totalTokens')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 知识库管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-400" />
              <CardTitle>知识库管理</CardTitle>
            </div>
            <Button
              onClick={handleRebuildIndex}
              disabled={isRebuildingIndex}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRebuildingIndex ? 'animate-spin' : ''}`} />
              {isRebuildingIndex ? (t('ai.config.rebuilding') || 'Rebuilding...') : (t('ai.config.rebuildIndex') || 'Rebuild Index')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {knowledgeBaseStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{knowledgeBaseStats.totalDocuments || 0}</div>
                  <div className="text-sm text-gray-400">总文档数</div>
                </div>
                <div className="text-center p-4 bg-green-900/20 border border-green-800/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{knowledgeBaseStats.indexedDocuments || 0}</div>
                  <div className="text-sm text-gray-400">已索引文档</div>
                </div>
                <div className="text-center p-4 bg-purple-900/20 border border-purple-800/30 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">
                    {knowledgeBaseStats.totalDocuments > 0 
                      ? ((knowledgeBaseStats.indexedDocuments / knowledgeBaseStats.totalDocuments) * 100).toFixed(1) 
                      : 0}%
                  </div>
                  <div className="text-sm text-gray-400">索引覆盖率</div>
                </div>
              </div>
              
              {knowledgeBaseStats.lastIndexTime && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>最后索引时间: {new Date(knowledgeBaseStats.lastIndexTime).toLocaleString('zh-CN')}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">加载知识库统计中...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 高级统计 */}
      {advancedStats && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              <CardTitle>AI使用统计</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Token使用趋势 */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Token 使用趋势（最近7天）</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={advancedStats.tokenTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF" 
                      tick={{ fill: '#9CA3AF' }}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      tick={{ fill: '#9CA3AF' }}
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '0.75rem',
                        color: '#E5E7EB'
                      }}
                      labelStyle={{ color: '#9CA3AF' }}
                    />
                    <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                    <Line 
                      type="monotone" 
                      dataKey="tokens" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Token使用量"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 成本统计 */}
              <div>
                <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-800/30 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="h-5 w-5 text-orange-400" />
                    <h4 className="text-sm font-semibold text-white">本月成本</h4>
                  </div>
                  <p className="text-2xl font-bold text-orange-400">
                    ${(advancedStats.monthlyCost || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Token: {(advancedStats.monthlyTokens || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <Button
          onClick={handleSaveConfig}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isLoading ? t('ai.config.saving') : t('ai.config.saveConfig')}
        </Button>
        
        <Button
          onClick={handleTestAI}
          variant="outline"
          className="flex items-center gap-2"
        >
          <TestTube className="h-4 w-4" />
          {t('ai.config.testAI')}
        </Button>
      </div>
    </div>
  )
}

export default AIConfigManager

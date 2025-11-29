import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Phone, MapPin, MessageSquare, Send, CheckCircle, AlertCircle, ArrowRight, Users, Clock, ExternalLink, MessageCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import WorldTimeDisplay from '@/components/WorldTimeDisplay'
import { getContactInfo, submitContactForm, ContactInfo } from '@/services/contactService'

// 图标映射
const iconMap: { [key: string]: React.ComponentType<any> } = {
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  MessageCircle
}

// 表单验证接口
interface FormErrors {
  name?: string
  email?: string
  orderNumber?: string
  subject?: string
  message?: string
}

// 表单验证规则
const VALIDATION_RULES = {
  name: {
    minLength: 2,
    maxLength: 50,
    required: true
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  orderNumber: {
    minLength: 3,
    maxLength: 100,
    required: true
  },
  subject: {
    minLength: 5,
    maxLength: 100,
    required: true
  },
  message: {
    minLength: 10,
    maxLength: 1000,
    required: true
  }
}

/**
 * 联系我们页面组件
 */
const Contact: React.FC = () => {
  const { t } = useTranslation()
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  // const [lastSubmitTime] = useState<number>(0)
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orderNumber: '',
    subject: '',
    message: ''
  })

  // 表单验证错误
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  // 加载联系信息
  useEffect(() => {
    const loadContactInfo = async () => {
      try {
        const info = await getContactInfo()
        setContactInfo(info.filter(item => item.isActive).sort((a, b) => a.order - b.order))
      } catch (error) {
        console.error('Failed to load contact info:', error)
      }
    }
    loadContactInfo()
  }, [])

  // 验证单个字段
  const validateField = (field: keyof typeof formData, value: string): string | undefined => {
    const rules = VALIDATION_RULES[field]
    
    if (rules.required && !value.trim()) {
      return t(`contact.form.validation.${field}Required`)
    }
    
    if (field === 'email' && value && 'pattern' in rules && rules.pattern instanceof RegExp && !rules.pattern.test(value)) {
      return t('contact.form.validation.emailInvalid')
    }
    
    if ('minLength' in rules && typeof rules.minLength === 'number' && value.length < rules.minLength) {
      return t(`contact.form.validation.${field}TooShort`, { min: rules.minLength })
    }
    
    if ('maxLength' in rules && typeof rules.maxLength === 'number' && value.length > rules.maxLength) {
      return t(`contact.form.validation.${field}TooLong`, { max: rules.maxLength })
    }
    
    return undefined
  }

  // 验证整个表单
  // const validateForm = (): boolean => {
  //   const errors: FormErrors = {}
  //   let isValid = true
    
  //   Object.keys(formData).forEach(field => {
  //     const error = validateField(field as keyof typeof formData, formData[field as keyof typeof formData])
  //     if (error) {
  //       errors[field as keyof FormErrors] = error
  //       isValid = false
  //     }
  //   })
    
  //   setFormErrors(errors)
  //   return isValid
  // }

  // 处理输入变化
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 实时验证已触摸的字段
    if (touchedFields.has(field)) {
      const error = validateField(field as keyof typeof formData, value)
      setFormErrors(prev => ({
        ...prev,
        [field]: error
      }))
    }
  }

  // 处理字段失焦
  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => new Set([...prev, field]))
    const error = validateField(field as keyof typeof formData, formData[field as keyof typeof formData])
    setFormErrors(prev => ({
      ...prev,
      [field]: error
    }))
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    
    try {
      // 传递 t 函数给 submitContactForm
      await submitContactForm(formData, t)
      setSubmitStatus('success')
      setSubmitMessage('')
      setFormData({ name: '', email: '', orderNumber: '', subject: '', message: '' })
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitStatus('error')
      setSubmitMessage(error instanceof Error ? error.message : t('contact.form.error.message'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // 获取字符计数样式
  const getCharCountStyle = (current: number, max: number) => {
    const percentage = current / max
    if (percentage >= 0.9) return 'text-red-400'
    if (percentage >= 0.7) return 'text-yellow-400'
    return 'text-gray-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 text-white text-sm font-medium mb-6 shadow-lg">
              <MessageSquare className="h-5 w-5 mr-2" />
              {t('contact.title')}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {t('contact.title')}
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 联系信息 */}
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center text-white text-2xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  {t('contact.info.title')}
                </CardTitle>
                <CardDescription className="text-gray-300 text-lg leading-relaxed">
                  {t('contact.info.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {contactInfo.length > 0 ? (
                  contactInfo.map((info) => {
                    const IconComponent = iconMap[info.icon]
                    const getLabel = (type: string) => {
                      switch (type) {
                        case 'email':
                          return t('contact.info.email')
                        case 'phone':
                          return t('contact.info.phone')
                        case 'address':
                          return t('contact.info.address')
                        case 'online':
                          return t('contact.info.hours')
                        case 'forum':
                          return t('contact.info.forum')
                        case 'whatsapp':
                          return t('contact.info.whatsapp')
                        default:
                          return info.label
                      }
                    }
                    return (
                      <div 
                        key={info.id} 
                        className={`group flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-br from-gray-700/30 to-gray-600/30 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300 hover:scale-[1.02] ${
                          info.type === 'forum' ? 'cursor-pointer' : ''
                        }`}
                        onClick={info.type === 'forum' ? () => window.open(info.value, '_blank') : undefined}
                      >
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-lg mb-1">{getLabel(info.type)}</p>
                          <p className="text-gray-300 text-base truncate">
                            {info.type === 'forum' ? t('contact.info.clickToEnter') : info.value}
                          </p>
                        </div>
                        {info.type === 'forum' && (
                          <div className="flex-shrink-0">
                            <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {t('contact.info.title')}
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed mb-6 max-w-md mx-auto">
                      {t('contact.description')}
                    </p>
                    <Button 
                      size="lg"
                      variant="outline"
                      className="border-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-all duration-300"
                      onClick={() => window.location.href = '/admin'}
                    >
                      <span className="mr-2">{t('common.settings')}</span>
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 联系表单 */}
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center text-white text-2xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                    <Send className="h-6 w-6 text-white" />
                  </div>
                  {t('contact.form.submit')}
                </CardTitle>
                <CardDescription className="text-gray-300 text-lg leading-relaxed">
                  {t('contact.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-white mb-2">
                        {t('contact.form.name')}
                        <span className="text-red-400 ml-1">*</span>
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        onBlur={() => handleFieldBlur('name')}
                        placeholder={t('contact.form.namePlaceholder')}
                        className={`bg-gray-700/50 border-2 text-white placeholder-gray-400 focus:ring-blue-500 transition-all duration-300 ${
                          formErrors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-blue-500'
                        }`}
                        maxLength={VALIDATION_RULES.name.maxLength}
                      />
                      {formErrors.name && (
                        <p className="text-red-400 text-sm mt-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {formErrors.name}
                        </p>
                      )}
                      <div className="text-right mt-1">
                        <span className={`text-xs ${getCharCountStyle(formData.name.length, VALIDATION_RULES.name.maxLength)}`}>
                          {formData.name.length}/{VALIDATION_RULES.name.maxLength}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-white mb-2">
                        {t('contact.form.email')}
                        <span className="text-red-400 ml-1">*</span>
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        onBlur={() => handleFieldBlur('email')}
                        placeholder={t('contact.form.emailPlaceholder')}
                        className={`bg-gray-700/50 border-2 text-white placeholder-gray-400 focus:ring-blue-500 transition-all duration-300 ${
                          formErrors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-blue-500'
                        }`}
                      />
                      {formErrors.email && (
                        <p className="text-red-400 text-sm mt-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {formErrors.email}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">
                      {t('contact.form.orderNumber')}
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                      value={formData.orderNumber}
                      onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                      onBlur={() => handleFieldBlur('orderNumber')}
                      placeholder={t('contact.form.orderNumberPlaceholder')}
                      className={`bg-gray-700/50 border-2 text-white placeholder-gray-400 focus:ring-blue-500 transition-all duration-300 ${
                        formErrors.orderNumber ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-blue-500'
                      }`}
                      maxLength={VALIDATION_RULES.orderNumber.maxLength}
                    />
                    {formErrors.orderNumber && (
                      <p className="text-red-400 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.orderNumber}
                      </p>
                    )}
                    <div className="text-right mt-1">
                      <span className={`text-xs ${getCharCountStyle(formData.orderNumber.length, VALIDATION_RULES.orderNumber.maxLength)}`}>
                        {formData.orderNumber.length}/{VALIDATION_RULES.orderNumber.maxLength}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">
                      {t('contact.form.subject')}
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      onBlur={() => handleFieldBlur('subject')}
                      placeholder={t('contact.form.subjectPlaceholder')}
                      className={`bg-gray-700/50 border-2 text-white placeholder-gray-400 focus:ring-blue-500 transition-all duration-300 ${
                        formErrors.subject ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-blue-500'
                      }`}
                      maxLength={VALIDATION_RULES.subject.maxLength}
                    />
                    {formErrors.subject && (
                      <p className="text-red-400 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.subject}
                      </p>
                    )}
                    <div className="text-right mt-1">
                      <span className={`text-xs ${getCharCountStyle(formData.subject.length, VALIDATION_RULES.subject.maxLength)}`}>
                        {formData.subject.length}/{VALIDATION_RULES.subject.maxLength}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">
                      {t('contact.form.message')}
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    <textarea
                      className={`flex w-full rounded-xl border-2 bg-gray-700/50 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 transition-all duration-300 resize-none ${
                        formErrors.message ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-blue-500'
                      }`}
                      rows={6}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      onBlur={() => handleFieldBlur('message')}
                      placeholder={t('contact.form.messagePlaceholder')}
                      maxLength={VALIDATION_RULES.message.maxLength}
                    />
                    {formErrors.message && (
                      <p className="text-red-400 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.message}
                      </p>
                    )}
                    <div className="text-right mt-1">
                      <span className={`text-xs ${getCharCountStyle(formData.message.length, VALIDATION_RULES.message.maxLength)}`}>
                        {formData.message.length}/{VALIDATION_RULES.message.maxLength}
                      </span>
                    </div>
                  </div>

                  {/* 提交状态提示 */}
                  {submitStatus === 'success' && (
                    <div className="p-6 rounded-xl bg-green-900/20 border border-green-800/50">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-6 w-6 text-green-400 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-green-300 font-semibold text-lg mb-2">
                            {t('contact.form.success.title')}
                          </h3>
                          <p className="text-green-200 mb-3">
                            {t('contact.form.success.message')}
                          </p>
                          <p className="text-green-300 text-sm">
                            {t('contact.form.success.note')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="p-6 rounded-xl bg-red-900/20 border border-red-800/50">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-6 w-6 text-red-400 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-red-300 font-semibold text-lg mb-2">
                            {t('contact.form.error.title')}
                          </h3>
                          <p className="text-red-200 mb-3">
                            {submitMessage || t('contact.form.error.message')}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => setSubmitStatus('idle')}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              {t('contact.form.error.tryAgain')}
                            </button>
                            <span className="text-red-300 text-sm self-center">
                              {t('contact.form.error.contactDirect')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    type="submit"
                    size="lg"
                    disabled={isSubmitting || Object.keys(formErrors).some(key => formErrors[key as keyof FormErrors])}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        {t('contact.form.submitting')}
                      </>
                    ) : (
                      <>
                        <Send className="mr-3 h-5 w-5" />
                        {t('contact.form.submit')}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* 世界时间显示 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <WorldTimeDisplay showBusinessHours={true} />
            </div>
            
            {/* 响应时间说明 */}
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 backdrop-blur-sm shadow-xl">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {t('contact.info.response')}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {t('contact.responseTime')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact
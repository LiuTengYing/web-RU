/**
 * 联系我们服务
 * 管理联系信息和表单提交
 */

export interface ContactInfo {
  id: string
  type: 'email' | 'phone' | 'whatsapp' | 'telegram' | 'vk' | 'youtube'
  label: string
  value: string
  icon: string
  qrCode?: string // 二维码图片URL
  isActive: boolean
  order: number
}

export interface ContactForm {
  id: string
  name: string
  email: string
  orderNumber?: string
  subject: string
  message: string
  submitTime: string
  status: 'pending' | 'read' | 'replied'
  ip?: string
  userAgent?: string
}

const VALIDATION_RULES = {
  name: {
    minLength: 2,
    maxLength: 50,
    required: true,
    pattern: /^[\u4e00-\u9fa5a-zA-Z\s]+$/  // 中文、英文、空格
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 100
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

// 敏感词过滤列表（简化版）
const SPAM_KEYWORDS = [
  '广告', '推广', '营销', '贷款', '投资', '赚钱',
  'spam', 'advertisement', 'promotion', 'marketing'
]

import { TFunction } from 'i18next'

// 获取客户端IP地址
const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip || 'unknown'
  } catch (error) {
    return 'unknown'
  }
}

// 检查频率限制
const checkRateLimit = (_ip: string): boolean => {
  // 客户端不再做本地频率限制，交由后端校验
  return true
}

// 检查垃圾内容
const checkSpamContent = (formData: any): boolean => {
  const content = `${formData.name} ${formData.email} ${formData.subject} ${formData.message}`.toLowerCase()
  return SPAM_KEYWORDS.some(keyword => content.includes(keyword.toLowerCase()))
}

// 清理表单数据
const sanitizeFormData = (formData: any): any => {
  return {
    name: formData.name?.trim() || '',
    email: formData.email?.trim() || '',
    orderNumber: formData.orderNumber?.trim() || '',
    subject: formData.subject?.trim() || '',
    message: formData.message?.trim() || ''
  }
}

const validateFormData = (formData: Omit<ContactForm, 'id' | 'submitTime' | 'status'>, t: TFunction): string[] => {
  const errors: string[] = []
  
  // 验证姓名
  if (!formData.name || !formData.name.trim()) {
    errors.push(t('contact.form.validation.nameRequired'))
  } else {
    const name = formData.name.trim()
    if (name.length < VALIDATION_RULES.name.minLength) {
      errors.push(t('contact.form.validation.nameMinLength', { min: VALIDATION_RULES.name.minLength }))
    }
    if (name.length > VALIDATION_RULES.name.maxLength) {
      errors.push(t('contact.form.validation.nameMaxLength', { max: VALIDATION_RULES.name.maxLength }))
    }
    if (!VALIDATION_RULES.name.pattern.test(name)) {
      errors.push(t('contact.form.validation.namePattern'))
    }
  }
  
  // 验证邮箱
  if (!formData.email || !formData.email.trim()) {
    errors.push(t('contact.form.validation.emailRequired'))
  } else {
    const email = formData.email.trim()
    if (!VALIDATION_RULES.email.pattern.test(email)) {
      errors.push(t('contact.form.validation.emailInvalid'))
    }
    if (email.length > VALIDATION_RULES.email.maxLength) {
      errors.push(t('contact.form.validation.emailMaxLength', { max: VALIDATION_RULES.email.maxLength }))
    }
  }
  
  // 验证主题
  if (!formData.subject || !formData.subject.trim()) {
    errors.push(t('contact.form.validation.subjectRequired'))
  } else {
    const subject = formData.subject.trim()
    if (subject.length < VALIDATION_RULES.subject.minLength) {
      errors.push(t('contact.form.validation.subjectMinLength', { min: VALIDATION_RULES.subject.minLength }))
    }
    if (subject.length > VALIDATION_RULES.subject.maxLength) {
      errors.push(t('contact.form.validation.subjectMaxLength', { max: VALIDATION_RULES.subject.maxLength }))
    }
  }
  
  // 验证消息
  if (!formData.message || !formData.message.trim()) {
    errors.push(t('contact.form.validation.messageRequired'))
  } else {
    const message = formData.message.trim()
    if (message.length < VALIDATION_RULES.message.minLength) {
      errors.push(t('contact.form.validation.messageMinLength', { min: VALIDATION_RULES.message.minLength }))
    }
    if (message.length > VALIDATION_RULES.message.maxLength) {
      errors.push(t('contact.form.validation.messageMaxLength', { max: VALIDATION_RULES.message.maxLength }))
    }
  }
  
  return errors
}

// 修改 submitContactForm 函数签名
export const submitContactForm = async (formData: Omit<ContactForm, 'id' | 'submitTime' | 'status'>, t: TFunction): Promise<ContactForm> => {
  // 验证表单数据
  const validationErrors = validateFormData(formData, t)
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join(', '))
  }
  
  // 检查提交频率限制
  const ip = await getClientIP()
  if (!checkRateLimit(ip)) {
    throw new Error(t('contact.form.validation.rateLimitExceeded'))
  }
  
  // 检查垃圾内容
  if (checkSpamContent(formData)) {
    throw new Error(t('contact.form.validation.spamDetected'))
  }
  
    try {
      // 清理数据
      const sanitizedData = sanitizeFormData(formData)
      
      // 提交到数据库，带上客户端时间戳
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...sanitizedData,
          ip,
          userAgent: navigator.userAgent,
          clientTimestamp: Date.now() // 发送客户端时间戳
        })
      })
      
      const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || '')
    }
    
    const form: ContactForm = {
      id: data.feedback._id,
      name: data.feedback.name,
      email: data.feedback.email,
      orderNumber: data.feedback.orderNumber,
      subject: data.feedback.subject,
      message: data.feedback.message,
      submitTime: data.feedback.submitTime,
      status: data.feedback.status,
      ip: data.feedback.ip,
      userAgent: data.feedback.userAgent
    }
    
    return form
  } catch (error: any) {
    console.error(error)
    throw error
  }
}

/**
 * 获取联系表单列表
 */
export const getContactForms = async (): Promise<ContactForm[]> => {
  try {
    const response = await fetch('/api/feedback')
    const data = await response.json()
    
    if (data.success) {
      return data.feedback.map((item: any) => ({
        id: item._id,
        name: item.name,
        email: item.email,
        orderNumber: item.orderNumber,
        subject: item.subject,
        message: item.message,
        submitTime: item.submitTime,
        status: item.status,
        ip: item.ip,
        userAgent: item.userAgent
      }))
    }
    return []
  } catch (error) {
    console.error(error)
    return []
  }
}

/**
 * 保存联系表单（兼容性函数）
 */
export const saveContactForms = async (_forms: ContactForm[]): Promise<void> => {
  // 这个函数现在不需要实现，因为数据直接保存到数据库
  console.warn('saveContactForms is deprecated, data is now saved directly to database')
}

/**
 * 更新表单状态
 */
export const updateFormStatus = async (id: string, status: ContactForm['status']): Promise<ContactForm | null> => {
  try {
    const response = await fetch(`/api/feedback/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    })
    
    const data = await response.json()
    if (data.success) {
      return {
        id: data.feedback._id,
        name: data.feedback.name,
        email: data.feedback.email,
        orderNumber: data.feedback.orderNumber,
        subject: data.feedback.subject,
        message: data.feedback.message,
        submitTime: data.feedback.submitTime,
        status: data.feedback.status,
        ip: data.feedback.ip,
        userAgent: data.feedback.userAgent
      }
    }
    return null
  } catch (error) {
    console.error(error)
    return null
  }
}

/**
 * 删除表单
 */
export const deleteForm = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/feedback/${id}`, {
      method: 'DELETE'
    })
    
    const data = await response.json()
    return data.success
  } catch (error) {
    console.error(error)
    return false
  }
}

/**
 * 导出联系表单数据
 */
export const exportContactForms = async (): Promise<string> => {
  try {
    const response = await fetch('/api/feedback/export')
    return await response.text()
  } catch (error) {
    console.error(error)
    throw error
  }
}

/**
 * 清空所有联系表单
 */
export const clearAllForms = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/feedback', {
      method: 'DELETE'
    })
    
    const data = await response.json()
    return data.success
  } catch (error) {
    console.error(error)
    return false
  }
}

/**
 * 获取未读表单数量
 */
export const getUnreadFormsCount = async (): Promise<number> => {
  try {
    const response = await fetch('/api/feedback/unread/count')
    const data = await response.json()
    
    if (data.success) {
      return data.count
    }
    return 0
  } catch (error) {
    console.error(error)
    return 0
  }
}

/**
 * 获取联系信息
 */
export const getContactInfo = async (): Promise<ContactInfo[]> => {
  try {
    const response = await fetch('/api/contact')
    const data = await response.json()
    
    if (data.success) {
      return data.contactInfo.map((item: any) => ({
        id: item._id,
        type: item.type,
        label: item.label,
        value: item.value,
        icon: item.icon,
        isActive: item.isActive,
        order: item.order
      }))
    }
    return []
  } catch (error) {
    console.error(error)
    return []
  }
}

/**
 * 创建联系信息
 */
export const createContactInfo = async (info: Omit<ContactInfo, 'id'>): Promise<ContactInfo> => {
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(info)
    })
    
    const data = await response.json()
    if (data.success) {
      return {
        id: data.contactInfo._id,
        type: data.contactInfo.type,
        label: data.contactInfo.label,
        value: data.contactInfo.value,
        icon: data.contactInfo.icon,
        isActive: data.contactInfo.isActive,
        order: data.contactInfo.order
      }
    }
    throw new Error(data.error || '')
  } catch (error) {
    console.error(error)
    throw error
  }
}

/**
 * 添加联系信息（兼容性函数）
 */
export const addContactInfo = async (info: Omit<ContactInfo, 'id'>): Promise<ContactInfo> => {
  return await createContactInfo(info)
}

/**
 * 更新联系信息
 */
export const updateContactInfo = async (id: string, updates: Partial<ContactInfo>): Promise<ContactInfo> => {
  try {
    const response = await fetch(`/api/contact/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })
    
    const data = await response.json()
    if (data.success) {
      return {
        id: data.contactInfo._id,
        type: data.contactInfo.type,
        label: data.contactInfo.label,
        value: data.contactInfo.value,
        icon: data.contactInfo.icon,
        isActive: data.contactInfo.isActive,
        order: data.contactInfo.order
      }
    }
    throw new Error(data.error || '')
  } catch (error) {
    console.error(error)
    throw error
  }
}

/**
 * 删除联系信息
 */
export const deleteContactInfo = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/contact/${id}`, {
      method: 'DELETE'
    })
    
    const data = await response.json()
    return data.success
  } catch (error) {
    console.error(error)
    return false
  }
}

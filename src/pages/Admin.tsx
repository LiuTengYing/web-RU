import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/ui/Toast'
import { 
  Car, 
  FileText, 
  Settings, 
  MessageSquare, 
  MessageCircle,
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  BookOpen,
  LogOut,
  Mail,
  Video,
  Lock,
  X,
  Globe,
  Bot,
  Eye,
  Activity,
  Bell,
  Tag,
  Image as ImageIcon,
  FolderOpen
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import AdminAuth from '@/components/AdminAuth'
import AdminDashboard from '@/components/admin/AdminDashboard'
import AnnouncementManager from '@/components/admin/AnnouncementManager'
import SystemMonitor from '@/components/admin/SystemMonitor'
import AIConfigManager from '@/components/admin/AIConfigManager'
import Modal from '@/components/ui/Modal'
import GeneralDocumentRichTextEditor from '@/components/GeneralDocumentRichTextEditor'
import StructuredArticleEditor from '@/components/StructuredArticleEditor'
import StructuredDocumentViewer from '@/components/StructuredDocumentViewer'
import EnhancedGeneralDocumentEditor from '@/components/EnhancedGeneralDocumentEditor'
import CategorySelector from '@/components/CategorySelector'
import CategoryManager from '@/components/CategoryManager'
import { 
  getAdminSettings, 
  updateAdminSettings, 
  resetAdminPassword,
  checkPasswordStrength
} from '@/services/adminService'
import { 
  getContactInfo, 
  addContactInfo, 
  updateContactInfo, 
  deleteContactInfo,
  getContactForms,
  updateFormStatus,
  deleteForm,
  exportContactForms,
  clearAllForms,
  getUnreadFormsCount
} from '@/services/contactService'
import { 
  createDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  DocumentData
} from '@/services/documentApi'
import {
  getVehicles as getVehiclesAPI,
  createVehicle as createVehicleAPI,
  updateVehicle as updateVehicleAPI,
  deleteVehicle as deleteVehicleAPI,
  Vehicle
} from '@/services/vehicleService'
import { checkAuthStatus, logout } from '@/services/authService'
import SoftwareDownloadsManager from '@/components/admin/SoftwareDownloadsManager'
import SiteImagesManager from '@/components/admin/SiteImagesManager'
import EnhancedDocumentManager from '@/components/admin/EnhancedDocumentManager'
import HierarchicalManager from '@/components/HierarchicalManager'
import { getSiteSettings, updateSiteSettings, SiteSettings } from '@/services/siteSettingsService'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
// 标签系统已被分类系统替代
import { getAllDocumentFeedback, addAdminReply as addReplyToFeedback, removeFeedback, removeReply, getUnrepliedFeedbackCount, type FeedbackWithDocument } from '@/services/feedbackService'
import { getAnnouncement, updateAnnouncement, toggleAnnouncement, type Announcement } from '@/services/announcementService'
import SystemConfigManager from '@/components/admin/SystemConfigManager'
// import OSSFileManager from './OSSFileManager' // 文件不存在，暂时注释掉

// 标签相关函数已被分类系统替代

/**
 * Admin Panel Page
 * For managing vehicles, documents and passwords
 */
const Admin: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { showToast } = useToast()
  const { refreshSiteSettings } = useSiteSettings()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // 网站设置状态
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: 'AutomotiveHu',
    siteSubtitle: 'Professional Aftermarket Car Navigation & Compatibility Solutions',
    logoText: 'AutomotiveHu',
    heroTitle: 'AutomotiveHu',
    heroSubtitle: 'Professional Aftermarket Car Navigation & Compatibility Solutions'
  })
  const [showSiteSettings, setShowSiteSettings] = useState(false)
  // 移除未使用的 vehicleCategory 状态 - 现在使用层级管理
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [showAddDocument, setShowAddDocument] = useState(false)
  const [showEnhancedDocumentEditor, setShowEnhancedDocumentEditor] = useState(false)
  const [editingEnhancedDocument, setEditingEnhancedDocument] = useState<any>(null)
  
  // System settings state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [sessionTimeout, setSessionTimeout] = useState(24)
  const [passwordStrength, setPasswordStrength] = useState<{isValid: boolean, message: string, strength: string}>({isValid: false, message: '', strength: 'weak'})
  const [settingsMessage, setSettingsMessage] = useState('')

  // Contact information management state
  const [contactInfo, setContactInfo] = useState<any[]>([])
  const [contactForms, setContactForms] = useState<any[]>([])
  const [showAddContactInfo, setShowAddContactInfo] = useState(false)
  const [editingContactInfo, setEditingContactInfo] = useState<any>(null)
  const [showEditContactInfo, setShowEditContactInfo] = useState(false)
  const [viewingForm, setViewingForm] = useState<any>(null)
  const [showViewForm, setShowViewForm] = useState(false)

  // Feedback management state
  const [allFeedback, setAllFeedback] = useState<FeedbackWithDocument[]>([])
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'video' | 'image-text' | 'structured'>('all')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null)
  const [replyToDelete, setReplyToDelete] = useState<{feedbackId: string, replyId: string} | null>(null)
  const [unrepliedCount, setUnrepliedCount] = useState(0)

  // Announcement management state
  const [, setAnnouncement] = useState<Announcement | null>(null)
  const [announcementContent, setAnnouncementContent] = useState('')
  const [announcementEnabled, setAnnouncementEnabled] = useState(false)
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'danger' | 'success'>('info')
  const [announcementFontSize, setAnnouncementFontSize] = useState<'sm' | 'md' | 'lg'>('md')
  const [announcementFontWeight, setAnnouncementFontWeight] = useState<'normal' | 'bold'>('normal')
  const [announcementFontStyle, setAnnouncementFontStyle] = useState<'normal' | 'italic'>('normal')
  const [announcementTextColor, setAnnouncementTextColor] = useState('')
  const [announcementScrolling, setAnnouncementScrolling] = useState(true)
  const [announcementCloseable, setAnnouncementCloseable] = useState(true)
  const [announcementRememberDays, setAnnouncementRememberDays] = useState(7)
  const [newContactInfo, setNewContactInfo] = useState({
    type: 'email' as 'email' | 'phone' | 'address' | 'online' | 'forum' | 'whatsapp',
    label: '',
    value: '',
    icon: 'Mail',
    isActive: true,
    order: 1
  })
  
  // Unread forms count state
  const [unreadFormsCount, setUnreadFormsCount] = useState(0)

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await checkAuthStatus()
        setIsAuthenticated(authStatus.isAuthenticated)
      } catch (error) {
        console.error(error)
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [])

  // 加载管理员设置
  useEffect(() => {
    if (isAuthenticated && activeTab === 'settings') {
      const loadSettings = async () => {
        const settings = await getAdminSettings()
        // 将毫秒转换为小时显示
        setSessionTimeout(Math.round(settings.sessionTimeout / 3600000))
      }
      loadSettings()
    }
  }, [isAuthenticated, activeTab])

  // 检查密码强度
  useEffect(() => {
    if (newPassword) {
      const strength = checkPasswordStrength(newPassword) // Assuming checkPasswordStrength is defined elsewhere or needs to be imported
      setPasswordStrength(strength)
    } else {
      setPasswordStrength({isValid: false, message: '', strength: 'weak'})
    }
  }, [newPassword])

  // 加载车型和文档数据
  useEffect(() => {
    if (isAuthenticated) {
      const loadData = async () => {
        try {
          // 并行加载车型和文档
          const [vehiclesData, structuredResult, videoResult, generalResult] = await Promise.all([
            getVehiclesAPI(),
            getDocuments({ documentType: 'structured', limit: 1000 }),
            getDocuments({ documentType: 'video', limit: 1000 }),
            getDocuments({ documentType: 'general', limit: 1000 })
          ])
          
          setVehicles(vehiclesData)
          
          const allDocuments = [
            ...structuredResult.documents,
            ...videoResult.documents,
            ...generalResult.documents
          ]
          
          setDocuments(allDocuments)
        } catch (error) {
          console.error(error)
          showToast({
            type: 'error',
            title: t('common.loadFailed'),
            description: t('common.cannotLoadData')
          })
        }
      }
      loadData()
    }
  }, [isAuthenticated])

  // 加载联系信息数据
  useEffect(() => {
    if (isAuthenticated && (activeTab === 'contact' || activeTab === 'forms')) {
      const loadContactData = async () => {
        try {
          const contactInfoData = await getContactInfo()
          const contactFormsData = await getContactForms()
          setContactInfo(contactInfoData)
          setContactForms(contactFormsData)
        } catch (error) {
          console.error(error)
        }
      }
      loadContactData()
    }
  }, [isAuthenticated, activeTab])

  // 加载留言数据
  useEffect(() => {
    if (isAuthenticated && activeTab === 'vehicle-feedback') {
      const loadFeedbackData = async () => {
        try {
          const feedbackData = await getAllDocumentFeedback()
          setAllFeedback(feedbackData)
        } catch (error) {
          console.error('加载留言失败:', error)
          showToast({
            type: 'error',
            title: t('common.error'),
            description: t('admin.feedbackManagement.loadError') || '加载留言失败'
          })
        }
      }
      loadFeedbackData()
    }
  }, [isAuthenticated, activeTab])

  // 定期加载未回复留言数量
  useEffect(() => {
    if (isAuthenticated) {
      const loadUnrepliedCount = async () => {
        try {
          const count = await getUnrepliedFeedbackCount()
          setUnrepliedCount(count)
        } catch (error) {
          console.error('加载未回复留言数量失败:', error)
        }
      }
      
      // 初始加载
      loadUnrepliedCount()
      
      // 每30秒刷新一次
      const interval = setInterval(loadUnrepliedCount, 30000)
      
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  // 加载公告数据
  useEffect(() => {
    if (isAuthenticated && activeTab === 'announcement') {
      const loadAnnouncement = async () => {
        try {
          const data = await getAnnouncement()
          if (data) {
            setAnnouncement(data)
            setAnnouncementContent(data.content)
            setAnnouncementEnabled(data.enabled)
            setAnnouncementType(data.style.type)
            setAnnouncementFontSize(data.style.fontSize)
            setAnnouncementFontWeight(data.style.fontWeight)
            setAnnouncementFontStyle(data.style.fontStyle)
            setAnnouncementTextColor(data.style.textColor || '')
            setAnnouncementScrolling(data.behavior.scrolling)
            setAnnouncementCloseable(data.behavior.closeable)
            setAnnouncementRememberDays(data.behavior.closeRememberDays)
          }
        } catch (error) {
          console.error('加载公告失败:', error)
        }
      }
      loadAnnouncement()
    }
  }, [isAuthenticated, activeTab])

  // 加载网站设置数据
  useEffect(() => {
    if (isAuthenticated) {
      const loadSiteSettings = async () => {
        try {
          const settings = await getSiteSettings()
          setSiteSettings(settings)
        } catch (error) {
          console.error('加载网站设置失败:', error)
        }
      }
      loadSiteSettings()
    }
  }, [isAuthenticated])



  // 处理认证成功
  const handleAuthenticated = () => {
    setIsAuthenticated(true)
  }

  // 切换语言
  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh'
    i18n.changeLanguage(newLang)
    setLanguageOpen(false)
  }

  // 点击外部关闭语言选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (languageOpen && !target.closest('.language-selector')) {
        setLanguageOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [languageOpen])

  // 处理退出登录
  const handleLogout = async () => {
    try {
      await logout()
      setIsAuthenticated(false)
    } catch (error) {
      console.error(error)
      setIsAuthenticated(false)
    }
  }

  // 保存系统设置
  const handleSaveSettings = async () => {
    setSettingsMessage('')
    
    // 验证新密码
    if (newPassword) {
            if (!passwordStrength.isValid) {
        setSettingsMessage(t('admin.settings.passwordRequirements'))
        return
      }
      
      if (newPassword !== confirmPassword) {
        setSettingsMessage(t('admin.settings.passwordMismatch'))
        return
      }
   }

    // 更新设置
    const updates: any = {
      sessionTimeout: sessionTimeout * 3600000  // 将小时转换为毫秒
    }
    
    if (newPassword) {
      updates.password = newPassword
    }

    const success = await updateAdminSettings(updates)
    
        if (success) {
      setSettingsMessage(t('admin.settings.settingsSaveSuccess'))
      setNewPassword('')
      setConfirmPassword('')
    } else {
      setSettingsMessage(t('admin.settings.settingsSaveError'))
    }
  }

  // 重置密码
  const handleResetPassword = async () => {
         const success = await resetAdminPassword()
     if (success) {
       setSettingsMessage(t('admin.settings.passwordResetSuccess'))
       setNewPassword('')
       setConfirmPassword('')
     } else {
       setSettingsMessage(t('admin.settings.passwordResetError'))
     }
  }


  // 联系信息管理函数
  const handleAddContactInfo = async () => {
    if (!newContactInfo.label || !newContactInfo.value) {
      showToast({
        type: 'warning',
        title: t('admin.messages.fillCompleteContactInfo'),
        description: ''
      })
      return
    }
    
    try {
      const info = await addContactInfo(newContactInfo)
      setContactInfo([...contactInfo, info])
      
      // 清空表单
      setNewContactInfo({
        type: 'email' as 'email' | 'phone' | 'address' | 'online' | 'forum',
        label: '',
        value: '',
        icon: 'Mail',
        isActive: true,
        order: 1
      })
      setShowAddContactInfo(false)
    } catch (error) {
      console.error('添加联系信息失败:', error)
      showToast({
        type: 'error',
        title: t('common.addFailed'),
        description: error instanceof Error ? error.message : t('common.unknownError')
      })
    }
  }

  const handleStartEditContactInfo = (info: any) => {
    setEditingContactInfo({ ...info })
    setShowEditContactInfo(true)
  }

  const handleSaveEditContactInfo = () => {
    if (!editingContactInfo.label || !editingContactInfo.value) {
      showToast({
        type: 'warning',
        title: t('admin.messages.fillCompleteContactInfo'),
        description: ''
      })
      return
    }
    
    const updatedInfo = updateContactInfo(editingContactInfo.id, {
      label: editingContactInfo.label,
      value: editingContactInfo.value,
      icon: editingContactInfo.icon,
      isActive: editingContactInfo.isActive,
      order: editingContactInfo.order
    })
    
    if (updatedInfo) {
      const updatedContactInfo = contactInfo.map(info => 
        info.id === editingContactInfo.id ? { ...info, ...updatedInfo } : info
      )
      setContactInfo(updatedContactInfo)
      setShowEditContactInfo(false)
      setEditingContactInfo(null)
    }
  }

  const handleDeleteContactInfo = (id: string) => {
    if (confirm(t('admin.messages.deleteContactInfoConfirm'))) {
      deleteContactInfo(id)
      setContactInfo(contactInfo.filter(info => info.id !== id))
    }
  }

  const handleUpdateFormStatus = async (id: string, status: string) => {
    const updatedForm = await updateFormStatus(id, status as any)
    if (updatedForm) {
      const updatedForms = contactForms.map(form => 
        form.id === id ? { ...form, status: updatedForm.status } : form
      )
      setContactForms(updatedForms)
    }
  }

  const handleDeleteForm = (id: string) => {
    if (confirm(t('admin.messages.deleteFormConfirm'))) {
      deleteForm(id)
      setContactForms(contactForms.filter(form => form.id !== id))
    }
  }

  const handleExportForms = async () => {
    const data = await exportContactForms()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contact-forms-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClearAllForms = () => {
    if (confirm(t('admin.messages.clearAllFormsConfirm'))) {
      clearAllForms()
      setContactForms([])
    }
  }

  // 留言管理函数
  const handleAddReply = async (feedbackId: string) => {
    if (!replyContent.trim()) return

    try {
      await addReplyToFeedback('', feedbackId, 'Admin', replyContent)
      
      // 重新加载留言数据和未回复数量
      const feedbackData = await getAllDocumentFeedback()
      setAllFeedback(feedbackData)
      
      const count = await getUnrepliedFeedbackCount()
      setUnrepliedCount(count)
      
      setReplyingTo(null)
      setReplyContent('')
      
      showToast({
        type: 'success',
        title: t('common.success'),
        description: t('admin.feedbackManagement.replySuccess') || '回复成功'
      })
    } catch (error) {
      console.error('回复失败:', error)
      showToast({
        type: 'error',
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.unknownError')
      })
    }
  }

  const handleDeleteFeedback = async (feedbackId: string) => {
    setFeedbackToDelete(feedbackId)
  }

  const confirmDeleteFeedback = async () => {
    if (!feedbackToDelete) return

    try {
      await removeFeedback('', feedbackToDelete)
      
      // 重新加载留言数据和未回复数量
      const feedbackData = await getAllDocumentFeedback()
      setAllFeedback(feedbackData)
      
      const count = await getUnrepliedFeedbackCount()
      setUnrepliedCount(count)
      
      setFeedbackToDelete(null)
      
      showToast({
        type: 'success',
        title: t('common.success'),
        description: t('admin.feedbackManagement.deleteSuccess') || '删除成功'
      })
    } catch (error) {
      console.error('删除留言失败:', error)
      showToast({
        type: 'error',
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.unknownError')
      })
    }
  }

  const handleDeleteReply = async (feedbackId: string, replyId: string) => {
    setReplyToDelete({ feedbackId, replyId })
  }

  const confirmDeleteReply = async () => {
    if (!replyToDelete) return

    try {
      await removeReply('', replyToDelete.feedbackId, replyToDelete.replyId)
      
      // 重新加载留言数据
      const feedbackData = await getAllDocumentFeedback()
      setAllFeedback(feedbackData)
      
      setReplyToDelete(null)
      
      showToast({
        type: 'success',
        title: t('common.success'),
        description: t('admin.feedbackManagement.deleteReplySuccess') || '删除回复成功'
      })
    } catch (error) {
      console.error('删除回复失败:', error)
      showToast({
        type: 'error',
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.unknownError')
      })
    }
  }

  // 公告管理函数
  const handleSaveAnnouncement = async () => {
    try {
      const data = await updateAnnouncement({
        enabled: announcementEnabled,
        content: announcementContent,
        style: {
          type: announcementType,
          fontSize: announcementFontSize,
          fontWeight: announcementFontWeight,
          fontStyle: announcementFontStyle,
          textColor: announcementTextColor
        },
        behavior: {
          scrolling: announcementScrolling,
          closeable: announcementCloseable,
          closeRememberDays: announcementRememberDays
        }
      })
      
      if (data) {
        setAnnouncement(data)
        showToast({
          type: 'success',
          title: t('common.success'),
          description: t('admin.announcement.saveSuccess') || '公告设置已保存'
        })
      }
    } catch (error) {
      console.error('保存公告失败:', error)
      showToast({
        type: 'error',
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.unknownError')
      })
    }
  }

  const handleToggleAnnouncement = async () => {
    try {
      const newEnabled = !announcementEnabled
      const data = await toggleAnnouncement(newEnabled)
      
      if (data) {
        setAnnouncementEnabled(newEnabled)
        setAnnouncement(data)
        showToast({
          type: 'success',
          title: t('common.success'),
          description: newEnabled ? (t('admin.announcement.enabled') || '公告已开启') : (t('admin.announcement.disabled') || '公告已关闭')
        })
      }
    } catch (error) {
      console.error('切换公告状态失败:', error)
      showToast({
        type: 'error',
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.unknownError')
      })
    }
  }

  // 网站设置管理函数
  const handleSaveSiteSettings = async () => {
    try {
      const updatedSettings = await updateSiteSettings(siteSettings)
      setSiteSettings(updatedSettings)
      setShowSiteSettings(false)
      
      showToast({
        type: 'success',
        title: t('admin.messages.siteSettingsUpdated'),
        description: t('admin.messages.siteSettingsUpdatedDesc')
      })
      
      // 刷新全局网站设置
      await refreshSiteSettings()
    } catch (error) {
      console.error('保存网站设置失败:', error)
      showToast({
        type: 'error',
        title: t('common.saveFailed'),
        description: error instanceof Error ? error.message : t('common.unknownError')
      })
    }
  }

  // 更新未读表单数量
  useEffect(() => {
    if (isAuthenticated) {
      const loadUnreadCount = async () => {
        const count = await getUnreadFormsCount()
        setUnreadFormsCount(count)
      }
      loadUnreadCount()
    }
  }, [isAuthenticated, contactForms])

  // 车型和文档数据状态
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  
  // 车型搜索和筛选状态
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState('')
  const [selectedBrand, setSelectedBrand] = useState<string>('all')
  const [selectedModel, setSelectedModel] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  
  // 标签筛选已被分类系统替代
  
  // 标签加载逻辑已被分类系统替代

  // 标签筛选逻辑已被分类系统替代

  // 标签筛选器组件已被分类系统替代

  // 图文教程标签筛选器组件已被分类系统替代
  
  // 新增车型状态
  const [newVehicle, setNewVehicle] = useState({
    brand: '',
    model: '',
    year: '',
    password: '',
    hasPassword: false // 是否有密码保护
  })
  
  // 从车型数据中提取已有品牌和车型列表
  const availableBrands = React.useMemo(() => {
    const brands = new Set<string>()
    vehicles.forEach(v => {
      if (v.brand) brands.add(v.brand)
    })
    return Array.from(brands).sort()
  }, [vehicles])
  
  const availableModelsForBrand = React.useMemo(() => {
    if (!newVehicle.brand) return []
    const models = new Set<string>()
    vehicles.forEach(v => {
      if (v.brand === newVehicle.brand && v.model) {
        models.add(v.model)
      }
    })
    return Array.from(models).sort()
  }, [vehicles, newVehicle.brand])
  
  // 编辑车型状态
  const [editingVehicle, setEditingVehicle] = useState<any>(null)
  const [showEditVehicle, setShowEditVehicle] = useState(false)
  
  // 新增文档状态
  const [newDocument, setNewDocument] = useState({
    title: '',
    vehicle: '',
    type: 'article' as 'article' | 'file' | 'video',
    content: '',
    summary: '',
    author: 'Technical Team',
    password: '',
    primaryTags: [] as string[],
    secondaryTags: [] as string[]
  })
  
  // 编辑文档状态
  const [editingDocument, setEditingDocument] = useState<any>(null)
  const [showEditDocument, setShowEditDocument] = useState(false)
  
  // 视频编辑模态框状态
  const [showVideoEditModal, setShowVideoEditModal] = useState(false)
  
  // 结构化文章编辑器状态
  const [showStructuredArticleEditor, setShowStructuredArticleEditor] = useState(false)
  const [editingStructuredArticle, setEditingStructuredArticle] = useState<any>(null)

  // 预览文档模态框状态
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<any>(null)
  

  // 添加车型
  const handleAddVehicle = async () => {
    if (!newVehicle.brand || !newVehicle.model || !newVehicle.year) {
      showToast({
        type: 'warning',
        title: t('knowledge.fillCompleteVehicleInfo'),
        description: ''
      })
      return
    }
    
    // 如果选择了密码保护，必须输入密码
    if (newVehicle.hasPassword && !newVehicle.password) {
      showToast({
        type: 'warning',
        title: t('admin.vehicles.password'),
        description: t('admin.vehicles.passwordRequiredWhenEnabled')
      })
      return
    }
    
    try {
      const vehicle = await createVehicleAPI({
        brand: newVehicle.brand,
        model: newVehicle.model,
        year: newVehicle.year,
        password: newVehicle.hasPassword ? newVehicle.password : '' // 无密码保护时使用空字符串
      })
      
      setVehicles([...vehicles, vehicle])
      
      // 清空表单
      setNewVehicle({ brand: '', model: '', year: '', password: '', hasPassword: false })
      setShowAddVehicle(false)
      
      showToast({
        type: 'success',
        title: t('common.success'),
        description: t('admin.vehicles.vehicleSaved')
      })
    } catch (error) {
      console.error('添加车型失败:', error)
      showToast({
        type: 'error',
        title: t('common.addFailed'),
        description: error instanceof Error ? error.message : t('common.unknownError')
      })
    }
  }

  // 开始编辑车型
  const handleStartEditVehicle = (vehicle: any) => {
    setEditingVehicle({ 
      ...vehicle, 
      hasPassword: vehicle.password && vehicle.password.trim() !== '' 
    })
    setShowEditVehicle(true)
  }

  // 保存编辑的车型
  const handleSaveEditVehicle = async () => {
    if (!editingVehicle.brand || !editingVehicle.model || !editingVehicle.year) {
      showToast({
        type: 'warning',
        title: t('knowledge.fillCompleteVehicleInfo'),
        description: ''
      })
      return
    }
    
    // 如果选择了密码保护，必须输入密码
    if (editingVehicle.hasPassword && !editingVehicle.password) {
      showToast({
        type: 'warning',
        title: t('admin.vehicles.password'),
        description: t('admin.vehicles.passwordRequiredWhenEnabled')
      })
      return
    }
    
    try {
      const vehicleId = editingVehicle._id || editingVehicle.id?.toString()
      if (!vehicleId) {
        showToast({
          type: 'error',
        title: t('common.error'),
        description: t('admin.messages.vehicleIdNotFound')
        })
        return
      }
      
      const updatedVehicle = await updateVehicleAPI(vehicleId.toString(), {
        brand: editingVehicle.brand,
        model: editingVehicle.model,
        year: editingVehicle.year,
        password: editingVehicle.hasPassword ? editingVehicle.password : '' // 无密码保护时使用空字符串
      })
      
      setVehicles(vehicles.map(v => (v._id || v.id?.toString()) === vehicleId.toString() ? updatedVehicle : v))
      
      setShowEditVehicle(false)
      setEditingVehicle(null)
      
      showToast({
        type: 'success',
        title: t('common.success'),
        description: t('admin.vehicles.vehicleSaved')
      })
    } catch (error) {
      console.error('更新车型失败:', error)
      showToast({
        type: 'error',
        title: t('admin.settings.settingsSaveError'),
        description: error instanceof Error ? error.message : t('admin.messages.unknownError')
      })
    }
  }

  // 删除车型
  const handleDeleteVehicle = async (id: number | string) => {
    const vehicle = vehicles.find(v => v.id === id || v._id === id.toString())
    if (vehicle && vehicle.documents > 0) {
      if (!confirm(t('admin.messages.deleteVehicleWithDocuments', { count: vehicle.documents }))) {
        return
      }
    }
    
    try {
      const vehicleId = typeof id === 'number' ? vehicles.find(v => v.id === id)?._id || id.toString() : id
      const success = await deleteVehicleAPI(vehicleId.toString())
      
      if (success) {
        setVehicles(vehicles.filter(v => (v._id || v.id?.toString()) !== vehicleId.toString()))
        showToast({
          type: 'success',
          title: t('admin.vehicles.vehicleDeleted'),
          description: ''
        })
      } else {
        showToast({
          type: 'error',
          title: t('admin.vehicles.vehicleDeleteError'),
          description: ''
        })
      }
    } catch (error) {
      console.error('删除车型失败:', error)
      showToast({
        type: 'error',
        title: t('admin.vehicles.vehicleDeleteError'),
        description: error instanceof Error ? error.message : t('admin.messages.unknownError')
      })
    }
  }

  // 添加文档（暂时废弃，使用专门的编辑器）
  const handleAddDocument = () => {
    showToast({
      type: 'info',
      title: t('admin.documents.title'),
      description: t('admin.documents.description')
    })
    setShowAddDocument(false)
  }

  // 开始编辑文档
  const handleStartEditDocument = async (doc: any) => {
    // 统一使用 documentType 或 type 判断文档类型
    const docType = doc.documentType || doc.type
    
    // 如果是结构化文章，打开结构化文章编辑器
    if (docType === 'structured') {
      // 将文档数据转换为结构化文章格式
      // 后端返回的数据结构可能是 basicInfo 或直接在根级别
      const basicInfo = doc.basicInfo || {
        vehicleImage: doc.vehicleImage || '',
        introduction: doc.introduction || doc.content || '',
        importantNotes: doc.importantNotes || '',
        brand: doc.brand || '',
        model: doc.model || '',
        yearRange: doc.yearRange || ''
      }
      
      const structuredArticle = {
        _id: doc._id,
        id: doc._id || doc.id, // 兼容两种ID格式
        title: doc.title || '',
        basicInfo: {
          title: doc.title || '',
          vehicleImage: basicInfo.vehicleImage || doc.vehicleImage || '',
          introduction: basicInfo.introduction || doc.introduction || doc.content || '',
          importantNotes: basicInfo.importantNotes || doc.importantNotes || '',
          brand: basicInfo.brand || doc.brand || '',
          model: basicInfo.model || doc.model || '',
          yearRange: basicInfo.yearRange || doc.yearRange || ''
        },
        features: {
          supported: doc.features?.supported || doc.supportedFeatures || [],
          unsupported: doc.features?.unsupported || doc.unsupportedFeatures || []
        },
        compatibleModels: doc.compatibleModels || [],
        incompatibleModels: doc.incompatibleModels || [],
        faqs: doc.faqs || [],
        feedback: doc.userFeedback || [],
      author: doc.author || t('knowledge.technicalTeam')
      }

      setEditingStructuredArticle(structuredArticle)
      setShowStructuredArticleEditor(true)
    } else if (docType === 'video') {
      // 视频教程使用专门的视频编辑模态框
      console.log('🎥 编辑视频教程:', doc);
      
      // 如果文档没有 videos 数组，从 videoUrl 创建一个
      let videos = doc.videos;
      if (!videos || videos.length === 0) {
        videos = [{
          url: doc.videoUrl || '',
          title: doc.title || '',
          description: doc.description || doc.summary || '',
          platform: doc.platform || 'custom',
          duration: doc.duration || '',
          order: 0
        }];
      }
      
      console.log('🎥 Debug editing video - original doc:', doc);
      console.log('🎥 Debug editing video - processed videos:', videos);
      
      const editingDoc = { 
        ...doc,
        _id: doc._id || doc.id,
        id: doc._id || doc.id,
        category: doc.category || 'general',
        videos: videos
      };
      
      console.log('🎥 Debug final editingDocument:', editingDoc);
      console.log('🎥 Debug final editingDocument.videos:', editingDoc.videos);
      
      setEditingDocument(editingDoc)
      setShowVideoEditModal(true)
    } else if (docType === 'general' || docType === 'enhanced-article') {
      // 编辑通用文档（图文教程）- 统一使用增强编辑器
      console.log('🔧 编辑图文教程:', doc);
      console.log('📄 原始content:', doc.content);
      console.log('🖼️ 原始images:', doc.images);
      console.log('📝 原始sections:', doc.sections);
      console.log('🏷️ 原始primaryTags (IDs):', doc.primaryTags);
      console.log('🏷️ 原始secondaryTags (IDs):', doc.secondaryTags);
      
      // 标签转换已被分类系统替代
      
      // 标签转换日志已被分类系统替代
      
      // 数据转换：数据库格式 -> 编辑器格式
      const convertedDoc = {
        ...doc,
        _id: doc._id || doc.id,
        id: doc._id || doc.id,
        // 转换数据结构
        heroImageUrl: doc.images && doc.images.length > 0 ? doc.images[0].url : '',
        heroImageAlt: doc.images && doc.images.length > 0 ? doc.images[0].alt : '',
        // 标签字段已被分类字段替代
        category: doc.category || 'general',
        // 重建sections：如果有现有的sections使用现有的，否则从images和content重建
        sections: doc.sections && doc.sections.length > 0 ? doc.sections : 
                  // 从images[1+]重建sections（跳过hero图片）
                  (doc.images && doc.images.length > 1 ? 
                    doc.images.slice(1).map((img: any, index: number) => {
                      // 尝试从content中提取对应的内容段落
                      let sectionContent = '';
                      if (doc.content) {
                        // 简单的内容分割逻辑：按段落分割
                        const paragraphs = doc.content.split(/\n\s*\n|\<\/p\>|\<br\s*\/?\>/i);
                        if (paragraphs[index]) {
                          sectionContent = paragraphs[index].replace(/<[^>]*>/g, '').trim();
                        }
                      }
                      
                      return {
                        id: `section_${index + 1}`,
                        heading: img.alt || `Section ${index + 1}`,
                        content: sectionContent || `Section ${index + 1} content`, // 提供默认内容
                        imageUrl: img.url,
                        imageAlt: img.alt || '',
                        layout: index % 2 === 0 ? 'imageLeft' : 'imageRight'
                      };
                    }) : [])
      };
      
      console.log('🔄 转换后的数据:', convertedDoc);
      setEditingEnhancedDocument(convertedDoc)
      setShowEnhancedDocumentEditor(true)
    } else {
      // 其他类型文档使用标准编辑模态框
      console.log('🔧 编辑其他文档:', doc);
      setEditingDocument({ 
        ...doc,
        _id: doc._id || doc.id,
        id: doc._id || doc.id
      })
      setShowEditDocument(true)
    }
  }

  // 保存编辑的文档
  const handleSaveEditDocument = async () => {
    if (!editingDocument.title) {
      showToast({
        type: 'warning',
        title: t('knowledge.fillCompleteDocumentInfo'),
        description: ''
      })
      return
    }
    
    try {
      // 确定文档类型
      let documentType: 'general' | 'video' | 'structured' = 'general'
      if (editingDocument.type === 'video') documentType = 'video'
      if (editingDocument.type === 'structured') documentType = 'structured'
      
      const documentId = editingDocument._id || editingDocument.id
      
      // 构建更新数据
      const updateData: Partial<DocumentData> = {
        title: editingDocument.title,
        content: editingDocument.content || '',
        summary: editingDocument.summary || '',
        category: editingDocument.vehicle || 'general',
        author: editingDocument.author || t('knowledge.author'),
        documentType,
        status: editingDocument.status || 'published'
      }
      
      // 如果是视频，添加视频URL
      if (documentType === 'video') {
        updateData.videoUrl = editingDocument.content || editingDocument.filePath
        updateData.platform = 'custom'
      }
      
      await updateDocument(documentId.toString(), updateData, documentType)
      
      // 重新加载文档列表
      const [structuredResult, videoResult, generalResult] = await Promise.all([
        getDocuments({ documentType: 'structured', limit: 1000 }),
        getDocuments({ documentType: 'video', limit: 1000 }),
        getDocuments({ documentType: 'general', limit: 1000 })
      ])
      
      setDocuments([
        ...structuredResult.documents,
        ...videoResult.documents,
        ...generalResult.documents
      ])
      
      setShowEditDocument(false)
      setEditingDocument(null)
      
      showToast({
        type: 'success',
        title: t('admin.documents.updateSuccess'),
        description: ''
      })
    } catch (error) {
      console.error('保存文档失败:', error)
      showToast({
        type: 'error',
        title: t('admin.messages.saveFailed'),
        description: error instanceof Error ? error.message : t('admin.messages.unknownError')
      })
    }
  }

  // 保存编辑的视频教程

  // 预览文档
  const handlePreviewDocument = (doc: any) => {
    // 判断是否为视频教程
    const isVideo = doc.type === 'video' || doc.documentType === 'video'
    
    if (isVideo) {
      // 视频教程：打开视频链接
      const videoUrl = doc.videoUrl || doc.content || doc.filePath
      if (videoUrl) {
        window.open(videoUrl, '_blank')
      } else {
        showToast({
          type: 'warning',
          title: t('common.preview'),
          description: t('knowledge.video.noVideoLink') || '视频链接不存在'
        })
      }
    } else if (doc.type === 'structured' || doc.documentType === 'structured') {
      // 显示结构化文档预览
      setPreviewDocument(doc)
      setShowPreviewModal(true)
    } else if (doc.type === 'article') {
      // 显示富文本预览
      showToast({
        type: 'info',
        title: t('common.preview'),
        description: `${doc.title}: ${doc.content || t('knowledge.noContent')}`
      })
    } else {
      // 显示文件信息
      showToast({
        type: 'info',
        title: t('common.preview'),
        description: `${doc.title} - ${t('generalDocuments.filePath')}: ${doc.filePath || t('common.notUploaded')}`
      })
    }
  }

  // 下载文档
  // const handleDownloadDocument = (doc: any) => {

  //   if (doc.filePath) {
  //     // 创建下载链接
  //     const link = document.createElement('a')
  //     link.href = doc.filePath
  //     link.download = doc.title
  //     document.body.appendChild(link)
  //     link.click()
  //     document.body.removeChild(link)
  //   } else {
  //             alert(t('errors.fileNotFound'))
  //   }
  // }



  // 保存增强文档（图文教程）
  const handleSaveEnhancedDocument = async (documentData: any) => {
    try {
      // 验证必要字段
      if (!documentData.title?.trim()) {
        throw new Error(t('knowledge.documentTitlePlaceholder') || 'Document title is required')
      }
      
      const isEditing = documentData.id || documentData._id
      const documentId = documentData._id || documentData.id
      
      // 构建内容 - 从sections构建HTML内容
      let content = ''
      if (documentData.sections && Array.isArray(documentData.sections) && documentData.sections.length > 0) {
        content = documentData.sections.map((section: any) => {
          let sectionHtml = ''
          if (section.heading) {
            sectionHtml += `<h2>${section.heading}</h2>`
          }
          if (section.content) {
            sectionHtml += section.content
          }
          return sectionHtml
        }).join('\n')
      }
      
      // 如果sections构建的内容为空，使用原始content
      if (!content.trim() && documentData.content) {
        content = documentData.content
      }
      
      // 后端验证要求content不能为空字符串
      if (!content.trim()) {
        throw new Error('文档内容不能为空，请至少添加一个段落')
      }
      
      // 构建summary - 优先使用summary，否则使用description，否则从content截取
      let summary = documentData.summary?.trim() || documentData.description?.trim() || ''
      if (!summary) {
        // 从content提取摘要（去除HTML标签，取前100字符）
        const textContent = content.replace(/<[^>]*>/g, '').trim()
        summary = textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent
      }
      
      // 后端验证要求summary不能为空字符串
      if (!summary.trim()) {
        throw new Error(t('knowledge.summaryPlaceholder') || 'Document summary cannot be empty')
      }

      // 构建images数组 - 从编辑器格式转换为数据库格式
      const images = []
      
      // 添加heroImage作为第一张图片
      if (documentData.heroImageUrl) {
        images.push({
          url: documentData.heroImageUrl,
          alt: documentData.heroImageAlt || '',
          order: 0
        })
      }
      
      // 添加sections中的图片
      if (documentData.sections && Array.isArray(documentData.sections)) {
        documentData.sections.forEach((section: any, index: number) => {
          if (section.imageUrl) {
            images.push({
              url: section.imageUrl,
              alt: section.imageAlt || '',
              order: index + 1
            })
          }
        })
      }
      
      // 标签解析已被分类系统替代
      
      // 标签ID日志已被分类系统替代
      
      const docData: DocumentData = {
        title: documentData.title.trim(),
        content: content.trim(),
        summary: summary.trim(),
        category: documentData.category?.trim() || 'general',
        author: documentData.author?.trim() || 'Technical Team',
        documentType: 'general',
        type: 'article',
        status: documentData.status || 'published',
        // 标签字段已被分类字段替代
        images: images, // 使用转换后的images数组
        sections: documentData.sections || [] // 同时保存sections数据
      }
      
      console.log('💾 保存的docData:', {
        title: docData.title,
        // 标签字段已被分类字段替代
        sectionsCount: docData.sections?.length || 0,
        sections: docData.sections?.map(s => ({ id: s.id, heading: s.heading, hasContent: !!s.content, hasImage: !!s.imageUrl })),
        imagesCount: docData.images?.length || 0
      });
      
      if (isEditing) {
        // 更新现有文档
        await updateDocument(documentId.toString(), docData, 'general')
        showToast({
          type: 'success',
          title: t('common.success'),
          description: t('admin.documents.updateSuccess')
        })
      } else {
        // 创建新文档
        await createDocument(docData)
        showToast({
          type: 'success',
          title: t('common.success'),
          description: t('admin.documents.createSuccess')
        })
      }
      
      // 关闭编辑器
      setShowEnhancedDocumentEditor(false)
      setEditingEnhancedDocument(null)
      
      // 尝试重新加载文档列表（如果失败不影响创建/更新的提示）
      try {
      const [structuredResult, videoResult, generalResult] = await Promise.all([
        getDocuments({ documentType: 'structured', limit: 1000 }),
        getDocuments({ documentType: 'video', limit: 1000 }),
        getDocuments({ documentType: 'general', limit: 1000 })
      ])
      setDocuments([
        ...structuredResult.documents,
        ...videoResult.documents,
        ...generalResult.documents
      ])
      } catch (refreshError) {
        // 获取列表失败不影响创建/更新成功的提示，只记录错误
        console.warn('保存后刷新列表失败，但文档已成功保存:', refreshError)
        showToast({ 
          type: 'warning', 
          title: t('common.success'), 
          description: (isEditing ? t('admin.documents.updateSuccess') : t('admin.documents.createSuccess')) + ' ' + (t('common.refreshPage') || '请刷新页面查看最新列表')
        })
      }
    } catch (error) {
      console.error('保存文档失败:', error)
      showToast({
        type: 'error',
        title: t('admin.messages.saveFailed'),
        description: error instanceof Error ? error.message : t('common.unknownError')
      })
    }
  }

  // 取消增强文档编辑
  const handleCancelEnhancedDocument = () => {
    setShowEnhancedDocumentEditor(false)
    setEditingEnhancedDocument(null)
  }

  // 删除文档
  const handleDeleteDocument = async (id: string | number) => {
    try {
      const targetId = id?.toString()
      const document = documents.find(d => (d._id || d.id)?.toString() === targetId)
      let deleted = false
      let documentType: 'general' | 'video' | 'structured' = 'general'
      let documentId = targetId

      if (document) {
        // 从本地数据判断类型
      if (document.type === 'video' || document.documentType === 'video') documentType = 'video'
      if (document.type === 'structured' || document.documentType === 'structured') documentType = 'structured'
        documentId = (document._id || document.id)?.toString()
        await deleteDocument(documentId!, documentType)
        deleted = true
      } else {
        // 本地未找到：尽力而为尝试三种类型
        const tryTypes: Array<'video' | 'structured' | 'general'> = ['video', 'structured', 'general']
        for (const tType of tryTypes) {
          try {
            await deleteDocument(targetId!, tType)
            documentType = tType
            deleted = true
            break
          } catch (e) {
            // 404/失败则继续尝试下一个类型
          }
        }
        if (!deleted) {
          showToast({ type: 'error', title: t('common.error'), description: t('admin.messages.documentNotFound') })
          return
        }
      }
      
      // 立即从本地状态中移除该文档（即使后续获取列表失败，用户也能看到删除效果）
      setDocuments(prev => prev.filter(d => (d._id || d.id)?.toString() !== (documentId || targetId)))
      
      // 显示删除成功
      showToast({
        type: 'success',
        title: t('common.success'),
        description: t('admin.documents.documentDeleted')
      })
      
      // 尝试重新加载文档列表（如果失败不影响删除成功的提示）
      try {
      const [structuredResult, videoResult, generalResult] = await Promise.all([
        getDocuments({ documentType: 'structured', limit: 1000 }),
        getDocuments({ documentType: 'video', limit: 1000 }),
        getDocuments({ documentType: 'general', limit: 1000 })
      ])
      
      setDocuments([
        ...structuredResult.documents,
        ...videoResult.documents,
        ...generalResult.documents
      ])
      } catch (refreshError) {
        // 获取列表失败不影响删除成功的提示，只记录错误
        console.warn('删除后刷新列表失败，但文档已成功删除:', refreshError)
      }
    } catch (error) {
      console.error('删除文档失败:', error)
      showToast({
        type: 'error',
        title: t('common.deleteFailed'),
        description: error instanceof Error ? error.message : t('common.unknownError')
      })
    }
  }



  // 如果未认证，显示登录页面
  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={handleAuthenticated} />
  }


  
  return (
    <div className="min-h-screen bg-gray-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 页面标题、Logo和退出按钮 */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/'}
                className="flex items-center space-x-2 text-gray-400 hover:text-white"
              >
                <BookOpen className="h-5 w-5" />
                <span className="font-medium">{siteSettings.logoText || t('layout.logo')}</span>
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {siteSettings.siteName || t('layout.logo')} | {t('admin.title').split('|')[1]?.trim() || '管理后台'}
                </h1>
                <p className="text-gray-400">{t('admin.description')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* 语言切换 */}
              <div className="relative language-selector">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLanguageOpen(!languageOpen)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {i18n.language === 'zh' ? t('languages.zh') : t('languages.en')}
                </Button>
                
                {languageOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-gray-800/50 rounded-md shadow-lg border border-gray-700/50 py-1 z-10">
                    <button
                      onClick={toggleLanguage}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/30 transition-colors"
                    >
                      {i18n.language === 'zh' ? t('languages.en') : t('languages.zh')}
                    </button>
                  </div>
                )}
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                {t('admin.logout')}
              </Button>
            </div>
          </div>

      {/* 分组导航 */}
      <div className="border-b border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm">
        <nav className="px-6 py-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 内容管理 */}
            <div className="space-y-1 relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{t('admin.navGroups.contentManagement')}</h3>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-600/30 to-transparent hidden lg:block"></div>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveTab('vehicles')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    activeTab === 'vehicles'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <Car className="h-4 w-4 mr-2" />
                  {t('admin.tabs.vehicles')}
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    activeTab === 'documents'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {t('admin.tabs.documents')}
                </button>
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    activeTab === 'categories'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  {t('admin.tabs.categories')}
                </button>
                <button
                  onClick={() => setActiveTab('softwareDownloads')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    activeTab === 'softwareDownloads'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('admin.tabs.softwareDownloads')}
                </button>
              </div>
            </div>

            {/* 用户互动 */}
            <div className="space-y-1 relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{t('admin.navGroups.userInteraction')}</h3>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-600/30 to-transparent hidden lg:block"></div>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    activeTab === 'contact'
                      ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t('admin.tabs.contact')}
                </button>
                <button
                  onClick={() => setActiveTab('forms')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between ${
                    activeTab === 'forms'
                      ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <span className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    {t('admin.tabs.forms')}
                  </span>
                  {unreadFormsCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {unreadFormsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('vehicle-feedback')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between ${
                    activeTab === 'vehicle-feedback'
                      ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <span className="flex items-center">
                    <Car className="h-4 w-4 mr-2" />
                    {t('admin.tabs.vehicleFeedback')}
                  </span>
                  {unrepliedCount > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-2 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                      {unrepliedCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('announcement')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    activeTab === 'announcement'
                      ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  {t('admin.tabs.announcement')}
                </button>
              </div>
            </div>

            {/* 数据分析 */}
            <div className="space-y-1 relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">数据分析</h3>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-600/30 to-transparent hidden lg:block"></div>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    activeTab === 'dashboard'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {t('admin.tabs.dashboard')}
                </button>
                <button
                  onClick={() => setActiveTab('otaReports')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    activeTab === 'otaReports'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {t('admin.tabs.otaReports')}
                </button>
                <button
                  onClick={() => setActiveTab('systemMonitor')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    activeTab === 'systemMonitor'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {t('admin.tabs.systemMonitor')}
                </button>
              </div>
            </div>

            {/* 系统管理 */}
            <div className="space-y-1 relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-5 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">系统管理</h3>
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    activeTab === 'settings'
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {t('admin.tabs.settings')}
                </button>
                <button
                  onClick={() => setActiveTab('systemConfig')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    activeTab === 'systemConfig'
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {t('admin.tabs.systemConfig')}
                </button>
                <button
                  onClick={() => setActiveTab('ossFileManager')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    activeTab === 'ossFileManager'
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {t('admin.tabs.ossFileManager')}
                </button>
                <button
                  onClick={() => setActiveTab('siteImages')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    activeTab === 'siteImages'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {t('admin.tabs.siteImages')}
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    activeTab === 'ai'
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  {t('admin.tabs.aiAssistant')}
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* 统计 Dashboard */}
      {activeTab === 'dashboard' && <AdminDashboard onNavigate={setActiveTab} />}

      {/* 车型管理 - 使用层级管理 */}
      {activeTab === 'vehicles' && (() => {
        // 计算统计数据
        const totalVehicles = vehicles.length
        const brands = new Set(vehicles.map(v => v.brand)).size
        const vehiclesWithDocs = vehicles.filter(v => v.documents && v.documents > 0).length
        const docCoverage = totalVehicles > 0 ? ((vehiclesWithDocs / totalVehicles) * 100).toFixed(1) : '0'
        
        // 获取所有品牌、车型和年份用于筛选
        const allBrands = Array.from(new Set(vehicles.map(v => v.brand))).sort()
        const allModels = Array.from(new Set(vehicles.map(v => v.model))).sort()
        const allYears = Array.from(new Set(vehicles.map(v => v.year))).sort()
        
        // 过滤车型
        const filteredVehicles = vehicles.filter(vehicle => {
          const matchesSearch = vehicleSearchTerm === '' || 
            vehicle.brand.toLowerCase().includes(vehicleSearchTerm.toLowerCase()) ||
            vehicle.model.toLowerCase().includes(vehicleSearchTerm.toLowerCase())
          const matchesBrand = selectedBrand === 'all' || vehicle.brand === selectedBrand
          const matchesModel = selectedModel === 'all' || vehicle.model === selectedModel
          const matchesYear = selectedYear === 'all' || vehicle.year === selectedYear
          return matchesSearch && matchesBrand && matchesModel && matchesYear
        })
        
        return (
          <div className="space-y-6">
            {/* 统计面板 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">总车型数</p>
                    <p className="text-3xl font-bold text-white">{totalVehicles}</p>
                  </div>
                  <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30">
                    <Car className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">品牌数量</p>
                    <p className="text-3xl font-bold text-white">{brands}</p>
                  </div>
                  <div className="p-3 bg-green-600/20 rounded-xl border border-green-500/30">
                    <Car className="w-8 h-8 text-green-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">文档覆盖率</p>
                    <p className="text-3xl font-bold text-white">{docCoverage}%</p>
                    <p className="text-xs text-gray-500 mt-1">{vehiclesWithDocs}/{totalVehicles} 车型有文档</p>
                  </div>
                  <div className="p-3 bg-purple-600/20 rounded-xl border border-purple-500/30">
                    <FileText className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* 搜索和筛选 */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.search')}</label>
                  <Input
                    type="text"
                    placeholder={t('admin.vehicles.searchPlaceholder')}
                    value={vehicleSearchTerm}
                    onChange={(e) => setVehicleSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.vehicles.brand')}</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => {
                      setSelectedBrand(e.target.value)
                      setSelectedModel('all')
                    }}
                    className="w-full h-10 px-3 rounded-md border border-gray-600/50 bg-gray-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">{t('admin.vehicles.allBrands') || 'All Brands'}</option>
                    {allBrands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.vehicles.model')}</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-600/50 bg-gray-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">{t('admin.vehicles.allModels') || 'All Models'}</option>
                    {allModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.vehicles.year')}</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-600/50 bg-gray-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">{t('admin.vehicles.allYears') || 'All Years'}</option>
                    {allYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {(vehicleSearchTerm || selectedBrand !== 'all' || selectedModel !== 'all' || selectedYear !== 'all') && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-400">
                    {t('common.found') || 'Found'} <span className="text-white font-semibold">{filteredVehicles.length}</span> {t('admin.vehicles.vehicleCount')}
                  </p>
                  <button
                    onClick={() => {
                      setVehicleSearchTerm('')
                      setSelectedBrand('all')
                      setSelectedModel('all')
                      setSelectedYear('all')
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {t('common.clearFilters') || 'Clear Filters'}
                  </button>
                </div>
              )}
            </div>
            
            {/* 车型列表 */}
            <HierarchicalManager
              items={filteredVehicles}
          buildHierarchy={(vehicles) => {
            // 构建 Brand -> Model -> Year 的层级结构
            const brandMap = new Map<string, Map<string, any[]>>()
            
            vehicles.forEach(vehicle => {
              const brand = vehicle.brand || 'Unknown Brand'
              const model = vehicle.model || 'Unknown Model'
              
              if (!brandMap.has(brand)) {
                brandMap.set(brand, new Map())
              }
              
              const modelMap = brandMap.get(brand)!
              if (!modelMap.has(model)) {
                modelMap.set(model, [])
              }
              
              modelMap.get(model)!.push(vehicle)
            })
            
            // 转换为层级结构
            const hierarchy: any[] = []
            
            Array.from(brandMap.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .forEach(([brand, modelMap]) => {
                const brandNode = {
                  id: `brand-${brand}`,
                  name: brand,
                  type: 'brand' as const,
                  count: Array.from(modelMap.values()).flat().length,
                  children: [] as any[]
                }
                
                Array.from(modelMap.entries())
                  .sort(([a], [b]) => a.localeCompare(b))
                  .forEach(([model, vehicles]) => {
                    const modelNode = {
                      id: `model-${brand}-${model}`,
                      name: model,
                      type: 'model' as const,
                      count: vehicles.length,
                      children: [] as any[]
                    }
                    
                    // 按年份分组
                    const yearGroups = vehicles.reduce((acc, vehicle) => {
                      const year = vehicle.year || 'Unknown Year'
                      if (!acc[year]) acc[year] = []
                      acc[year].push(vehicle)
                      return acc
                    }, {} as { [key: string]: any[] })
                    
                    Object.entries(yearGroups)
                      .sort(([a], [b]) => {
                        if (a === 'Unknown Year') return 1
                        if (b === 'Unknown Year') return -1
                        return b.localeCompare(a)
                      })
                      .forEach(([, yearVehicles]) => {
                        (yearVehicles as any[]).forEach((vehicle: any) => {
                          modelNode.children.push({
                            id: `vehicle-${vehicle.id}`,
                            name: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
                            type: 'document' as const,
                            data: vehicle
                          })
                        })
                      })
                    
                    brandNode.children.push(modelNode)
                  })
                
                hierarchy.push(brandNode)
              })
            
            return hierarchy
          }}
          renderLeafNode={(node) => (
            <Card className="bg-gray-800/40 border-gray-600">
              <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                    <div className="space-y-2 text-sm text-gray-300">
                      <p className="flex items-center">
                        <Lock className="h-3 w-3 mr-2 text-gray-400" />
                        {t('admin.vehicles.password')}: {
                          node.data.password && node.data.password.trim() !== '' 
                            ? '●●●●●●' 
                            : t('admin.vehicles.noPassword')
                        }
                      </p>
                      <p className="flex items-center">
                        <FileText className="h-3 w-3 mr-2 text-gray-400" />
                        {t('admin.vehicles.documentCount')}: {node.data.documents || 0}
                      </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
          )}
          onEdit={handleStartEditVehicle}
          onDelete={(vehicle) => handleDeleteVehicle(vehicle.id)}
          onAdd={() => setShowAddVehicle(true)}
          emptyText={t('admin.vehicles.noVehicles') || '暂无车型'}
          title={t('admin.tabs.vehicles')}
        />
          </div>
        )
      })()}

      {/* 新增车型模态框 */}
      {showAddVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{t('admin.vehicles.addVehicle')}</h3>
            <div className="space-y-4">
              {/* 品牌选择 - 支持手动输入，同时显示已有品牌建议 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.vehicles.brand')}</label>
                <div className="relative">
                  <Input
                    list="brand-list"
                    placeholder={t('admin.vehicles.brandPlaceholder')}
                    value={newVehicle.brand}
                    onChange={(e) => {
                      setNewVehicle({...newVehicle, brand: e.target.value, model: ''}) // 切换品牌时清空车型
                    }}
                    className="w-full"
                  />
                  <datalist id="brand-list">
                    {availableBrands.map(brand => (
                      <option key={brand} value={brand} />
                    ))}
                  </datalist>
                </div>
                {newVehicle.brand && availableBrands.includes(newVehicle.brand) && (
                  <p className="mt-1 text-xs text-gray-500">{t('admin.vehicles.brandSelected')}</p>
                )}
                {newVehicle.brand && !availableBrands.includes(newVehicle.brand) && (
                  <p className="mt-1 text-xs text-blue-600">{t('admin.vehicles.createNewBrand')}: {newVehicle.brand}</p>
                )}
              </div>
              
              {/* 车型选择 - 支持手动输入，同时显示已有车型建议 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.vehicles.model')}</label>
                <div className="relative">
                  <Input
                    list={newVehicle.brand ? `model-list-${newVehicle.brand}` : undefined}
                    placeholder={t('admin.vehicles.modelPlaceholder')}
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                    className="w-full"
                    disabled={!newVehicle.brand}
                  />
                  {newVehicle.brand && availableModelsForBrand.length > 0 && (
                    <datalist id={`model-list-${newVehicle.brand}`}>
                      {availableModelsForBrand.map(model => (
                        <option key={model} value={model} />
                      ))}
                    </datalist>
                  )}
                </div>
                {!newVehicle.brand && (
                  <p className="mt-1 text-xs text-gray-500">{t('admin.vehicles.selectBrandFirst')}</p>
                )}
                {newVehicle.brand && newVehicle.model && availableModelsForBrand.includes(newVehicle.model) && (
                  <p className="mt-1 text-xs text-gray-500">{t('admin.vehicles.modelSelected')}</p>
                )}
                {newVehicle.brand && newVehicle.model && !availableModelsForBrand.includes(newVehicle.model) && (
                  <p className="mt-1 text-xs text-blue-600">{t('admin.vehicles.createNewModel')}: {newVehicle.model}</p>
                )}
              </div>
              
              {/* 年份输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.vehicles.year')}</label>
                <Input 
                  placeholder={t('admin.vehicles.yearPlaceholder')} 
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle({...newVehicle, year: e.target.value})}
                />
              </div>
              
              {/* 密码保护选项 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('admin.vehicles.passwordProtection')}
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasPassword"
                      checked={!newVehicle.hasPassword}
                      onChange={() => setNewVehicle({...newVehicle, hasPassword: false, password: ''})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-300">{t('admin.vehicles.noPassword')}</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasPassword"
                      checked={newVehicle.hasPassword}
                      onChange={() => setNewVehicle({...newVehicle, hasPassword: true})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-300">{t('admin.vehicles.hasPassword')}</span>
                  </label>
                </div>
              </div>
              
              {/* 密码输入 - 只在选择密码保护时显示 */}
              {newVehicle.hasPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.vehicles.password')}</label>
                  <Input 
                    type="password"
                    placeholder={t('admin.vehicles.passwordPlaceholder')} 
                    value={newVehicle.password}
                    onChange={(e) => setNewVehicle({...newVehicle, password: e.target.value})}
                  />
                </div>
              )}
              <div className="flex space-x-2 pt-4">
                <Button onClick={handleAddVehicle} className="flex-1">{t('admin.vehicles.addVehicle')}</Button>
                <Button variant="outline" onClick={() => setShowAddVehicle(false)} className="flex-1">{t('common.cancel')}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑车型模态框 */}
      {showEditVehicle && editingVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
                          <h3 className="text-lg font-semibold mb-4">{t('admin.vehicles.editVehicle')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.vehicles.brand')}</label>
                <Input 
                  placeholder={t('admin.vehicles.brandPlaceholder')} 
                  value={editingVehicle.brand}
                  onChange={(e) => setEditingVehicle({...editingVehicle, brand: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.vehicles.model')}</label>
                <Input 
                  placeholder={t('admin.vehicles.modelPlaceholder')} 
                  value={editingVehicle.model}
                  onChange={(e) => setEditingVehicle({...editingVehicle, model: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.vehicles.year')}</label>
                <Input 
                  placeholder={t('admin.vehicles.yearPlaceholder')} 
                  value={editingVehicle.year}
                  onChange={(e) => setEditingVehicle({...editingVehicle, year: e.target.value})}
                />
              </div>
              {/* 密码保护选项 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('admin.vehicles.passwordProtection')}
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="editHasPassword"
                      checked={editingVehicle.hasPassword === true}
                      onChange={() => setEditingVehicle({...editingVehicle, hasPassword: true})}
                      className="mr-2"
                    />
                    {t('admin.vehicles.requirePassword')}
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="editHasPassword"
                      checked={editingVehicle.hasPassword === false}
                      onChange={() => setEditingVehicle({...editingVehicle, hasPassword: false, password: ''})}
                      className="mr-2"
                    />
                    {t('admin.vehicles.noPassword')}
                  </label>
                </div>
              </div>
              
              {/* 密码输入 - 只在选择密码保护时显示 */}
              {editingVehicle.hasPassword && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.vehicles.password')}</label>
                <Input 
                  type="password"
                  placeholder={t('admin.vehicles.passwordPlaceholder')} 
                  value={editingVehicle.password}
                  onChange={(e) => setEditingVehicle({...editingVehicle, password: e.target.value})}
                />
              </div>
              )}
              <div className="flex space-x-2 pt-4">
                <Button onClick={handleSaveEditVehicle} className="flex-1">{t('common.save')}</Button>
                <Button variant="outline" onClick={() => {
                  setShowEditVehicle(false)
                  setEditingVehicle(null)
                }} className="flex-1">{t('common.cancel')}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 文档管理 */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* 文档统计面板 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{t('admin.documents.totalDocuments') || 'Total Documents'}</p>
                  <p className="text-3xl font-bold text-white">{documents.length}</p>
                </div>
                <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30">
                  <FileText className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{t('knowledge.structuredArticle')}</p>
                  <p className="text-3xl font-bold text-white">
                    {documents.filter(d => (d.documentType || d.type) === 'structured').length}
                  </p>
                </div>
                <div className="p-3 bg-green-600/20 rounded-xl border border-green-500/30">
                  <FileText className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{t('knowledge.sections.videoTutorials')}</p>
                  <p className="text-3xl font-bold text-white">
                    {documents.filter(d => (d.documentType || d.type) === 'video').length}
                  </p>
                </div>
                <div className="p-3 bg-purple-600/20 rounded-xl border border-purple-500/30">
                  <Video className="w-8 h-8 text-purple-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{t('knowledge.sections.generalDocuments')}</p>
                  <p className="text-3xl font-bold text-white">
                    {documents.filter(d => (d.documentType || d.type) === 'general').length}
                  </p>
                </div>
                <div className="p-3 bg-orange-600/20 rounded-xl border border-orange-500/30">
                  <FileText className="w-8 h-8 text-orange-400" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold text-white">{t('admin.tabs.documents')}</h2>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => {
                  setEditingEnhancedDocument(null)
                  setShowEnhancedDocumentEditor(true)
                }} className="hover:bg-gray-700/50">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('admin.documents.createImageTextTutorial')}
                </Button>
                <Button variant="outline" onClick={() => {
                  setEditingDocument({
                    title: '',
                    summary: '',
                    videos: [{ url: '', title: '', description: '', platform: 'custom', duration: '', order: 0 }],
                    primaryTags: [],
                    secondaryTags: []
                  })
                  setShowVideoEditModal(true)
                }} className="hover:bg-gray-700/50">
                  <Video className="h-4 w-4 mr-2" />
                  {t('admin.documents.createVideoTutorial')}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowStructuredArticleEditor(true)
                  setEditingStructuredArticle(null)
                }} className="hover:bg-gray-700/50">
                  <FileText className="h-4 w-4 mr-2" />
                  {t('admin.structuredArticle.create')}
                </Button>
              </div>
            </div>
          </div>


          {/* 文档分类显示 */}
          <div className="space-y-6">
            {/* 结构化文章 - 使用车辆层级结构 */}
            {documents.filter(doc => (doc.documentType || doc.type) === 'structured').length > 0 && (
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Car className="h-5 w-5 mr-2 text-blue-400" />
                {t('knowledge.sections.vehicleResearch')}
              </h3>
              <HierarchicalManager
                items={documents.filter(doc => (doc.documentType || doc.type) === 'structured')}
                buildHierarchy={(docs) => {
                  // 按车辆信息构建层级结构：Brand > Model > Year > Documents
                  const hierarchy: { [key: string]: any } = {}
                  
                  docs.forEach((doc: any) => {
                    let brand = 'Unknown Brand'
                    let model = 'Unknown Model'  
                    let year = 'Unknown Year'
                    
                    // 优先从basicInfo字段获取车辆信息
                    if (doc.basicInfo && doc.basicInfo.brand) {
                      brand = doc.basicInfo.brand
                      model = doc.basicInfo.model || 'Unknown Model'
                      year = doc.basicInfo.yearRange || 'Unknown Year'
                    } else if (doc.category && doc.category !== 'general') {
                      // 尝试从category字段解析（旧格式兼容）
                      const vehicleParts = doc.category.split(' ')
                      if (vehicleParts.length >= 3) {
                        brand = vehicleParts[0]
                        model = vehicleParts[1]
                        year = vehicleParts.slice(2).join(' ').replace(/[()]/g, '')
                      }
                    }
                    
                    // 构建层级路径
                    if (!hierarchy[brand]) hierarchy[brand] = {}
                    if (!hierarchy[brand][model]) hierarchy[brand][model] = {}
                    if (!hierarchy[brand][model][year]) hierarchy[brand][model][year] = []
                    
                    hierarchy[brand][model][year].push(doc)
                  })
                  
                  // 转换为HierarchyNode格式
                  const buildNodes = (obj: any, path: string[] = [], type: string = 'brand'): any[] => {
                    return Object.entries(obj).map(([key, value]) => {
                      const nodeId = [...path, key].join('/')
                      
                      if (Array.isArray(value)) {
                        // 叶子节点 - 文档列表
                        return {
                          id: nodeId,
                          name: key,
                          type: 'document-group',
                          count: value.length,
                          data: value,
                          children: []
                        }
                      } else {
                        // 中间节点
                        const children = buildNodes(value, [...path, key], getNextType(type))
                        const totalCount = children.reduce((sum, child) => sum + (child.count || 0), 0)
                        
                        return {
                          id: nodeId,
                          name: key,
                          type,
                          count: totalCount,
                          children
                        }
                      }
                    })
                  }
                  
                  const getNextType = (currentType: string): string => {
                    const typeMap: { [key: string]: string } = {
                      'brand': 'model',
                      'model': 'year',
                      'year': 'document-group'
                    }
                    return typeMap[currentType] || 'document-group'
                  }
                  
                  return buildNodes(hierarchy)
                }}
                renderLeafNode={(node) => (
                  <div className="space-y-2">
                    {node.data?.map((doc: any) => (
                      <div key={doc.id || doc._id} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="text-white font-medium">{doc.title}</h4>
                              <span className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded-full">
                                {t('knowledge.sections.vehicleResearch')}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm mb-2">
                              {t('knowledge.author')}: {doc.author || t('knowledge.technicalTeam')}
                            </p>
                            {doc.summary && (
                              <p className="text-gray-400 text-sm mb-2">{doc.summary}</p>
                            )}
                            <div className="text-xs text-gray-500">
                              {t('knowledge.createdAt')}: {new Date(doc.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button variant="outline" size="sm" onClick={() => handlePreviewDocument(doc)}>
                              <Eye className="h-3 w-3 mr-1" />
                              {t('common.preview')}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleStartEditDocument(doc)}>
                              <Edit className="h-3 w-3 mr-1" />
                              {t('common.edit')}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteDocument(doc._id || doc.id)}>
                              <Trash2 className="h-3 w-3 mr-1" />
                              {t('common.delete')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </div>
            )}

            {/* 视频教程 - 增强管理器 */}
            <EnhancedDocumentManager
              documentType="video"
              onCreateDocument={() => {
                setEditingDocument({
                  title: '',
                  summary: '',
                  videos: [{ url: '', title: '', description: '', platform: 'custom', duration: '', order: 0 }],
                  primaryTags: [],
                  secondaryTags: []
                })
                setShowVideoEditModal(true)
              }}
              onEditDocument={handleStartEditDocument}
              onDeleteDocument={handleDeleteDocument}
              onPreviewDocument={handlePreviewDocument}
            />

            {/* 图文教程 - 增强管理器 */}
            <EnhancedDocumentManager
              documentType="general"
              onCreateDocument={() => {
                setEditingEnhancedDocument(null)
                setShowEnhancedDocumentEditor(true)
              }}
              onEditDocument={handleStartEditDocument}
              onDeleteDocument={handleDeleteDocument}
              onPreviewDocument={handlePreviewDocument}
            />
          </div>
        </div>
      )}

      {/* 系统设置 */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-white">{t('admin.tabs.settings')}</h2>
            <Button onClick={() => setShowSiteSettings(true)}>
              <Settings className="h-4 w-4 mr-2" />
              {t('admin.siteSettings.title')}
            </Button>
          </div>
          
          {settingsMessage && (
            <div className={`p-4 rounded-md ${settingsMessage.includes(t('systemSettings.success')) ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {settingsMessage}
            </div>
          )}
          
                     <Card>
             <CardHeader>
               <CardTitle>{t('systemSettings.adminAccessControl')}</CardTitle>
               <CardDescription>{t('systemSettings.adminAccessControlDesc')}</CardDescription>
             </CardHeader>
            <CardContent className="space-y-4">
              <div>
                                 <label className="block text-sm font-medium text-gray-300 mb-1">
                   {t('systemSettings.newAdminPassword')}
                 </label>
                 <Input 
                   type="password" 
                   placeholder={t('systemSettings.newAdminPasswordPlaceholder')} 
                   value={newPassword}
                   onChange={(e) => setNewPassword(e.target.value)}
                 />
                {newPassword && (
                  <p className={`text-sm mt-1 ${
                    passwordStrength.strength === 'strong' ? 'text-green-600' :
                    passwordStrength.strength === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {passwordStrength.message}
                  </p>
                )}
              </div>
              
                             {newPassword && (
                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-1">
                     {t('systemSettings.confirmNewPassword')}
                   </label>
                   <Input 
                     type="password" 
                     placeholder={t('systemSettings.confirmNewPasswordPlaceholder')} 
                     value={confirmPassword}
                     onChange={(e) => setConfirmPassword(e.target.value)}
                   />
                 </div>
               )}
              
              <div>
                                 <label className="block text-sm font-medium text-gray-300 mb-1">
                   {t('systemSettings.sessionTimeout')}
                 </label>
                 <Input 
                   type="number" 
                  placeholder={t('systemSettings.sessionTimeout')} 
                   value={sessionTimeout}
                   onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 24)}
                   min="1"
                   max="168"
                 />
                 <p className="text-sm text-gray-500 mt-1">{t('systemSettings.sessionTimeoutDesc')}</p>
              </div>
              
                             <div className="flex space-x-2">
                 <Button onClick={handleSaveSettings}>{t('admin.settings.saveSettings')}</Button>
                 <Button variant="outline" onClick={handleResetPassword}>{t('admin.settings.resetPassword')}</Button>
               </div>
            </CardContent>
          </Card>



        </div>
      )}


      {/* 联系信息管理 */}
      {activeTab === 'contact' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">{t('admin.tabs.contact')}</h2>
            <Button onClick={() => setShowAddContactInfo(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('admin.contact.add')}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {contactInfo.map(info => (
              <Card key={info.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white">{info.label}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          info.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-700/30 text-gray-400'
                        }`}>
                          {info.isActive ? t('contact.enabled') : t('contact.disabled')}
                        </span>
                      </div>
                      <p className="text-gray-400 mt-1">{info.value}</p>
                      <p className="text-sm text-gray-500 mt-1">{t('admin.contact.type')}: {info.type} | {t('admin.contact.icon')}: {info.icon} | {t('admin.contact.order')}: {info.order}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleStartEditContactInfo(info)}>
                        <Edit className="h-4 w-4 mr-1" />
                        {t('common.edit')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteContactInfo(info.id)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t('common.delete')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* AI助手配置 */}
      {activeTab === 'ai' && (
        <AIConfigManager />
      )}

      {/* 公告横幅管理 */}
      {activeTab === 'announcement' && (
        <AnnouncementManager
          announcementContent={announcementContent}
          setAnnouncementContent={setAnnouncementContent}
          announcementEnabled={announcementEnabled}
          announcementType={announcementType}
          setAnnouncementType={setAnnouncementType}
          announcementFontSize={announcementFontSize}
          setAnnouncementFontSize={setAnnouncementFontSize}
          announcementFontWeight={announcementFontWeight}
          setAnnouncementFontWeight={setAnnouncementFontWeight}
          announcementFontStyle={announcementFontStyle}
          setAnnouncementFontStyle={setAnnouncementFontStyle}
          announcementTextColor={announcementTextColor}
          setAnnouncementTextColor={setAnnouncementTextColor}
          announcementScrolling={announcementScrolling}
          setAnnouncementScrolling={setAnnouncementScrolling}
          announcementCloseable={announcementCloseable}
          setAnnouncementCloseable={setAnnouncementCloseable}
          announcementRememberDays={announcementRememberDays}
          setAnnouncementRememberDays={setAnnouncementRememberDays}
          handleToggleAnnouncement={handleToggleAnnouncement}
          handleSaveAnnouncement={handleSaveAnnouncement}
        />
      )}

      {/* 系统监控面板 */}
      {activeTab === 'systemMonitor' && <SystemMonitor />}

      {/* 第三方服务配置 */}
      {activeTab === 'systemConfig' && <SystemConfigManager />}

      {/* 网站图片管理 */}
      {activeTab === 'siteImages' && <SiteImagesManager />}

      {/* 联系表单管理 */}
      {activeTab === 'forms' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">{t('admin.settings.contactFormManagement')}</h2>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleExportForms}>
                <Download className="h-4 w-4 mr-2" />
                {t('admin.settings.exportData')}
              </Button>
              <Button variant="outline" onClick={handleClearAllForms} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                {t('admin.settings.clearAllData')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {contactForms.map(form => (
              <Card key={form.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white">{form.subject}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          form.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                          form.status === 'read' ? 'bg-blue-100 text-blue-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {form.status === 'pending' ? t('contact.status.pending') : 
                           form.status === 'read' ? t('contact.status.read') : t('contact.status.replied')}
                        </span>
                      </div>
                      <p className="text-gray-400 mt-1">{t('contact.from')}: {form.name} ({form.email})</p>
                      {form.orderNumber && (
                        <p className="text-gray-400 text-sm mt-1">{t('contact.form.orderNumber')}: {form.orderNumber}</p>
                      )}
                      <p className="text-gray-500 text-sm mt-1">{form.message.substring(0, 100)}...</p>
                      <p className="text-xs text-gray-400 mt-2">{t('contact.submitTime')}: {new Date(form.submitTime).toLocaleString()}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setViewingForm(form)
                          setShowViewForm(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t('common.preview')}
                      </Button>
                      <select
                        value={form.status}
                        onChange={(e) => handleUpdateFormStatus(form.id, e.target.value)}
                        className="text-sm border border-gray-600/50 rounded px-2 py-1"
                      >
                        <option value="pending">{t('contact.status.pending')}</option>
                        <option value="read">{t('contact.status.read')}</option>
                        <option value="replied">{t('contact.status.replied')}</option>
                      </select>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteForm(form.id)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t('common.delete')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 查看表单详情模态框 */}
      {showViewForm && viewingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle>{t('admin.forms.formDetails')}</CardTitle>
                <button onClick={() => setShowViewForm(false)} className="text-gray-400 hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4 pr-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">{t('contact.form.name')}</label>
                <p className="text-white bg-gray-700/30 rounded px-3 py-2 break-words">{viewingForm.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">{t('contact.form.email')}</label>
                <p className="text-white bg-gray-700/30 rounded px-3 py-2 break-words">{viewingForm.email}</p>
              </div>

              {viewingForm.orderNumber && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">{t('contact.form.orderNumber')}</label>
                  <p className="text-white bg-gray-700/30 rounded px-3 py-2 break-words">{viewingForm.orderNumber}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">{t('contact.form.subject')}</label>
                <p className="text-white bg-gray-700/30 rounded px-3 py-2 break-words">{viewingForm.subject}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">{t('contact.form.message')}</label>
                <p className="text-white bg-gray-700/30 rounded px-3 py-2 whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto">{viewingForm.message}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">{t('contact.submitTime')}</label>
                <p className="text-white bg-gray-700/30 rounded px-3 py-2 break-words">{new Date(viewingForm.submitTime).toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">{t('contact.status.pending')}</label>
                <div className="bg-gray-700/30 rounded px-3 py-2">
                  <span className={`px-2 py-1 rounded text-sm font-medium inline-block ${
                    viewingForm.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    viewingForm.status === 'read' ? 'bg-blue-100 text-blue-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {viewingForm.status === 'pending' ? t('contact.status.pending') : 
                     viewingForm.status === 'read' ? t('contact.status.read') : t('contact.status.replied')}
                  </span>
                </div>
              </div>
            </CardContent>

            <div className="flex-shrink-0 border-t border-gray-600 p-4">
              <Button onClick={() => setShowViewForm(false)} className="w-full">
                {t('common.cancel')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 分类管理 */}
      {activeTab === 'categories' && (
        <CategoryManager />
      )}

      {/* 文档留言管理 */}
      {activeTab === 'vehicle-feedback' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">{t('admin.feedbackManagement.title')}</h2>
          </div>

          {/* 分类标签 */}
          <div className="flex space-x-2">
            <Button
              onClick={() => setFeedbackFilter('all')}
              variant={feedbackFilter === 'all' ? 'primary' : 'outline'}
              className={feedbackFilter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              {t('admin.feedbackManagement.allFeedback')}
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {allFeedback.length}
              </span>
            </Button>
            <Button
              onClick={() => setFeedbackFilter('video')}
              variant={feedbackFilter === 'video' ? 'primary' : 'outline'}
              className={feedbackFilter === 'video' ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              {t('admin.feedbackManagement.videoFeedback')}
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {allFeedback.filter(f => f.documentInfo.type === 'video').length}
              </span>
            </Button>
            <Button
              onClick={() => setFeedbackFilter('image-text')}
              variant={feedbackFilter === 'image-text' ? 'primary' : 'outline'}
              className={feedbackFilter === 'image-text' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {t('admin.feedbackManagement.imageTextFeedback')}
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {allFeedback.filter(f => f.documentInfo.type === 'image-text').length}
              </span>
            </Button>
            <Button
              onClick={() => setFeedbackFilter('structured')}
              variant={feedbackFilter === 'structured' ? 'primary' : 'outline'}
              className={feedbackFilter === 'structured' ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              {t('admin.feedbackManagement.vehicleDataFeedback')}
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {allFeedback.filter(f => f.documentInfo.type === 'structured').length}
              </span>
            </Button>
          </div>

          {/* 留言列表 */}
          <div className="space-y-4">
            {allFeedback
              .filter(feedback => feedbackFilter === 'all' || feedback.documentInfo.type === feedbackFilter)
              .map(feedback => (
                <Card key={feedback.id} className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-6">
                    {/* 留言头部 */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            feedback.documentInfo.type === 'video' ? 'bg-purple-600/20 text-purple-300' :
                            feedback.documentInfo.type === 'image-text' ? 'bg-green-600/20 text-green-300' :
                            feedback.documentInfo.type === 'structured' ? 'bg-orange-600/20 text-orange-300' :
                            'bg-gray-600/20 text-gray-300'
                          }`}>
                            {feedback.documentInfo.type === 'video' ? t('admin.feedbackManagement.videoFeedback') :
                             feedback.documentInfo.type === 'image-text' ? t('admin.feedbackManagement.imageTextFeedback') :
                             feedback.documentInfo.type === 'structured' ? t('admin.feedbackManagement.vehicleDataFeedback') :
                             feedback.documentInfo.type}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {t('admin.feedbackManagement.document')}: {feedback.documentInfo.title}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="font-medium text-white">{feedback.author}</span>
                          <span>{new Date(feedback.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFeedback(feedback.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* 留言内容 */}
                    <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                      <p className="text-gray-300 whitespace-pre-wrap">{feedback.content}</p>
                    </div>

                    {/* 回复列表 */}
                    {feedback.replies && feedback.replies.length > 0 && (
                      <div className="space-y-2 mb-4 ml-6 border-l-2 border-gray-700 pl-4">
                        <h6 className="text-sm font-medium text-gray-400 mb-2">
                          {t('admin.feedbackManagement.replies')} ({feedback.replies.length})
                        </h6>
                        {feedback.replies.map(reply => (
                          <div
                            key={reply.id}
                            className={`rounded-lg p-3 ${
                              reply.isAdmin
                                ? 'bg-blue-900/30 border border-blue-600/30'
                                : 'bg-gray-800/50'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center space-x-2">
                                <span className={`text-sm font-medium ${
                                  reply.isAdmin ? 'text-blue-300' : 'text-gray-300'
                                }`}>
                                  {reply.isAdmin && (
                                    <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded mr-2">
                                      {t('admin.feedbackManagement.adminReply')}
                                    </span>
                                  )}
                                  {reply.author}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(reply.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteReply(feedback.id, reply.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-6 px-2"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 回复表单 */}
                    {replyingTo === feedback.id ? (
                      <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={t('admin.feedbackManagement.replyPlaceholder')}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                          rows={3}
                        />
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleAddReply(feedback.id)}
                            disabled={!replyContent.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {t('admin.feedbackManagement.submitReply')}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyContent('')
                            }}
                          >
                            {t('common.cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReplyingTo(feedback.id)}
                        className="text-blue-400 border-blue-600 hover:bg-blue-900/20"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {t('admin.feedbackManagement.reply')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}

            {allFeedback.filter(feedback => feedbackFilter === 'all' || feedback.documentInfo.type === feedbackFilter).length === 0 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-12">
                  <div className="text-center text-gray-400">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">{t('admin.feedbackManagement.noFeedback')}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* 删除留言确认弹窗 */}
      {feedbackToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">{t('common.confirm')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-6">{t('admin.feedbackManagement.deleteConfirm')}</p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setFeedbackToDelete(null)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={confirmDeleteFeedback}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {t('common.delete')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 删除回复确认弹窗 */}
      {replyToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">{t('common.confirm')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-6">{t('admin.feedbackManagement.deleteReplyConfirm')}</p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setReplyToDelete(null)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={confirmDeleteReply}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {t('common.delete')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 新增文档模态框 */}
      {showAddDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {newDocument.type === 'article' ? t('admin.documents.createGeneralDocument') : 
               newDocument.type === 'video' ? t('admin.documents.createVideoTutorial') : t('admin.documents.uploadFile')}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{t('documentEditor.documentTitle')}</label>
                  <Input 
                    placeholder={t('documentEditor.documentTitlePlaceholder')} 
                    value={newDocument.title}
                    onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                  />
                </div>
                {/* 通用文档和视频教程不需要选择车型 */}
                {newDocument.type !== 'article' && newDocument.type !== 'video' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">{t('documentEditor.relatedVehicle')}</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newDocument.vehicle}
                      onChange={(e) => setNewDocument({...newDocument, vehicle: e.target.value})}
                    >
                      <option value="">{t('documentEditor.selectVehicleOptional')}</option>
                      {vehicles.map(vehicle => (
                        <option key={vehicle.id} value={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}>
                          {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{t('knowledge.author')}</label>
                  <Input 
                    placeholder={t('knowledge.authorPlaceholder')} 
                    value={newDocument.author}
                    onChange={(e) => setNewDocument({...newDocument, author: e.target.value})}
                  />
                </div>
                {/* Removed "Document Type Selection" and "Document Password" */}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('knowledge.summary')}</label>
                <Input 
                  placeholder={t('knowledge.summaryPlaceholder')} 
                  value={newDocument.summary}
                  onChange={(e) => setNewDocument({...newDocument, summary: e.target.value})}
                />
              </div>

              {newDocument.type === 'article' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{t('documentEditor.articleContent')}</label>
                  <GeneralDocumentRichTextEditor
                    value={newDocument.content}
                    onChange={(content) => setNewDocument({...newDocument, content})}
                                         placeholder={t('documentEditor.articleContentPlaceholder')}
                    className="min-h-[300px]"
                  />
                </div>
              ) : newDocument.type === 'video' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{t('documentEditor.videoLink')}</label>
                  <Input 
                    placeholder={t('documentEditor.videoLinkPlaceholder')} 
                    value={newDocument.content}
                    onChange={(e) => setNewDocument({...newDocument, content: e.target.value})}
                  />
                                     <p className="text-sm text-gray-500 mt-2">
                     {t('documentEditor.videoLinkDesc')}
                   </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{t('documentEditor.fileUpload')}</label>
                  <div className="border-2 border-dashed border-gray-600/50 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">{t('documentEditor.dragDropOrClick')}</p>
                    <p className="text-sm text-gray-500 mt-2">{t('documentEditor.supportedFormats')}</p>
                    <Button variant="outline" className="mt-4">
                      <Upload className="h-4 w-4 mr-2" />
                      {t('documentEditor.selectFile')}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleAddDocument} className="flex-1">
                  {newDocument.type === 'article' ? t('documentEditor.createArticle') : 
                   newDocument.type === 'video' ? t('documentEditor.createVideoTutorial') : t('documentEditor.uploadFile')}
                </Button>
                                 <Button variant="outline" onClick={() => setShowAddDocument(false)} className="flex-1">{t('documentEditor.cancel')}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑文档模态框 */}
      {showEditDocument && editingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{t('knowledge.editDocument')}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{t('knowledge.documentTitle')}</label>
                  <Input 
                    placeholder={t('knowledge.documentTitlePlaceholder')} 
                    value={editingDocument.title}
                    onChange={(e) => setEditingDocument({...editingDocument, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{t('knowledge.vehicle')}</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-600/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingDocument.vehicle}
                    onChange={(e) => setEditingDocument({...editingDocument, vehicle: e.target.value})}
                  >
                    <option value="">{t('knowledge.selectVehicle')}</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle.id} value={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}>
                        {vehicle.brand} {vehicle.model} ({vehicle.year})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{t('knowledge.author')}</label>
                  <Input 
                    placeholder={t('knowledge.authorPlaceholder')} 
                    value={editingDocument.author}
                    onChange={(e) => setEditingDocument({ ...editingDocument, author: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{t('knowledge.documentType')}</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-600/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingDocument.type}
                    onChange={(e) => setEditingDocument({ ...editingDocument, type: e.target.value as 'article' | 'file' | 'structured' })}
                  >
                    <option value="article">{t('knowledge.article')}</option>
                    <option value="file">{t('knowledge.file')}</option>
                    <option value="structured">{t('knowledge.structuredArticle')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{t('knowledge.summary')}</label>
                  <Input 
                    placeholder={t('knowledge.summaryPlaceholder')} 
                    value={editingDocument.summary}
                    onChange={(e) => setEditingDocument({ ...editingDocument, summary: e.target.value })}
                  />
                </div>
                {/* 移除通用/文件文档的密码字段 */}
              </div>

              {editingDocument.type === 'article' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{t('knowledge.articleContent')}</label>
                  <GeneralDocumentRichTextEditor
                    value={editingDocument.content || ''}
                    onChange={(content) => setEditingDocument({ ...editingDocument, content })}
                    placeholder={t('knowledge.articleContentPlaceholder')}
                    className="min-h-[300px]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{t('knowledge.fileUpload')}</label>
                  <div className="border-2 border-dashed border-gray-600/50 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">{t('knowledge.fileUploadDesc')}</p>
                    <p className="text-sm text-gray-500 mt-2">{t('knowledge.fileUploadFormats')}</p>
                    <Button variant="outline" className="mt-4">
                      <Upload className="h-4 w-4 mr-2" />
                      {t('knowledge.selectFile')}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleSaveEditDocument} className="flex-1">{t('knowledge.saveChanges')}</Button>
                <Button variant="outline" onClick={() => {
                  setShowEditDocument(false)
                  setEditingDocument(null)
                }} className="flex-1">{t('common.cancel')}</Button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 添加联系信息模态框 */}
      {showAddContactInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
                          <h3 className="text-lg font-semibold mb-4">{t('admin.contact.add')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.contact.type')}</label>
                <select
                  className="w-full px-3 py-2 border border-gray-600/50 rounded-md"
                  value={newContactInfo.type}
                  onChange={(e) => setNewContactInfo({...newContactInfo, type: e.target.value as 'email' | 'phone' | 'address' | 'online' | 'forum' | 'whatsapp'})}
                >
                  <option value="email">{t('contact.email')}</option>
                  <option value="phone">{t('contact.phone')}</option>
                  <option value="address">{t('contact.address')}</option>
                  <option value="online">{t('contact.onlineService')}</option>
                  <option value="forum">{t('contact.info.forum')}</option>
                  <option value="whatsapp">{t('contact.info.whatsapp')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('contact.label')}</label>
                <Input
                  placeholder={t('contact.labelPlaceholder')}
                  value={newContactInfo.label}
                  onChange={(e) => setNewContactInfo({...newContactInfo, label: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('contact.content')}</label>
                <Input
                  placeholder={t('contact.contentPlaceholder')}
                  value={newContactInfo.value}
                  onChange={(e) => setNewContactInfo({...newContactInfo, value: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.contact.icon')}</label>
                <select
                  className="w-full px-3 py-2 border border-gray-600/50 rounded-md"
                  value={newContactInfo.icon}
                  onChange={(e) => setNewContactInfo({...newContactInfo, icon: e.target.value})}
                >
                  <option value="Mail">Mail</option>
                  <option value="Phone">Phone</option>
                  <option value="MapPin">MapPin</option>
                  <option value="MessageSquare">MessageSquare</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.contact.order')}</label>
                <Input
                  type="number"
                  placeholder={t('admin.contact.order')}
                  value={newContactInfo.order}
                  onChange={(e) => setNewContactInfo({...newContactInfo, order: parseInt(e.target.value) || 1})}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newContactInfo.isActive}
                  onChange={(e) => setNewContactInfo({...newContactInfo, isActive: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm text-gray-300">{t('contact.enabled')}</label>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button onClick={handleAddContactInfo} className="flex-1">{t('common.add')}</Button>
                <Button variant="outline" onClick={() => setShowAddContactInfo(false)} className="flex-1">{t('common.cancel')}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑联系信息模态框 */}
      {showEditContactInfo && editingContactInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
                          <h3 className="text-lg font-semibold mb-4">{t('admin.contact.edit')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.contact.type')}</label>
                <select
                  className="w-full px-3 py-2 border border-gray-600/50 rounded-md"
                  value={editingContactInfo.type}
                  onChange={(e) => setEditingContactInfo({...editingContactInfo, type: e.target.value as 'email' | 'phone' | 'address' | 'online' | 'forum' | 'whatsapp'})}
                >
                  <option value="email">{t('contact.email')}</option>
                  <option value="phone">{t('contact.phone')}</option>
                  <option value="address">{t('contact.address')}</option>
                  <option value="online">{t('contact.onlineService')}</option>
                  <option value="forum">{t('contact.info.forum')}</option>
                  <option value="whatsapp">{t('contact.info.whatsapp')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('contact.label')}</label>
                <Input
                  placeholder={t('contact.labelPlaceholder')}
                  value={editingContactInfo.label}
                  onChange={(e) => setEditingContactInfo({...editingContactInfo, label: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('contact.content')}</label>
                <Input
                  placeholder={t('contact.contentPlaceholder')}
                  value={editingContactInfo.value}
                  onChange={(e) => setEditingContactInfo({...editingContactInfo, value: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.contact.icon')}</label>
                <select
                  className="w-full px-3 py-2 border border-gray-600/50 rounded-md"
                  value={editingContactInfo.icon}
                  onChange={(e) => setEditingContactInfo({...editingContactInfo, icon: e.target.value})}
                >
                  <option value="Mail">Mail</option>
                  <option value="Phone">Phone</option>
                  <option value="MapPin">MapPin</option>
                  <option value="MessageSquare">MessageSquare</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.contact.order')}</label>
                <Input
                  type="number"
                  placeholder={t('admin.contact.order')}
                  value={editingContactInfo.order}
                  onChange={(e) => setEditingContactInfo({...editingContactInfo, order: parseInt(e.target.value) || 1})}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editingContactInfo.isActive}
                  onChange={(e) => setEditingContactInfo({...editingContactInfo, isActive: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="editIsActive" className="text-sm text-gray-300">{t('contact.enabled')}</label>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button onClick={handleSaveEditContactInfo} className="flex-1">{t('common.save')}</Button>
                <Button variant="outline" onClick={() => {
                  setShowEditContactInfo(false)
                  setEditingContactInfo(null)
                }} className="flex-1">{t('common.cancel')}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 结构化文章编辑器模态框 */}
      {showStructuredArticleEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden">
            <StructuredArticleEditor
              article={editingStructuredArticle}
              onSave={async (article: any) => {
                try {
                  // 验证必要字段
                  if (!article.title?.trim()) {
                    throw new Error(t('admin.structuredArticle.validation.titleRequired'))
                  }
                  if (!article.brand?.trim()) {
                    throw new Error(t('admin.structuredArticle.validation.brandRequired'))
                  }
                  if (!article.model?.trim()) {
                    throw new Error(t('admin.structuredArticle.validation.modelRequired'))
                  }
                  if (!article.yearRange?.trim()) {
                    throw new Error(t('admin.structuredArticle.validation.yearRangeRequired'))
                  }
                  if (!article.introduction?.trim()) {
                    throw new Error(t('admin.structuredArticle.validation.introductionRequired'))
                  }
                  if (!article.vehicleImage?.trim()) {
                    throw new Error(t('admin.structuredArticle.uploadVehicleImage') || 'Vehicle image is required')
                  }
                  
                  // 验证兼容车型（后端要求至少一个）
                  const compatibleModels = (article.compatibleModels || []).filter((m: any) => 
                    (m.modelName || m.name)?.trim() && (m.description || '').trim()
                  )
                  if (compatibleModels.length === 0) {
                    throw new Error(t('admin.structuredArticle.validation.compatibleModelsRequired'))
                  }
                  
                  // 验证FAQ（后端要求至少一个）
                  const faqs = (article.faqs || []).filter((f: any) => 
                    f.title?.trim() && f.description?.trim()
                  )
                  if (faqs.length === 0) {
                    throw new Error(t('admin.structuredArticle.validation.faqsRequired'))
                  }
                  
                  // 判断是新建还是编辑
                  const isEditing = editingStructuredArticle && (editingStructuredArticle.id || editingStructuredArticle._id)
                  const documentId = editingStructuredArticle?._id || editingStructuredArticle?.id
                  
                  // 构建结构化文章数据（符合后端Schema）
                  const structuredData: any = {
                    title: article.title.trim(),
                    documentType: 'structured',
                    summary: article.summary || (article.introduction ? 
                      (article.introduction.length > 100 ? 
                        article.introduction.substring(0, 100) + '...' : 
                        article.introduction) : 
                      t('common.noDescription')),
                    content: article.introduction.trim(),
                    category: `${article.brand.trim()} ${article.model.trim()} ${article.yearRange.trim()}`,
                    author: article.author?.trim() || t('knowledge.author'),
                    status: 'published',
                    // 结构化文章特有字段 - 必须符合后端Schema
                    basicInfo: {
                      brand: article.brand.trim(),
                      model: article.model.trim(),
                      yearRange: article.yearRange.trim(),
                      vehicleImage: article.vehicleImage.trim(), // 已验证非空
                      introduction: article.introduction.trim() // 已验证非空
                    },
                    features: {
                      supported: (article.supportedFeatures || []).map((f: any) => ({
                        name: typeof f === 'string' ? f.trim() : (f.name || '').trim(),
                        description: typeof f === 'string' ? '' : (f.description || '').trim()
                      })),
                      unsupported: (article.unsupportedFeatures || []).map((f: any) => ({
                        name: typeof f === 'string' ? f.trim() : (f.name || '').trim(),
                        description: typeof f === 'string' ? '' : (f.description || '').trim()
                      }))
                    },
                    compatibleModels: compatibleModels.map((model: any) => ({
                      name: (model.modelName || model.name || '').trim(),
                      description: (model.description || '').trim(),
                      dashboardImage: (model.dashboardImage || '').trim(),
                      originalHost: model.originalHost || {}
                    })),
                    incompatibleModels: (article.incompatibleModels || []).map((model: any) => ({
                      name: (model.name || model.modelName || '').trim(),
                      description: (model.description || '').trim(),
                      dashboardImage: (model.dashboardImage || '').trim(),
                      reason: (model.reason || '').trim()
                    })),
                    faqs: faqs.map((faq: any) => ({
                      title: faq.title.trim(),
                      description: faq.description.trim(),
                      images: faq.images || []
                    }))
                  }
                  
                  if (isEditing) {
                    // 更新现有文档
                    await updateDocument(documentId.toString(), structuredData, 'structured')
                    showToast({
                      type: 'success',
                      title: t('admin.messages.structuredArticleUpdateSuccess'),
                      description: ''
                    })
                  } else {
                    // 创建新文档
                    await createDocument(structuredData)
                    showToast({
                      type: 'success',
                      title: t('admin.messages.structuredArticleSaveSuccess'),
                      description: ''
                    })
                  }
                  
                  // 关闭编辑器
                  setShowStructuredArticleEditor(false)
                  setEditingStructuredArticle(null)
                  
                  // 尝试重新加载文档列表（如果失败不影响创建/更新的提示）
                  try {
                  const [structuredResult, videoResult, generalResult] = await Promise.all([
                    getDocuments({ documentType: 'structured', limit: 1000 }),
                    getDocuments({ documentType: 'video', limit: 1000 }),
                    getDocuments({ documentType: 'general', limit: 1000 })
                  ])
                  setDocuments([
                    ...structuredResult.documents,
                    ...videoResult.documents,
                    ...generalResult.documents
                  ])
                  } catch (refreshError) {
                    // 获取列表失败不影响创建/更新成功的提示，只记录错误
                    console.warn('保存后刷新列表失败，但文档已成功保存:', refreshError)
                    showToast({ 
                      type: 'warning', 
                      title: isEditing ? t('admin.messages.structuredArticleUpdateSuccess') : t('admin.messages.structuredArticleSaveSuccess'), 
                      description: t('common.refreshPage') || '请刷新页面查看最新列表'
                    })
                  }
                  
                } catch (error) {
                  console.error('Admin: Error saving document:', error);
                  showToast({
                    type: 'error',
                    title: t('admin.messages.saveFailed'),
                    description: error instanceof Error ? error.message : t('admin.messages.unknownError')
                  });
                }
              }}
              onCancel={() => {
                setShowStructuredArticleEditor(false)
                setEditingStructuredArticle(null)
              }}
            />
          </div>
        </div>
      )}

      {/* 编辑/创建视频教程模态框 */}
      {showVideoEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-white">
                {editingDocument?.id || editingDocument?._id ? t('common.edit') : t('admin.documents.createVideoTutorial')}
              </h2>
              <button
                onClick={() => setShowVideoEditModal(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.video.videoTitle')}</label>
                <Input
                  placeholder={t('admin.video.videoTitle')}
                  value={editingDocument?.title || ''}
                  onChange={(e) => setEditingDocument({ ...editingDocument, title: e.target.value })}
                />
              </div>

              {/* 视频链接 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-300">{t('admin.video.videoLinks')}</label>
                  <Button
                    size="sm"
                    onClick={() => {
                      const videos = editingDocument?.videos || []
                      setEditingDocument({
                        ...editingDocument,
                        videos: [...videos, { url: '', title: '', description: '', platform: 'custom', duration: '', order: videos.length }]
                      })
                    }}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {t('admin.video.addVideo')}
                  </Button>
                </div>

                {/* 视频列表 */}
                <div className="space-y-4">
                  {console.log('🎥 Debug editingDocument.videos:', editingDocument?.videos)}
                  {console.log('🎥 Debug editingDocument.videoUrl:', editingDocument?.videoUrl)}
                  {(() => {
                    // 确保至少有一个视频对象
                    let videos = editingDocument?.videos || [];
                    if (videos.length === 0 && editingDocument?.videoUrl) {
                      videos = [{
                        url: editingDocument.videoUrl,
                        title: editingDocument.title || '',
                        description: editingDocument.description || editingDocument.summary || '',
                        platform: editingDocument.platform || 'custom',
                        duration: editingDocument.duration || '',
                        order: 0
                      }];
                      // 更新 editingDocument 以包含 videos 数组
                      setTimeout(() => {
                        setEditingDocument((prev: any) => ({ ...prev, videos }));
                      }, 0);
                    }
                    return videos.map((video: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-300">{t('admin.video.videoItem')} {index + 1}</span>
                        {/* 只有多个视频时才显示删除按钮 */}
                        {editingDocument.videos.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newVideos = editingDocument.videos.filter((_: any, i: number) => i !== index)
                              setEditingDocument({ ...editingDocument, videos: newVideos })
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">{t('admin.video.videoUrl')}</label>
                          <Input
                            placeholder={t('admin.video.videoUrlPlaceholder')}
                            value={video.url || ''}
                            onChange={(e) => {
                              const newVideos = [...editingDocument.videos]
                              newVideos[index] = { ...newVideos[index], url: e.target.value }
                              setEditingDocument({ ...editingDocument, videos: newVideos })
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">{t('admin.video.videoNote')}</label>
                          <Input
                            placeholder={t('admin.video.videoNotePlaceholder')}
                            value={video.description || ''}
                            onChange={(e) => {
                              const newVideos = [...editingDocument.videos]
                              newVideos[index] = { ...newVideos[index], description: e.target.value }
                              setEditingDocument({ ...editingDocument, videos: newVideos })
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ));
                  })()}
                </div>

                {editingDocument?.videos && editingDocument.videos.length > 1 && (
                  <p className="text-xs text-gray-500 mt-2">{t('admin.video.multipleVideosTip')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('common.description')}</label>
                <textarea
                  placeholder={t('common.description')}
                  value={editingDocument?.summary || editingDocument?.description || ''}
                  onChange={(e) => setEditingDocument({ ...editingDocument, summary: e.target.value, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-md text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 分类选择 */}
                <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('category.category')}</label>
                <CategorySelector
                  selectedCategory={editingDocument?.category || ''}
                  onCategoryChange={(category) => setEditingDocument({ ...editingDocument, category })}
                  documentType="video"
                  placeholder={t('category.selectOrCreateCategory')}
                />
              </div>

              <div className="flex space-x-2 pt-4 sticky bottom-0 bg-gray-800/70 -m-6 p-6 border-t">
                <Button 
                  onClick={async () => { 
                    try {
                      // 验证标题和视频
                      if (!editingDocument?.title?.trim()) {
                        showToast({ type: 'warning', title: t('admin.video.titleRequired'), description: '' })
                        return
                      }

                      if (!editingDocument?.videos || editingDocument.videos.length === 0) {
                        showToast({ type: 'warning', title: t('admin.video.atLeastOneVideo'), description: '' })
                        return
                      }

                      // 验证每个视频都有URL
                      const hasInvalidVideo = editingDocument.videos.some((v: any) => !v.url?.trim())
                      if (hasInvalidVideo) {
                        showToast({ type: 'warning', title: t('admin.video.fillVideoUrl'), description: '' })
                        return
                      }

                      const isEditing = editingDocument?.id || editingDocument?._id
                      const documentId = editingDocument?._id || editingDocument?.id

                      // 为每个视频生成标题（如果没有的话）
                      const processedVideos = editingDocument.videos.map((v: any, index: number) => ({
                        ...v,
                        title: v.title || v.description || `${editingDocument.title} - ${t('admin.video.videoItem')} ${index + 1}`,
                        order: index
                      }))

                      // 分类系统已替代标签系统，无需转换

                      if (isEditing) {
                        // 编辑模式
                        await updateDocument(documentId, {
                          ...editingDocument,
                          videoUrl: processedVideos[0]?.url || '', // 第一个视频作为主URL
                          videos: processedVideos,
                          content: editingDocument.summary || editingDocument.title,
                          description: editingDocument.summary || editingDocument.title,
                          category: editingDocument.category || 'general'
                        }, 'video')
                        showToast({ type: 'success', title: t('common.success'), description: t('admin.documents.updateSuccess') })
                      } else {
                        // 创建模式
                        const summaryText = editingDocument.summary?.trim() || editingDocument.title.trim()
                        const videoData = {
                          title: editingDocument.title.trim(),
                          videoUrl: processedVideos[0].url.trim(), // 第一个视频作为主URL
                          videos: processedVideos,
                          description: summaryText,
                          content: summaryText,
                          summary: summaryText,
                          category: editingDocument.category || 'general',
                          author: editingDocument.author || t('knowledge.technicalTeam'),
                          documentType: 'video' as const,
                          platform: 'custom' as const,
                          status: 'published' as const
                        }
                        console.log('📤 发送视频数据:', JSON.stringify(videoData, null, 2))
                        await createDocument(videoData)
                        showToast({ type: 'success', title: t('common.success'), description: t('admin.documents.createSuccess') })
                      }

                      // 关闭模态框
                      setShowVideoEditModal(false)
                      setEditingDocument(null)

                      // 重新加载文档列表
                      try {
                        const [structuredResult, videoResult, generalResult] = await Promise.all([
                          getDocuments({ documentType: 'structured', limit: 1000 }),
                          getDocuments({ documentType: 'video', limit: 1000 }),
                          getDocuments({ documentType: 'general', limit: 1000 })
                        ])
                        setDocuments([
                          ...structuredResult.documents,
                          ...videoResult.documents,
                          ...generalResult.documents
                        ])
                      } catch (refreshError) {
                        console.warn('刷新列表失败:', refreshError)
                      }
                    } catch (error) {
                      console.error('保存失败:', error)
                      showToast({ type: 'error', title: t('admin.messages.saveFailed'), description: error instanceof Error ? error.message : t('admin.messages.unknownError') })
                    }
                  }} 
                  className="flex-1"
                >
                  {t('common.save')}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowVideoEditModal(false)
                    setEditingDocument(null)
                  }} 
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 文档预览模态框 */}
      {showPreviewModal && previewDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">{t('admin.documents.previewTitle')}</h2>
              <button
                onClick={() => {
                  setShowPreviewModal(false)
                  setPreviewDocument(null)
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="overflow-auto max-h-[calc(95vh-80px)]">
              <StructuredDocumentViewer
                document={previewDocument}
                onBack={() => {
                  setShowPreviewModal(false)
                  setPreviewDocument(null)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 增强文档编辑器模态框 */}
      {showEnhancedDocumentEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg w-full max-w-7xl h-full max-h-[95vh] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <EnhancedGeneralDocumentEditor
                document={editingEnhancedDocument}
                onSave={handleSaveEnhancedDocument}
                onCancel={handleCancelEnhancedDocument}
              />
            </div>
          </div>
        </div>
      )}

             {activeTab === 'softwareDownloads' && <SoftwareDownloadsManager />}

      {/* 网站设置模态框 */}
      <Modal
        isOpen={showSiteSettings}
        onClose={() => setShowSiteSettings(false)}
        title={t('admin.siteSettings.title')}
        size="md"
      >
        <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('admin.siteSettings.siteName')}
                </label>
                <Input
                  value={siteSettings.siteName}
                  onChange={(e) => setSiteSettings({...siteSettings, siteName: e.target.value})}
                  placeholder={t('admin.siteSettings.siteNamePlaceholder')}
                />
        </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('admin.siteSettings.logoText')}
                </label>
                <Input
                  value={siteSettings.logoText}
                  onChange={(e) => setSiteSettings({...siteSettings, logoText: e.target.value})}
                  placeholder={t('admin.siteSettings.logoTextPlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('admin.siteSettings.heroTitle')}
                </label>
                <Input
                  value={siteSettings.heroTitle}
                  onChange={(e) => setSiteSettings({...siteSettings, heroTitle: e.target.value})}
                  placeholder={t('admin.siteSettings.heroTitlePlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('admin.siteSettings.heroSubtitle')}
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-600/50 rounded-md resize-none"
                  rows={3}
                  value={siteSettings.heroSubtitle}
                  onChange={(e) => setSiteSettings({...siteSettings, heroSubtitle: e.target.value})}
                  placeholder={t('admin.siteSettings.heroSubtitlePlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('admin.siteSettings.siteSubtitle')}
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-600/50 rounded-md resize-none"
                  rows={3}
                  value={siteSettings.siteSubtitle}
                  onChange={(e) => setSiteSettings({...siteSettings, siteSubtitle: e.target.value})}
                  placeholder={t('admin.siteSettings.siteSubtitlePlaceholder')}
                />
              </div>
              
          <div className="flex space-x-2 pt-4">
            <Button onClick={handleSaveSiteSettings} className="flex-1">
              {t('common.save')}
            </Button>
            <Button variant="outline" onClick={() => setShowSiteSettings(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>
        </div>
      </div>
    </div>
  )
}

export default Admin
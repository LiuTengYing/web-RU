
import { Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/ui/ToastContainer'
import { AIProvider } from '@/contexts/AIContext'
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext'
import { UploadProvider } from '@/contexts/UploadContext'
import GlobalUploadProgress from '@/components/GlobalUploadProgress'
import AIAssistant from '@/components/ai/AIAssistant'
import CustomCursor from '@/components/CustomCursor'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'
import './styles/logo.css'
// 路由级懒加载（不改变业务逻辑，仅改变加载方式）
const Layout = lazy(() => import('@/components/Layout'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const KnowledgeBase = lazy(() => import('@/pages/KnowledgeBase'))
const Articles = lazy(() => import('@/pages/Articles'))
const Categories = lazy(() => import('@/pages/Categories'))
// const Tags = lazy(() => import('@/pages/Tags')) // 标签页面已被分类系统替代
const Contact = lazy(() => import('@/pages/Contact'))
const Forum = lazy(() => import('@/pages/Forum'))
const AudioEqualizerPage = lazy(() => import('@/pages/AudioEqualizer'))
const AudioGeneratorPage = lazy(() => import('@/pages/AudioGenerator'))
const Admin = lazy(() => import('@/pages/Admin'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const SoftwareDownloads = lazy(() => import('@/pages/SoftwareDownloads'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const Terms = lazy(() => import('@/pages/Terms'))
const Disclaimer = lazy(() => import('@/pages/Disclaimer'))


function App() {
  const { t } = useTranslation()
  return (
    <I18nextProvider i18n={i18n}>
      <SiteSettingsProvider>
        <ThemeProvider>
          <ToastProvider>
            <UploadProvider>
              <AIProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <ErrorBoundary fallback={<div className="p-6 text-red-500">{t('errors.somethingWentWrong')}</div>}>
            <Suspense fallback={<div className="p-6 text-gray-500">{t('common.loading')}</div>}>
            <Routes>
              {/* Main application routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="knowledge" element={<KnowledgeBase />} />
                <Route path="forum" element={<Forum />} />
                <Route path="articles" element={<Articles />} />
                <Route path="categories" element={<Categories />} />
                {/* <Route path="tags" element={<Tags />} /> 标签页面已被分类系统替代 */}
                <Route path="audio-equalizer" element={<AudioEqualizerPage />} />
                <Route path="audio-generator" element={<AudioGeneratorPage />} />
                <Route path="contact" element={<Contact />} />
                <Route path="software-downloads" element={<SoftwareDownloads />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="terms" element={<Terms />} />
                <Route path="disclaimer" element={<Disclaimer />} />
              </Route>
              
              {/* Independent admin panel route */}
              <Route path="admin" element={<Admin />} />
              
              {/* 404 page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            </ErrorBoundary>
            
            {/* {t('ai.assistant')} - {t('ai.globalAvailable')} */}
            <AIAssistant />
            
            {/* 自定义鼠标指针 */}
            <CustomCursor />
            
            {/* 全局上传进度 */}
            <GlobalUploadProgress />
          </div>
            </AIProvider>
            </UploadProvider>
          </ToastProvider>
        </ThemeProvider>
      </SiteSettingsProvider>
    </I18nextProvider>
  )
}

export default App
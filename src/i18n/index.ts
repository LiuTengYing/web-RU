import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 新增：改为从 JSON 语言包加载完整资源
import zh from './locales/zh.json'
import en from './locales/en.json'

// 替换：统一使用 JSON 资源，支持点号路径
const resources = {
  zh: { translation: zh },
  en: { translation: en },
}

// 初始化 i18n：移除 keySeparator/nsSeparator 的禁用设置
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // 默认英文；如英文缺失则回退中文，避免出现 key 直出
    fallbackLng: ['en', 'zh'],
    // 不再禁用 key 分隔，保持默认（支持 'a.b.c'）
    debug: true,

    interpolation: {
      escapeValue: false,
    },

    detection: {
      // 支持多种语言检测方式：URL参数 > localStorage > 浏览器语言
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    react: {
      useSuspense: false,
    },
  })

// 动态设置页面标题
const updatePageTitle = (language: string) => {
  const titles = {
    zh: 'AutomotiveHu',
    en: 'AutomotiveHu'
  }
  document.title = titles[language as keyof typeof titles] || titles.en
}

// 监听语言变化
i18n.on('languageChanged', (lng) => {
  updatePageTitle(lng)
})

// 初始化时设置标题
updatePageTitle(i18n.language || 'en')

export default i18n
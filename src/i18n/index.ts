import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 新增：改为从 JSON 语言包加载完整资源
import zh from './locales/zh.json'
import ru from './locales/ru.json'
import en from './locales/en.json'

// 替换：统一使用 JSON 资源，支持点号路径
const resources = {
  ru: { translation: ru },
  zh: { translation: zh },
  en: { translation: en },
}

// 初始化 i18n：移除 keySeparator/nsSeparator 的禁用设置
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // 强制使用中文，不依赖浏览器检测
    lng: 'zh',
    fallbackLng: ['zh', 'en', 'ru'],
    // 不再禁用 key 分隔，保持默认（支持 'a.b.c'）
    debug: false,

    interpolation: {
      escapeValue: false,
    },

    detection: {
      // 优先使用URL参数和localStorage，减少浏览器自动检测
      order: ['querystring', 'localStorage'],
      caches: ['localStorage'],
      lookupQuerystring: 'lng',
      lookupLocalStorage: 'i18nextLng'
    },

    react: {
      useSuspense: false,
    },
  })

// 强制设置初始语言为中文
if (typeof window !== 'undefined') {
  localStorage.setItem('i18nextLng', 'zh');
}

// 动态设置页面标题
const updatePageTitle = (language: string) => {
  const titles = {
    ru: 'AutomotiveHu',
    zh: 'AutomotiveHu',
    en: 'AutomotiveHu'
  }
  document.title = titles[language as keyof typeof titles] || titles.ru
}

// 监听语言变化
i18n.on('languageChanged', (lng) => {
  updatePageTitle(lng)
})

// 初始化时设置标题
updatePageTitle(i18n.language || 'ru')

export default i18n
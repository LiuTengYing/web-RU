import React from 'react'
import { useTranslation } from 'react-i18next'
import { Shield } from 'lucide-react'

const Privacy: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isEnglish = i18n.language === 'en'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 页面标题 - 优化版 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/30 mb-6">
            <Shield className="h-10 w-10 text-blue-400" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            {t('legal.privacy.title')}
          </h1>
          <p className="text-xl text-gray-400">{t('legal.privacy.subtitle')}</p>
        </div>

        {/* 内容区域 - 优化排版 */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 md:p-12">
          {/* 最后更新信息 */}
          <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-l-4 border-blue-500 rounded-r-xl p-6 mb-10">
            <p className="text-sm text-gray-300">
              <span className="font-semibold">{t('legal.lastUpdated')}：</span>
              <span className="ml-2">
                {isEnglish 
                  ? `${new Date().toLocaleString('en-US', { month: 'long' })} ${new Date().getFullYear()}`
                  : `${new Date().getFullYear()} ${t('legal.year')} ${new Date().getMonth() + 1} ${t('legal.month')}`
                }
              </span>
            </p>
          </div>
          
          <div className="space-y-10 text-gray-300">

          {/* 1. 简介 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.privacy.intro.title')}</h2>
            <p className="leading-relaxed">
              {t('legal.privacy.intro.content')}
            </p>
          </section>

          {/* 2. 信息收集 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.privacy.collection.title')}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">{t('legal.privacy.collection.provided.title')}</h3>
                <p>{t('legal.privacy.collection.provided.desc')}</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                  {(t('legal.privacy.collection.provided.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">{t('legal.privacy.collection.automatic.title')}</h3>
                <p>{t('legal.privacy.collection.automatic.desc')}</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                  {(t('legal.privacy.collection.automatic.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 3. 信息使用 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.privacy.usage.title')}</h2>
            <p>{t('legal.privacy.usage.desc')}</p>
            <ul className="list-disc list-inside mt-2 space-y-2 text-gray-400">
              {(t('legal.privacy.usage.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 4. 信息保护 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.privacy.security.title')}</h2>
            <p>{t('legal.privacy.security.desc')}</p>
            <ul className="list-disc list-inside mt-2 space-y-2 text-gray-400">
              {(t('legal.privacy.security.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 5. 信息共享 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.privacy.sharing.title')}</h2>
            <p>{t('legal.privacy.sharing.desc')}</p>
            <ul className="list-disc list-inside mt-2 space-y-2 text-gray-400">
              {(t('legal.privacy.sharing.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 6. Cookie 政策 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.privacy.cookies.title')}</h2>
            <p>{t('legal.privacy.cookies.content')}</p>
          </section>

          {/* 7. 您的权利 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.privacy.rights.title')}</h2>
            <p>{t('legal.privacy.rights.desc')}</p>
            <ul className="list-disc list-inside mt-2 space-y-2 text-gray-400">
              {(t('legal.privacy.rights.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 8. 联系我们 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.privacy.contact.title')}</h2>
            <p>{t('legal.privacy.contact.content')}</p>
            <div className="mt-4 bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <button 
                onClick={() => window.location.href = '/contact'}
                className="text-blue-400 hover:text-blue-300 transition-colors font-semibold hover:underline"
              >
                → {t('legal.visitContact')}
              </button>
            </div>
          </section>

          {/* 9. 政策变更 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.privacy.changes.title')}</h2>
            <p>{t('legal.privacy.changes.content')}</p>
          </section>
          </div>
        </div>

        {/* 返回链接 - 优化版 */}
        <div className="mt-12 text-center">
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white border border-gray-700 rounded-xl transition-all duration-300 font-medium"
          >
            <span>←</span>
            <span>{t('legal.backToPrevious')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Privacy

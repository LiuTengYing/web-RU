import React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle } from 'lucide-react'

const Disclaimer: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isEnglish = i18n.language === 'en'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 页面标题 - 优化版 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-2 border-yellow-500/30 mb-6">
            <AlertCircle className="h-10 w-10 text-yellow-400" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            {t('legal.disclaimer.title')}
          </h1>
          <p className="text-xl text-gray-400">{t('legal.disclaimer.subtitle')}</p>
        </div>

        {/* 内容区域 - 优化排版 */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 md:p-12">
          {/* 最后更新信息 */}
          <div className="bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border-l-4 border-yellow-500 rounded-r-xl p-6 mb-10">
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

          {/* 1. 一般免责声明 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.disclaimer.general.title')}</h2>
            <p className="leading-relaxed">{t('legal.disclaimer.general.content')}</p>
          </section>

          {/* 2. 技术信息免责声明 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.disclaimer.technical.title')}</h2>
            <p className="leading-relaxed">{t('legal.disclaimer.technical.content')}</p>
            <div className="mt-4 bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
              <p className="text-sm text-yellow-300">
                <strong>{t('legal.disclaimer.technical.warning')}</strong>
              </p>
            </div>
          </section>

          {/* 3. 安装和使用责任 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.disclaimer.installation.title')}</h2>
            <p>{t('legal.disclaimer.installation.desc')}</p>
            <ul className="list-disc list-inside mt-2 space-y-2 text-gray-400">
              {(t('legal.disclaimer.installation.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 4. 第三方内容 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.disclaimer.thirdParty.title')}</h2>
            <p>{t('legal.disclaimer.thirdParty.content1')}</p>
            <p className="mt-4">{t('legal.disclaimer.thirdParty.content2')}</p>
          </section>

          {/* 5. 专业咨询 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.disclaimer.professional.title')}</h2>
            <p>{t('legal.disclaimer.professional.content')}</p>
          </section>

          {/* 6. 保修免责声明 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.disclaimer.warranty.title')}</h2>
            <p className="mb-4">{t('legal.disclaimer.warranty.desc')}</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              {(t('legal.disclaimer.warranty.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 7. 责任限制 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.disclaimer.liability.title')}</h2>
            <p>{t('legal.disclaimer.liability.content')}</p>
          </section>

          {/* 8. 您的假设 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.disclaimer.assumption.title')}</h2>
            <p>{t('legal.disclaimer.assumption.content')}</p>
          </section>

          {/* 9. 适用法律 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.disclaimer.law.title')}</h2>
            <p>{t('legal.disclaimer.law.content')}</p>
          </section>

          {/* 10. 修改权利 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.disclaimer.modifications.title')}</h2>
            <p>{t('legal.disclaimer.modifications.content')}</p>
          </section>

          {/* 11. 联系我们 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.disclaimer.contact.title')}</h2>
            <p>{t('legal.disclaimer.contact.content')}</p>
            <div className="mt-4 bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <button 
                onClick={() => window.location.href = '/contact'}
                className="text-primary-300 hover:text-primary-200 transition-colors font-semibold hover:underline"
              >
                → {t('legal.visitContact')}
              </button>
            </div>
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

export default Disclaimer

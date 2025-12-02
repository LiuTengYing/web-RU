import React from 'react'
import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'

const Terms: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isEnglish = i18n.language === 'en'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 页面标题 - 优化版 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500/20 to-emerald-500/20 border-2 border-primary-400/30 mb-6">
            <FileText className="h-10 w-10 text-primary-200" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            {t('legal.terms.title')}
          </h1>
          <p className="text-xl text-gray-400">{t('legal.terms.subtitle')}</p>
        </div>

        {/* 内容区域 - 优化排版 */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 md:p-12">
          {/* 最后更新信息 */}
          <div className="bg-gradient-to-r from-primary-500/10 to-emerald-500/10 border-l-4 border-primary-500 rounded-r-xl p-6 mb-10">
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

          {/* 1. 接受条款 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.terms.acceptance.title')}</h2>
            <p className="leading-relaxed">
              {t('legal.terms.acceptance.content')}
            </p>
          </section>

          {/* 2. 使用许可 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.terms.license.title')}</h2>
            <p>{t('legal.terms.license.intro')}</p>
            <p className="mt-4">{t('legal.terms.license.allowedTitle')}</p>
            <ul className="list-disc list-inside mt-2 space-y-2 text-gray-400">
              {(t('legal.terms.license.allowed', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="mt-4">{t('legal.terms.license.prohibitedTitle')}</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              {(t('legal.terms.license.prohibited', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 3. 知识产权 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.terms.ip.title')}</h2>
            <p>{t('legal.terms.ip.content')}</p>
          </section>

          {/* 4. 免责声明 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.terms.asIs.title')}</h2>
            <p>{t('legal.terms.asIs.content')}</p>
          </section>

          {/* 5. 责任限制 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.terms.liability.title')}</h2>
            <p>{t('legal.terms.liability.content')}</p>
          </section>

          {/* 6. 第三方链接 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.terms.thirdParty.title')}</h2>
            <p>{t('legal.terms.thirdParty.content')}</p>
          </section>

          {/* 7. 用户行为 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.terms.conduct.title')}</h2>
            <p>{t('legal.terms.conduct.desc')}</p>
            <ul className="list-disc list-inside mt-2 space-y-2 text-gray-400">
              {(t('legal.terms.conduct.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 8. 账户责任 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.terms.account.title')}</h2>
            <p>{t('legal.terms.account.content')}</p>
          </section>

          {/* 9. 终止 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.terms.termination.title')}</h2>
            <p>{t('legal.terms.termination.content')}</p>
          </section>

          {/* 10. 管辖法律 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.terms.law.title')}</h2>
            <p>{t('legal.terms.law.content')}</p>
          </section>

          {/* 11. 联系我们 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('legal.terms.contact.title')}</h2>
            <p>{t('legal.terms.contact.content')}</p>
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

export default Terms

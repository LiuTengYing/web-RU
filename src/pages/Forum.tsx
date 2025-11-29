import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const Forum = () => {
  const { t } = useTranslation()

  useEffect(() => {
    window.location.replace('https://fancygod.com/forum')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <p className="text-lg">{t('common.redirecting')}</p>
    </div>
  )
}

export default Forum

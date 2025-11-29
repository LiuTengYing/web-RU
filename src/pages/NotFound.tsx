import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

/**
 * 404页面组件
 * 显示页面未找到的错误信息
 */
const NotFound: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="text-center py-12">
            <div className="text-6xl font-bold text-blue-400 mb-4">404</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              {t('errors.notFound')}
            </h1>
            <p className="text-gray-400 mb-8">
              {t('errors.notFoundDesc', { defaultMessage: '抱歉，您访问的页面不存在或已被移除。' })}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600"
              >
                <Home className="h-4 w-4 mr-2" />
                {t('common.back', { defaultMessage: '返回首页' })}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.previous', { defaultMessage: '返回上页' })}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default NotFound 
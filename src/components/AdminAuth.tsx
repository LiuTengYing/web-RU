import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Shield, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { initializeAdminSettings } from '@/services/adminService'
import { login } from '@/services/authService'

interface AdminAuthProps {
  onAuthenticated: () => void
}

/**
 * Admin Panel Password Verification Component
 */
const AdminAuth: React.FC<AdminAuthProps> = ({ onAuthenticated }) => {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Initialize admin settings
  useEffect(() => {
    initializeAdminSettings()
  }, [])

  // Handle password verification
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // 直接使用登录接口，它会自动验证密码
      const authStatus = await login(password)
      if (authStatus.isAuthenticated) {
        onAuthenticated()
      } else {
        setError(t('adminAuth.passwordError'))
      }
    } catch (error) {
      console.error('登录失败:', error)
      setError(t('adminAuth.passwordError'))
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and title */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('adminAuth.title')}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('adminAuth.subtitle')}
          </p>
        </div>

        {/* Password verification form */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>{t('adminAuth.passwordVerification')}</CardTitle>
            <CardDescription>
              {t('adminAuth.enterAdminPassword')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('adminAuth.adminPassword')}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('adminAuth.adminPasswordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <Lock className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Lock className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? t('adminAuth.verifying') : t('adminAuth.login')}
              </Button>
            </form>


          </CardContent>
        </Card>

                    {/* Footer information */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mt-2">
            {t('adminAuth.copyright')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminAuth 
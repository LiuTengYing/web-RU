import React from 'react'
import { MessageCircle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface AIFloatingButtonProps {
  isOpen: boolean
  onClick: () => void
  hasUnread?: boolean
}

const AIFloatingButton: React.FC<AIFloatingButtonProps> = ({
  isOpen,
  onClick,
  hasUnread = false
}) => {
  const { t } = useTranslation()

  const handleClick = () => {
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      className={`
        fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-16 h-16 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-purple-600 
        text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 
        flex items-center justify-center z-50 group touch-manipulation
        ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
        ${hasUnread ? 'animate-pulse' : ''}
      `}
      title={t('ai.assistant')}
    >
      <div
        className={`
          relative group flex items-center justify-center w-16 h-16 sm:w-14 sm:h-14 rounded-full
          bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700
          text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300
          ${isOpen ? 'rotate-180' : 'rotate-0'}
        `}
        style={{ 
          cursor: 'pointer',
          pointerEvents: 'auto'
        }}
        title={isOpen ? t('ai.close') : t('knowledge.ai.openAssistant')}
      >
        {/* 未读消息指示器 */}
        {hasUnread && !isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
        
        {/* 图标 */}
        <div className="relative">
          {isOpen ? (
            <X className="h-6 w-6 transition-transform duration-300" />
          ) : (
            <MessageCircle className="h-6 w-6 transition-transform duration-300" />
          )}
        </div>
        
        {/* 悬停提示 */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          {isOpen ? t('ai.close') : t('knowledge.ai.openAssistant')}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      </div>
      
      {/* 脉冲动画环 */}
      {!isOpen && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-75 animate-ping" />
      )}
    </button>
  )
}

export default AIFloatingButton

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageCircle, Send } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { getDocumentFeedback, addUserFeedback, UserFeedback as FeedbackType } from '@/services/feedbackService'

interface DocumentFeedbackProps {
  documentId: string
  documentType: 'video' | 'image-text' | 'structured'
  className?: string
}

const DocumentFeedback: React.FC<DocumentFeedbackProps> = ({ 
  documentId, 
  documentType, 
  className = "" 
}) => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [newFeedback, setNewFeedback] = useState('')
  const [userName, setUserName] = useState('')
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [feedbackList, setFeedbackList] = useState<FeedbackType[]>([])

  // 加载留言数据
  useEffect(() => {
    const loadFeedback = async () => {
      try {
        if (!documentId) return
        
        const feedback = await getDocumentFeedback(documentId)
        setFeedbackList(feedback)
      } catch (error) {
        console.error('加载反馈失败:', error)
      }
    }
    
    loadFeedback()
  }, [documentId])

  // 添加用户留言
  const addFeedback = async () => {
    if (!newFeedback.trim() || !userName.trim()) return

    try {
      if (!documentId) {
        throw new Error('文档ID不存在')
      }

      const newFeedbackItem = await addUserFeedback(documentId, userName, newFeedback)
      
      // 更新本地状态
      setFeedbackList(prev => [...prev, newFeedbackItem])
      
      // 清空留言表单
      setNewFeedback('')
      setUserName('')
      setShowFeedbackForm(false)

      // 显示成功提示
      showToast({
        type: 'success',
        title: t('knowledge.feedbackSubmitSuccess'),
        description: t('knowledge.feedbackSubmitSuccessDesc')
      })
    } catch (error) {
      console.error('Failed to add feedback:', error)
      showToast({
        type: 'error',
        title: t('knowledge.feedbackSubmitError'),
        description: error instanceof Error ? error.message : t('common.unknownError')
      })
    }
  }

  return (
    <Card className={`bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 backdrop-blur-sm shadow-xl ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <MessageCircle className="h-5 w-5 mr-2" />
          {t('knowledge.userFeedback')}
        </CardTitle>
        <CardDescription className="text-gray-300">
          {t('knowledge.userFeedbackDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 添加留言按钮 */}
        {!showFeedbackForm && (
          <Button
            onClick={() => setShowFeedbackForm(true)}
            className="mb-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {t('knowledge.addFeedback')}
          </Button>
        )}

        {/* 留言输入表单 */}
        {showFeedbackForm && (
          <div className="mb-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('knowledge.feedbackName')}
                </label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={t('knowledge.feedbackNamePlaceholder')}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('knowledge.feedbackContent')}
                </label>
                <textarea
                  value={newFeedback}
                  onChange={(e) => setNewFeedback(e.target.value)}
                  placeholder={t('knowledge.feedbackContentPlaceholder')}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={addFeedback}
                  disabled={!newFeedback.trim() || !userName.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {t('knowledge.submitFeedback')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFeedbackForm(false)
                    setNewFeedback('')
                    setUserName('')
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 显示现有留言 */}
        {feedbackList.length > 0 ? (
          <div className="space-y-3">
            {feedbackList.map((feedback) => (
              <div key={feedback.id} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{feedback.author}</span>
                  <span className="text-gray-400 text-sm">
                    {new Date(feedback.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-3">{feedback.content}</p>
                
                {/* 显示回复 */}
                {feedback.replies && feedback.replies.length > 0 && (
                  <div className="border-t border-gray-600/30 pt-3">
                    <h6 className="text-sm font-medium text-gray-400 mb-2">
                      {t('knowledge.replies')} ({feedback.replies.length})
                    </h6>
                    <div className="space-y-2">
                      {feedback.replies.map((reply) => (
                        <div key={reply.id} className={`rounded-lg p-3 ${
                          reply.isAdmin 
                            ? 'bg-blue-900/30 border border-blue-600/30' 
                            : 'bg-gray-800/50'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-medium text-sm ${
                              reply.isAdmin 
                                ? 'text-blue-300 flex items-center' 
                                : 'text-gray-300'
                            }`}>
                              {reply.isAdmin ? (
                                <>
                                  <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                                  <span className="text-xs bg-blue-600/20 text-blue-300 px-1 py-0.5 rounded">
                                    {t('knowledge.adminReply')}
                                  </span>
                                </>
                              ) : (
                                reply.author
                              )}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {new Date(reply.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-300 text-xs">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('knowledge.noUserFeedback')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DocumentFeedback

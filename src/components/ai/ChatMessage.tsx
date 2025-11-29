import React, { useState } from 'react'
import { Bot, User, ExternalLink, FileText, PlayCircle, BookOpen, X } from 'lucide-react'
import { KnowledgeSource } from '@/services/aiService'
import { useAITranslation } from '@/hooks/useAITranslation'

export interface ChatMessageData {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: number
  sources?: KnowledgeSource[]
  isTyping?: boolean
  requiresSelection?: boolean  // 标记是否需要用户选择
  pendingSources?: any[]       // 待选择的资源列表
}

interface ChatMessageProps {
  message: ChatMessageData
  onSourceClick?: (source: any) => void
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSourceClick }) => {
  const { t } = useAITranslation()
  const isUser = message.sender === 'user'
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)

  // 转换视频URL为可嵌入的格式
  const getEmbedUrl = (videoUrl: string) => {
    if (!videoUrl) return null

    try {
      // YouTube URL转换
      if (videoUrl.includes('youtube.com/watch')) {
        const videoId = videoUrl.split('v=')[1]?.split('&')[0]
        if (videoId) return `https://www.youtube.com/embed/${videoId}`
      }
      
      if (videoUrl.includes('youtu.be/')) {
        const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0]
        if (videoId) return `https://www.youtube.com/embed/${videoId}`
      }

      // Bilibili URL转换
      if (videoUrl.includes('bilibili.com/video/')) {
        const bvid = videoUrl.split('/video/')[1]?.split('?')[0]
        if (bvid) return `https://player.bilibili.com/player.html?bvid=${bvid}&page=1`
      }

      // Google Drive 视频链接转换
      if (videoUrl.includes('drive.google.com/file/d/')) {
        const fileId = videoUrl.split('/file/d/')[1]?.split('/')[0]
        if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`
      }

      // Google Drive 另一种格式
      if (videoUrl.includes('drive.google.com') && videoUrl.includes('id=')) {
        const fileId = videoUrl.split('id=')[1]?.split('&')[0]
        if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`
      }

      // Vimeo URL转换
      if (videoUrl.includes('vimeo.com/')) {
        const videoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0]
        if (videoId) return `https://player.vimeo.com/video/${videoId}`
      }

      // 腾讯视频转换
      if (videoUrl.includes('v.qq.com/x/page/')) {
        const videoId = videoUrl.split('/x/page/')[1]?.split('.')[0]
        if (videoId) return `https://v.qq.com/txp/iframe/player.html?vid=${videoId}`
      }

      // 爱奇艺转换
      if (videoUrl.includes('iqiyi.com/v_')) {
        const videoId = videoUrl.split('v_')[1]?.split('.')[0]
        if (videoId) return `https://open.iqiyi.com/developer/player_js/coopPlayerIndex.html?vid=${videoId}`
      }

      // 优酷转换
      if (videoUrl.includes('youku.com/v_show/')) {
        const videoId = videoUrl.split('v_show/id_')[1]?.split('.')[0]
        if (videoId) return `https://player.youku.com/embed/${videoId}`
      }

      // 检查是否已经是嵌入格式的URL
      if (videoUrl.includes('/embed/') || 
          videoUrl.includes('/player/') || 
          videoUrl.includes('player.') ||
          videoUrl.includes('/preview')) {
        return videoUrl
      }

      // 检查是否是直接的视频文件
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
      if (videoExtensions.some(ext => videoUrl.toLowerCase().includes(ext))) {
        return videoUrl
      }

      // 其他情况返回null，表示无法嵌入
      return null
    } catch (error) {
      console.error('Error processing video URL:', error)
      return null
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getSourceIcon = (type: KnowledgeSource['type']) => {
    switch (type) {
      case 'general': return <FileText className="h-4 w-4" />
      case 'video': return <PlayCircle className="h-4 w-4" />
      case 'structured': return <BookOpen className="h-4 w-4" />
      default: return <ExternalLink className="h-4 w-4" />
    }
  }

  const getSourceTypeLabel = (type: KnowledgeSource['type']) => {
    switch (type) {
      case 'general': return t('ai.sources.types.general')
      case 'video': return t('ai.sources.types.video')
      case 'structured': return t('ai.sources.types.structured')
      default: return t('ai.sources.title')
    }
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      {/* 头像 */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isUser ? 'bg-blue-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'}
      `}>
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      {/* 消息内容 */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* 消息气泡 */}
        <div className={`
          px-4 py-2 rounded-2xl relative
          ${isUser 
            ? 'bg-blue-500 text-white rounded-br-sm' 
            : 'bg-gray-100 border border-gray-300 text-gray-900 rounded-bl-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white'
          }
        `}>
          {/* 打字动画 */}
          {message.isTyping ? (
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
                              <span className="text-sm text-gray-500 ml-2">{t('ai.typing')}</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          )}
        </div>

        {/* 信息来源 */}
        {message.sources && message.sources.length > 0 && !message.isTyping && !message.requiresSelection && (
          <div className="mt-3 space-y-2 max-w-full">
            <div className="text-xs text-gray-500 font-medium">{t('ai.sources.title')}</div>
            <div className="space-y-3">
              {message.sources.slice(0, 3).map((source, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
                  onClick={() => onSourceClick?.(source)}
                >
                  {/* 来源头部信息 */}
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-shrink-0 mt-0.5">
                      {getSourceIcon(source.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                          {getSourceTypeLabel(source.type)}
                        </span>
                        {source.category && (
                          <span className="text-xs text-gray-500">
                            {source.category}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1 overflow-hidden" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {source.title}
                      </h4>
                      {(source.summary || source.description) && (
                        <p className="text-xs text-gray-600 overflow-hidden" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {source.summary || source.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 媒体内容展示 */}
                  {source.type === 'video' && (
                    <div className="relative mb-2">
                      {playingVideo === source.id ? (
                        // 视频播放器
                        <div className="relative">
                          <div className="bg-black rounded-md overflow-hidden">
                            {(() => {
                              const embedUrl = getEmbedUrl(source.videoUrl || '')
                              
                              if (!embedUrl) {
                                return (
                                  <div className="w-full h-64 bg-gray-900 flex items-center justify-center text-white">
                                    <div className="text-center">
                                      <span className="text-sm">{t('common.videoUnavailable')}</span>
                                      <br />
                                      <button 
                                        onClick={() => window.open(source.videoUrl, '_blank')}
                                        className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                                      >
                                        {t('common.openInNewWindow')}
                                      </button>
                                    </div>
                                  </div>
                                )
                              }

                              // 检查是否是直接的视频文件
                              const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
                              const isDirectVideo = videoExtensions.some(ext => embedUrl.toLowerCase().includes(ext))
                              
                              if (isDirectVideo) {
                                return (
                                  <video 
                                    src={embedUrl}
                                    className="w-full h-64 object-contain"
                                    controls
                                    preload="metadata"
                                  >
                                    {t('common.browserNotSupported')}
                                  </video>
                                )
                              } else {
                                return (
                                  <iframe
                                    src={embedUrl}
                                    className="w-full h-64"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    referrerPolicy="strict-origin-when-cross-origin"
                                  />
                                )
                              }
                            })()}
                          </div>
                          <button
                            onClick={() => setPlayingVideo(null)}
                            className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1 transition-all"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        // 视频缩略图
                        <>
                          {source.thumbnail ? (
                            <div className="relative">
                              <img 
                                src={source.thumbnail} 
                                alt={source.title}
                                className="w-full h-32 object-cover rounded-md"
                              />
                              <div 
                                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-md hover:bg-opacity-40 transition-all cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setPlayingVideo(source.id)
                                }}
                              >
                                <PlayCircle className="h-8 w-8 text-white" />
                              </div>
                              {source.duration && (
                                <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                                  {source.duration}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div 
                              className="w-full h-24 bg-gray-100 rounded-md flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-200 transition-all"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPlayingVideo(source.id)
                              }}
                            >
                              <div className="text-center">
                                <PlayCircle className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                                <span className="text-xs text-gray-500">{t('ai.sources.types.video')}</span>
                              </div>
                            </div>
                          )}
                          <div className="mt-1 flex items-center justify-between text-xs">
                            <span 
                              className="text-blue-600 hover:text-blue-800 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPlayingVideo(source.id)
                              }}
                            >
                              📺 {t('common.playHere')}
                            </span>
                            {source.videoUrl && (
                              <span className="text-gray-500">
                                • {t('common.clickToView')}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {source.type === 'general' && source.images && source.images.length > 0 && (
                    <div className="mb-2">
                      <div className="flex gap-1 overflow-x-auto">
                        {source.images.slice(0, 3).map((img, idx) => (
                          <img 
                            key={idx}
                            src={img.url} 
                            alt={img.alt || t('common.image', { number: idx + 1 })}
                            className="flex-shrink-0 w-16 h-16 object-cover rounded border"
                          />
                        ))}
                        {source.images.length > 3 && (
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                            <span className="text-xs text-gray-500">+{source.images.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {source.type === 'structured' && (
                    <div className="space-y-2">
                      {source.basicInfo?.vehicleImage && (
                        <img 
                          src={source.basicInfo.vehicleImage} 
                          alt={`${source.basicInfo.brand} ${source.basicInfo.model}`}
                          className="w-full h-20 object-cover rounded-md"
                        />
                      )}
                      
                      {source.basicInfo && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">
                            {source.basicInfo.brand} {source.basicInfo.model}
                          </span>
                          {source.basicInfo.yearRange && (
                            <span className="ml-2">({source.basicInfo.yearRange})</span>
                          )}
                        </div>
                      )}

                      {source.matchingFaqs && source.matchingFaqs.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-700 mb-1">{t('ai.sources.relatedFAQs')}</div>
                          {source.matchingFaqs.slice(0, 2).map((faq, idx) => (
                            <div key={idx} className="text-xs text-gray-600 mb-1">
                              • {faq.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 标签 */}
                  {source.tags && source.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {source.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 查看详情链接 */}
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(source.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-blue-600 group-hover:text-blue-700 font-medium">
                        <ExternalLink className="h-3 w-3" />
                        <span>{t('common.viewDetails')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {message.sources.length > 3 && (
                <div className="text-center">
                  <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                    {t('ai.sources.viewMore', { count: message.sources.length - 3 })}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 时间戳 */}
        {!message.isTyping && (
          <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTime(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatMessage

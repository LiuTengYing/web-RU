import React, { useState, useEffect, useRef } from 'react'
import { Search, X, FileText, Car, Clock, Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { searchDocuments } from '@/services/documentApi'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface SearchResult {
  id: number
  type: 'vehicle' | 'document'
  title: string
  subtitle: string
  icon: any
  href: string
  views?: number
  date?: string
}

interface SearchBarProps {
  className?: string
  placeholder?: string
  onResultClick?: (result: SearchResult) => void
}

/**
 * 搜索栏组件
 * 支持车型和文档的实时搜索
 */
const SearchBar: React.FC<SearchBarProps> = ({ 
  className = "",
  placeholder,
  onResultClick 
}) => {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // 搜索逻辑
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    
    try {
      const searchTerm = searchQuery.toLowerCase()
      
      // 搜索所有类型的文档
      const [structuredDocs, videoDocs, generalDocs] = await Promise.all([
        searchDocuments(searchQuery, { documentType: 'structured', limit: 20 }),
        searchDocuments(searchQuery, { documentType: 'video', limit: 20 }),
        searchDocuments(searchQuery, { documentType: 'general', limit: 20 })
      ])
      
      // 处理文档搜索结果
      const documentResults = [...structuredDocs, ...videoDocs, ...generalDocs]
        .map(doc => ({
          id: doc._id || (doc as any).id,
          type: 'document' as const,
          title: doc.title,
          subtitle: doc.category || doc.summary || '',
          icon: FileText,
          href: `/knowledge?doc=${doc._id || (doc as any).id}`,
          views: doc.views || 0,
          date: doc.updatedAt || doc.createdAt
        }))

      // 从结构化文档中提取车型信息（作为车型结果）
      const vehicleSet = new Map<string, any>()
      structuredDocs.forEach((doc: any) => {
        if (doc.brand && doc.model) {
          const key = `${doc.brand}|${doc.model}`
          if (!vehicleSet.has(key) && 
              (doc.brand.toLowerCase().includes(searchTerm) || 
               doc.model.toLowerCase().includes(searchTerm))) {
            vehicleSet.set(key, {
              brand: doc.brand,
              model: doc.model,
              yearRange: doc.yearRange || ''
            })
          }
        }
      })
      
      const vehicleResults = Array.from(vehicleSet.values()).map((vehicle, index) => ({
        id: index,
        type: 'vehicle' as const,
        title: `${vehicle.brand} ${vehicle.model}`,
        subtitle: vehicle.yearRange,
        icon: Car,
        href: `/knowledge?brand=${encodeURIComponent(vehicle.brand)}&model=${encodeURIComponent(vehicle.model)}`,
        views: 0
      }))

      // 合并结果并按相关性排序
      const allResults = [...vehicleResults, ...documentResults]
        .sort((a, b) => {
          // 标题完全匹配的排在前面
          const aExactMatch = a.title.toLowerCase() === searchTerm
          const bExactMatch = b.title.toLowerCase() === searchTerm
          if (aExactMatch && !bExactMatch) return -1
          if (!aExactMatch && bExactMatch) return 1
          
          // 然后按浏览量排序
          return (b.views || 0) - (a.views || 0)
        })
        .slice(0, 8) // 限制结果数量

      setResults(allResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // 防抖搜索
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  // 点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 处理结果点击
  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result)
    }
    setIsOpen(false)
    setQuery('')
  }

  // 清空搜索
  const clearSearch = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* 搜索输入框 */}
             <div className="relative">
         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
         <input
           type="text"
           value={query}
           onChange={(e) => {
             setQuery(e.target.value)
             setIsOpen(true)
           }}
           onFocus={() => setIsOpen(true)}
           placeholder={placeholder || t('search.placeholder')}
           className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
         />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 搜索结果 */}
      {isOpen && (query || isLoading) && (
                 <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <LoadingSpinner size="md" className="mb-2" />
              <p>{t('search.loading')}</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                                     className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <result.icon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                        {result.title}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                        {result.subtitle}
                      </p>
                      <div className="flex items-center space-x-3 text-xs text-gray-400">
                        {result.views !== undefined && (
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{result.views}</span>
                          </div>
                        )}
                        {result.date && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(result.date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-4 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>{t('search.noResults')}</p>
              <p className="text-sm mt-1">{t('search.tryDifferent')}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default SearchBar 
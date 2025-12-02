/**
 * 首页Hero区块组件
 * 基于现有Dashboard代码重构,遵循SoC原则
 * 支持多图轮播功能
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Hero区块属性
 */
interface HeroSectionProps {
  className?: string;
}

// Hero图片列表
const HERO_IMAGES = [
  { src: '/images/hero-1.png', alt: 'Hero Image 1' },
  { src: '/images/hero-2.jpg', alt: 'Hero Image 2' },
  { src: '/images/hero-3.png', alt: 'Hero Image 3' },
];

/**
 * Hero区块组件
 */
export const HeroSection: React.FC<HeroSectionProps> = ({
  className = ''
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  
  // 自动轮播
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000); // 每5秒切换一次
    
    return () => clearInterval(interval);
  }, []);
  
  // 手动切换到上一张
  const handlePrevious = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? HERO_IMAGES.length - 1 : prev - 1
    );
  };
  
  // 手动切换到下一张
  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
  };
  
  // 跳转到指定图片
  const goToSlide = (index: number) => {
    setCurrentImageIndex(index);
  };
  
  return (
    <div className={`relative min-h-[600px] flex items-center justify-center overflow-hidden ${className}`}>
      {/* 背景图片轮播 */}
      <div className="absolute inset-0 z-0">
        {HERO_IMAGES.map((image, index) => (
          <img
            key={index}
            src={image.src}
            alt={image.alt}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              filter: 'brightness(0.5)'
            }}
            onError={() => setImageError(true)}
          />
        ))}
        
        {/* 如果所有图片都加载失败,显示渐变背景 */}
        {imageError && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        )}
      </div>


      
      {/* 左右切换按钮 */}
      <button
        onClick={handlePrevious}
        className="absolute left-4 z-30 p-3 bg-slate-900/60 hover:bg-slate-900/40 backdrop-blur-md rounded-full text-white border border-white/15 transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-teal-400/40"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button
        onClick={handleNext}
        className="absolute right-4 z-30 p-3 bg-slate-900/60 hover:bg-slate-900/40 backdrop-blur-md rounded-full text-white border border-white/15 transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-teal-400/40"
        aria-label="Next image"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
      
      {/* 指示器 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex space-x-3">
        {HERO_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-3 rounded-full transition-all duration-300 ${
              index === currentImageIndex 
                ? 'w-10 bg-teal-300 shadow-lg shadow-teal-500/40' 
                : 'w-3 bg-slate-200/60 hover:bg-teal-200/70 hover:shadow-teal-300/30'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSection;

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Car, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface VehicleData {
  [brand: string]: {
    [model: string]: {
      [year: string]: { password: string }
    }
  }
}

interface VehicleSelectorProps {
  vehicleData: VehicleData
  onSelect: (brand: string, model: string, year: string) => void
}

/**
 * Vehicle Selector Component
 * Supports three-level selection: brand, model, year
 */
const VehicleSelector: React.FC<VehicleSelectorProps> = ({ vehicleData, onSelect }) => {
  const { t } = useTranslation()
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [showYearDropdown, setShowYearDropdown] = useState(false)

  // Get all brands
  const brands = Object.keys(vehicleData)

  // Get models for selected brand
  const models = selectedBrand ? Object.keys(vehicleData[selectedBrand]) : []

  // Get years for selected model
  const years = selectedModel ? Object.keys(vehicleData[selectedBrand][selectedModel]) : []

  // Handle brand selection
  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand)
    setSelectedModel('')
    setSelectedYear('')
    setShowBrandDropdown(false)
    setShowModelDropdown(false)
    setShowYearDropdown(false)
  }

  // Handle model selection
  const handleModelSelect = (model: string) => {
    setSelectedModel(model)
    setSelectedYear('')
    setShowModelDropdown(false)
    setShowYearDropdown(false)
  }

  // Handle year selection
  const handleYearSelect = (year: string) => {
    setSelectedYear(year)
    setShowYearDropdown(false)
  }

  // Handle confirm selection
  const handleConfirm = () => {
    if (selectedBrand && selectedModel && selectedYear) {
      onSelect(selectedBrand, selectedModel, selectedYear)
    }
  }

  return (
    <div className="space-y-6">
      {/* Selector title */}
      <div className="text-center">
        <Car className="h-8 w-8 text-primary-200 mx-auto mb-2" />
        <h3 className="text-lg font-medium text-white">{t('vehicleSelector.title')}</h3>
        <p className="text-sm text-gray-300">{t('vehicleSelector.subtitle')}</p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Brand selection */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('vehicleSelector.brand')}
          </label>
          <Button
            variant="outline"
            className="w-full justify-between border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={() => {
              setShowBrandDropdown(!showBrandDropdown)
              setShowModelDropdown(false)
              setShowYearDropdown(false)
            }}
          >
            {selectedBrand || t('vehicleSelector.selectBrand')}
            <ChevronDown className="h-4 w-4" />
          </Button>
          
          {showBrandDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
              {brands.map(brand => (
                <button
                  key={brand}
                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
                  onClick={() => handleBrandSelect(brand)}
                >
                  {brand}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Model selection */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('vehicleSelector.model')}
          </label>
          <Button
            variant="outline"
            className="w-full justify-between border-gray-600 text-gray-300 hover:bg-gray-700"
            disabled={!selectedBrand}
            onClick={() => {
              if (selectedBrand) {
                setShowModelDropdown(!showModelDropdown)
                setShowYearDropdown(false)
              }
            }}
          >
            {selectedModel || t('vehicleSelector.selectModel')}
            <ChevronDown className="h-4 w-4" />
          </Button>
          
          {showModelDropdown && selectedBrand && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
              {models.map(model => (
                <button
                  key={model}
                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
                  onClick={() => handleModelSelect(model)}
                >
                  {model}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Year selection */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('vehicleSelector.year')}
          </label>
          <Button
            variant="outline"
            className="w-full justify-between border-gray-600 text-gray-300 hover:bg-gray-700"
            disabled={!selectedModel}
            onClick={() => {
              if (selectedModel) {
                setShowYearDropdown(!showYearDropdown)
              }
            }}
          >
            {selectedYear || t('vehicleSelector.selectYear')}
            <ChevronDown className="h-4 w-4" />
          </Button>
          
          {showYearDropdown && selectedModel && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
              {years.map(year => (
                <button
                  key={year}
                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
                  onClick={() => handleYearSelect(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selection result */}
      {selectedBrand && selectedModel && selectedYear && (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white">{t('vehicleSelector.selectedVehicle')}</h4>
              <p className="text-primary-200">
                {selectedBrand} {selectedModel} ({selectedYear})
              </p>
            </div>
            <Button onClick={handleConfirm} className="bg-primary-600 hover:bg-primary-500">
              {t('vehicleSelector.confirm')}
            </Button>
          </div>
        </div>
      )}

      {/* Year range instructions */}
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
        <h4 className="font-medium text-white mb-2">{t('vehicleSelector.yearInstructions')}</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• {t('vehicleSelector.yearRangeDesc')}</li>
          <li>• {t('vehicleSelector.singleYearDesc')}</li>
          <li>• {t('vehicleSelector.yearSelectionTip')}</li>
        </ul>
      </div>
    </div>
  )
}

export default VehicleSelector 
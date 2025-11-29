import mongoose, { Document, Schema } from 'mongoose'

export interface ISiteSettings extends Document {
  siteName: string
  siteSubtitle: string
  logoText: string
  heroTitle: string
  heroSubtitle: string
  createdAt: Date
  updatedAt: Date
}

const SiteSettingsSchema: Schema = new Schema({
  siteName: {
    type: String,
    required: true,
    default: 'AutomotiveHu'
  },
  siteSubtitle: {
    type: String,
    required: true,
    default: 'Professional Aftermarket Car Navigation & Compatibility Solutions'
  },
  logoText: {
    type: String,
    required: true,
    default: 'AutomotiveHu'
  },
  heroTitle: {
    type: String,
    required: true,
    default: 'AutomotiveHu'
  },
  heroSubtitle: {
    type: String,
    required: true,
    default: 'Professional Aftermarket Car Navigation & Compatibility Solutions'
  }
}, {
  timestamps: true
})

export default mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema)

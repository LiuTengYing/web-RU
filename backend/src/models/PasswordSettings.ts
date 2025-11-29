import mongoose, { Document, Schema } from 'mongoose'

export interface IPasswordSettings extends Document {
  mode: 'default' | 'custom'
  customPassword: string
  viewerEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

const passwordSettingsSchema = new Schema<IPasswordSettings>({
  mode: {
    type: String,
    enum: ['default', 'custom'],
    default: 'default'
  },
  customPassword: {
    type: String,
    default: '',
    trim: true
  },
  viewerEnabled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// 确保只有一个密码设置记录
passwordSettingsSchema.index({}, { unique: true })

export const PasswordSettings = mongoose.model<IPasswordSettings>('PasswordSettings', passwordSettingsSchema)

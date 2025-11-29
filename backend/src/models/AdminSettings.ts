import mongoose, { Document, Schema } from 'mongoose'

export interface IAdminSettings extends Document {
  password: string
  sessionTimeout: number
  createdAt: Date
  updatedAt: Date
}

const adminSettingsSchema = new Schema<IAdminSettings>({
  password: {
    type: String,
    required: true,
    trim: true
  },
  sessionTimeout: {
    type: Number,
    default: 3600000, // 1小时
    min: 300000, // 最少5分钟
    max: 86400000 // 最多24小时
  }
}, {
  timestamps: true,
  collection: 'adminsettings' // 明确指定collection名称
})

// 确保只有一个管理员设置记录
adminSettingsSchema.index({}, { unique: true })

export const AdminSettings = mongoose.model<IAdminSettings>('AdminSettings', adminSettingsSchema)

import mongoose, { Document, Schema } from 'mongoose'

export interface IContactInfo extends Document {
  type: 'email' | 'phone' | 'address' | 'online' | 'forum' | 'whatsapp'
  label: string
  value: string
  icon: string
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

const contactInfoSchema = new Schema<IContactInfo>({
  type: {
    type: String,
    enum: ['email', 'phone', 'address', 'online', 'forum', 'whatsapp'],
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// 创建索引
contactInfoSchema.index({ type: 1, isActive: 1 })
contactInfoSchema.index({ order: 1 })

export const ContactInfo = mongoose.model<IContactInfo>('ContactInfo', contactInfoSchema)

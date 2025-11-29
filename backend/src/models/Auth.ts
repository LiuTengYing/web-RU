import mongoose, { Document, Schema } from 'mongoose'

export interface IAuth extends Document {
  sessionId: string
  isAuthenticated: boolean
  expiresAt: Date
  lastLogin: Date
  ipAddress?: string
  userAgent?: string
}

const authSchema = new Schema<IAuth>({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  isAuthenticated: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// 索引
authSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL索引，自动删除过期文档

export const Auth = mongoose.model<IAuth>('Auth', authSchema)

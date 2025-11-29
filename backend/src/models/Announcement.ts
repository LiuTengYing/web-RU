import mongoose, { Schema, Document } from 'mongoose'

export interface IAnnouncement extends Document {
  enabled: boolean
  content: string
  style: {
    type: 'info' | 'warning' | 'danger' | 'success'
    fontSize: 'sm' | 'md' | 'lg'
    fontWeight: 'normal' | 'bold'
    fontStyle: 'normal' | 'italic'
    textColor?: string
  }
  behavior: {
    scrolling: boolean
    closeable: boolean
    closeRememberDays: number
  }
  createdAt: Date
  updatedAt: Date
}

const AnnouncementSchema: Schema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: false
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    style: {
      type: {
        type: String,
        enum: ['info', 'warning', 'danger', 'success'],
        default: 'info'
      },
      fontSize: {
        type: String,
        enum: ['sm', 'md', 'lg'],
        default: 'md'
      },
      fontWeight: {
        type: String,
        enum: ['normal', 'bold'],
        default: 'normal'
      },
      fontStyle: {
        type: String,
        enum: ['normal', 'italic'],
        default: 'normal'
      },
      textColor: {
        type: String,
        default: ''
      }
    },
    behavior: {
      scrolling: {
        type: Boolean,
        default: true
      },
      closeable: {
        type: Boolean,
        default: true
      },
      closeRememberDays: {
        type: Number,
        default: 7,
        min: 1,
        max: 365
      }
    }
  },
  {
    timestamps: true
  }
)

export const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema)


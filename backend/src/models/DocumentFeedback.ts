import mongoose, { Document, Schema } from 'mongoose'

export interface IUserReply {
  id: string
  author: string
  content: string
  timestamp: number
  isAdmin: boolean
}

export interface IDocumentFeedback extends Document {
  documentId: string
  author: string
  content: string
  timestamp: number
  replies: IUserReply[]
}

const userReplySchema = new Schema<IUserReply>({
  id: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Number,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
}, { _id: false })

const documentFeedbackSchema = new Schema<IDocumentFeedback>({
  documentId: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Number,
    required: true
  },
  replies: {
    type: [userReplySchema],
    default: []
  }
}, {
  timestamps: true
})

// 复合索引：documentId + timestamp
documentFeedbackSchema.index({ documentId: 1, timestamp: -1 })

export const DocumentFeedback = mongoose.model<IDocumentFeedback>('DocumentFeedback', documentFeedbackSchema)

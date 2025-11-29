import mongoose, { Document, Schema } from 'mongoose'

export interface IVehicle extends Document {
  id: number
  brand: string
  modelName: string
  year: string
  password: string
  documents: number
}

const vehicleSchema = new Schema<IVehicle>({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  modelName: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  documents: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// 索引
vehicleSchema.index({ brand: 1, modelName: 1 })

export const Vehicle = mongoose.model<IVehicle>('Vehicle', vehicleSchema)

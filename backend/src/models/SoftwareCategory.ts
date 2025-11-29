import mongoose, { Document, Schema } from 'mongoose';

export interface ISoftwareCategory extends Document {
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const softwareCategorySchema = new Schema<ISoftwareCategory>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model<ISoftwareCategory>('SoftwareCategory', softwareCategorySchema);

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;        // 加密存储
  role: 'admin' | 'user' | 'moderator';
  permissions: string[];
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // 方法
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasPermission(permission: string): boolean;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'moderator'],
    default: 'user'
  },
  permissions: [{
    type: String,
    enum: [
      'documents:create',
      'documents:read',
      'documents:update',
      'documents:delete',
      'documents:publish',
      'users:manage',
      'system:configure',
      'comments:moderate'
    ]
  }],
  avatar: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: Date
}, {
  timestamps: true
});

// 密码加密中间件
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// 密码比较方法
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// 权限检查方法
UserSchema.methods.hasPermission = function(permission: string): boolean {
  // 管理员拥有所有权限
  if (this.role === 'admin') return true;
  
  // 检查具体权限
  return this.permissions.includes(permission);
};

// 设置默认权限
UserSchema.pre('save', function(next) {
  if (this.isNew && this.permissions.length === 0) {
    // 根据角色设置默认权限
    switch (this.role) {
      case 'admin':
        this.permissions = [
          'documents:create',
          'documents:read',
          'documents:update',
          'documents:delete',
          'documents:publish',
          'users:manage',
          'system:configure',
          'comments:moderate'
        ];
        break;
      case 'moderator':
        this.permissions = [
          'documents:create',
          'documents:read',
          'documents:update',
          'documents:moderate',
          'comments:moderate'
        ];
        break;
      case 'user':
        this.permissions = [
          'documents:read',
          'documents:comment',
          'documents:like'
        ];
        break;
    }
  }
  next();
});

// 索引优化
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

export default mongoose.model<IUser>('User', UserSchema);

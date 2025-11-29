# 生产服务器部署说明 
 
## 部署步骤 
 
1. 将整个deploy-package文件夹上传到生产服务器 
2. 复制backend/config.env.example为backend/config.env并配置正确的环境变量 
3. 确保已安装Node.js和PM2 
4. 运行start-production.bat启动后端服务 
5. 配置Nginx指向frontend/dist目录 
 
## 环境变量配置 
 
请确保在backend/config.env中配置以下变量： 
- OSS_ACCESS_KEY_ID=你的阿里云AccessKey 
- OSS_ACCESS_KEY_SECRET=你的阿里云AccessSecret 
- OSS_BUCKET=你的OSS存储桶名称 
- OSS_REGION=你的OSS地域 
- OSS_ENDPOINT=你的OSS访问端点 
- MONGODB_URI=你的MongoDB连接字符串 
- OPENAI_API_KEY=你的OpenAI API密钥 

@echo off 
echo 启动生产服务器... 
cd backend 
pm2 stop knowledge-base-backend 2>nul 
pm2 delete knowledge-base-backend 2>nul 
pm2 start dist/index.js --name knowledge-base-backend --env production 
echo 后端服务已启动 
cd .. 
echo 请配置Nginx指向frontend/dist目录 
pause 

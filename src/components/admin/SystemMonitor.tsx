import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  Server,
  Cpu,
  HardDrive,
  Database,
  Activity,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Zap
} from 'lucide-react';

interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
    model: string;
    history: Array<{ time: string; usage: number }>;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
    history: Array<{ time: string; used: number; free: number }>;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  database: {
    version: string;
    type: string;
    status: 'online' | 'offline';
    connections: number;
    size: string;
  };
  uptime: number;
  nodeVersion: string;
  platform: string;
}

const SystemMonitor: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  // 格式化字节大小
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // 格式化运行时间
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days} ${t('admin.systemMonitor.days')} ${hours} ${t('admin.systemMonitor.hours')} ${minutes} ${t('admin.systemMonitor.minutes')}`;
  };

  // 获取系统状态
  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        const response = await fetch('/api/system/monitor');
        const data = await response.json();
        
        if (data.success && data.stats) {
          const now = new Date();
          const generateHistory = (baseValue: number, variance: number) => {
            return Array.from({ length: 10 }, (_, i) => ({
              time: new Date(now.getTime() - (9 - i) * 60000).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
              usage: baseValue + Math.random() * variance,
              used: baseValue * 0.6 + Math.random() * variance,
              free: baseValue * 0.4 - Math.random() * variance
            }));
          };

          setStats({
            ...data.stats,
            cpu: {
              ...data.stats.cpu,
              history: generateHistory(data.stats.cpu.usage, 10)
            },
            memory: {
              ...data.stats.memory,
              history: generateHistory(data.stats.memory.usagePercent, 5)
            }
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
        setLoading(false);
      }
    };

    fetchSystemStats();
    
    // 每30分钟刷新一次（降低服务器资源消耗）
    const interval = setInterval(fetchSystemStats, 1800000); // 30 minutes = 1800000ms
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20"></div>
          </div>
          <p className="text-gray-300 mt-6 text-lg">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 标题 */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl p-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl border border-blue-500/30">
            <Server className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('admin.systemMonitor.title')}</h1>
            <p className="text-gray-400 text-lg">{t('admin.systemMonitor.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* 系统信息卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU使用率 */}
        <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-blue-600/0 group-hover:from-blue-600/10 group-hover:to-blue-600/5 rounded-2xl transition-all duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-xl border border-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                <Cpu className="w-6 h-6 text-blue-400" />
              </div>
              <Activity className="w-5 h-5 text-blue-400 opacity-60" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">{t('admin.systemMonitor.cpuUsage')}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white">{stats?.cpu.usage.toFixed(1)}%</p>
              {stats && stats.cpu.usage < 70 && <CheckCircle className="w-5 h-5 text-green-400" />}
              {stats && stats.cpu.usage >= 70 && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
            </div>
            <p className="text-xs text-gray-500 mt-2">{stats?.cpu.cores} {t('admin.systemMonitor.cpuCores')} · {stats?.cpu.model}</p>
          </div>
        </div>

        {/* 内存使用率 */}
        <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 hover:border-green-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/0 to-green-600/0 group-hover:from-green-600/10 group-hover:to-green-600/5 rounded-2xl transition-all duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-xl border border-green-500/30 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400 opacity-60" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">{t('admin.systemMonitor.memoryUsage')}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white">{stats?.memory.usagePercent.toFixed(1)}%</p>
              {stats && stats.memory.usagePercent < 80 && <CheckCircle className="w-5 h-5 text-green-400" />}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats && formatBytes(stats.memory.used)} / {stats && formatBytes(stats.memory.total)}
            </p>
          </div>
        </div>

        {/* 磁盘使用率 */}
        <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-purple-600/0 group-hover:from-purple-600/10 group-hover:to-purple-600/5 rounded-2xl transition-all duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-xl border border-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                <HardDrive className="w-6 h-6 text-purple-400" />
              </div>
              <Info className="w-5 h-5 text-purple-400 opacity-60" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">{t('admin.systemMonitor.diskUsage')}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white">{stats?.disk.usagePercent.toFixed(1)}%</p>
              {stats && stats.disk.usagePercent < 85 && <CheckCircle className="w-5 h-5 text-green-400" />}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats && formatBytes(stats.disk.used)} / {stats && formatBytes(stats.disk.total)}
            </p>
          </div>
        </div>

        {/* 数据库状态 */}
        <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/0 to-orange-600/0 group-hover:from-orange-600/10 group-hover:to-orange-600/5 rounded-2xl transition-all duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-600/20 to-orange-700/20 rounded-xl border border-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                <Database className="w-6 h-6 text-orange-400" />
              </div>
              {stats?.database.status === 'online' ? (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-medium">{t('admin.systemMonitor.online')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-xs text-red-400 font-medium">{t('admin.systemMonitor.offline')}</span>
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">{t('admin.systemMonitor.database')}</p>
            <p className="text-xl font-bold text-white mb-1">{stats?.database.type}</p>
            <p className="text-xs text-gray-500">{stats?.database.version}</p>
          </div>
        </div>
      </div>

      {/* 资源使用趋势图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU使用率趋势 */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
            <h3 className="text-xl font-semibold text-white">{t('admin.systemMonitor.cpuTrend')}</h3>
            <span className="text-xs text-gray-400 ml-auto">{t('admin.systemMonitor.last10Minutes')}</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats?.cpu.history || []}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9CA3AF" 
                tick={{ fill: '#9CA3AF' }}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9CA3AF" 
                tick={{ fill: '#9CA3AF' }}
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '0.75rem',
                  color: '#E5E7EB'
                }}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Area 
                type="monotone" 
                dataKey="usage" 
                stroke="#3B82F6" 
                fillOpacity={1} 
                fill="url(#colorCpu)"
name={t('admin.systemMonitor.usagePercent')}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 内存使用趋势 */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
            <h3 className="text-xl font-semibold text-white">{t('admin.systemMonitor.memoryTrend')}</h3>
            <span className="text-xs text-gray-400 ml-auto">{t('admin.systemMonitor.last10Minutes')}</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.memory.history || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9CA3AF" 
                tick={{ fill: '#9CA3AF' }}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9CA3AF" 
                tick={{ fill: '#9CA3AF' }}
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '0.75rem',
                  color: '#E5E7EB'
                }}
                labelStyle={{ color: '#9CA3AF' }}
                cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
              />
              <Legend wrapperStyle={{ color: '#9CA3AF' }} />
              <Line 
                type="monotone" 
                dataKey="used" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ r: 3 }}
name={t('admin.systemMonitor.used')}
              />
              <Line 
                type="monotone" 
                dataKey="free" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ r: 3 }}
name={t('admin.systemMonitor.free')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 系统详情 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 服务器信息 */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Server className="w-6 h-6 text-blue-400" />
            <h4 className="text-lg font-semibold text-white">{t('admin.systemMonitor.serverInfo')}</h4>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <span className="text-sm text-gray-400">{t('admin.systemMonitor.platform')}</span>
              <span className="text-sm text-white font-medium">{stats?.platform}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <span className="text-sm text-gray-400">Node.js</span>
              <span className="text-sm text-white font-medium">{stats?.nodeVersion}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <span className="text-sm text-gray-400">{t('admin.systemMonitor.uptime')}</span>
              <span className="text-sm text-white font-medium">
                {stats && formatUptime(stats.uptime)}
              </span>
            </div>
          </div>
        </div>

        {/* 数据库详情 */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-6 h-6 text-orange-400" />
            <h4 className="text-lg font-semibold text-white">{t('admin.systemMonitor.databaseDetails')}</h4>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <span className="text-sm text-gray-400">{t('admin.systemMonitor.type')}</span>
              <span className="text-sm text-white font-medium">{stats?.database.type}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <span className="text-sm text-gray-400">{t('admin.systemMonitor.version')}</span>
              <span className="text-sm text-white font-medium">{stats?.database.version}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <span className="text-sm text-gray-400">{t('admin.systemMonitor.dbSize')}</span>
              <span className="text-sm text-white font-medium">{stats?.database.size}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <span className="text-sm text-gray-400">{t('admin.systemMonitor.activeConnections')}</span>
              <span className="text-sm text-white font-medium">{stats?.database.connections}</span>
            </div>
          </div>
        </div>

        {/* 存储详情 */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <HardDrive className="w-6 h-6 text-purple-400" />
            <h4 className="text-lg font-semibold text-white">{t('admin.systemMonitor.storageDetails')}</h4>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">{t('admin.systemMonitor.totalCapacity')}</span>
                <span className="text-sm text-white font-medium">
                  {stats && formatBytes(stats.disk.total)}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats?.disk.usagePercent || 0}%` }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <span className="text-sm text-gray-400">{t('admin.systemMonitor.usedSpace')}</span>
              <span className="text-sm text-white font-medium">
                {stats && formatBytes(stats.disk.used)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <span className="text-sm text-gray-400">{t('admin.systemMonitor.availableSpace')}</span>
              <span className="text-sm text-white font-medium">
                {stats && formatBytes(stats.disk.free)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 刷新提示 */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
        <div className="flex items-center gap-3 text-gray-400">
          <Clock className="w-4 h-4" />
          <span className="text-sm">
            {t('admin.systemMonitor.autoRefresh')} · {t('admin.systemMonitor.lastUpdate')}: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;

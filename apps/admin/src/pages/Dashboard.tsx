import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  FileText, 
  Users, 
  Eye, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Mail, 
  AlertCircle,
  ArrowUpRight,
  Plus,
  ArrowRight,
  Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Helper to get midnight today
const getMidnightISO = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

// Helper for ISO Weeks
const getISOWeek = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `W${weekNo}`;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // 1. KPI Stats Fetching
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [{ data: articles }, { data: writers }, { data: newsletter }] = await Promise.all([
        supabase.from('articles').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('newsletter').select('*')
      ]);

      const midnight = getMidnightISO();
      
      const safeArticles = articles || [];
      const totalPublished = safeArticles.filter(a => a.status === 'published' || a.status === 'Published').length;
      const publishedToday = safeArticles.filter(a => (a.status === 'published' || a.status === 'Published') && (a.published_at || a.publishedAt || '') >= midnight).length;
      const pendingReview = safeArticles.filter(a => a.status === 'pending' || a.status === 'Pending').length;
      
      const activeWriters = (writers || []).filter(d => (d.role === 'writer' || d.role === 'Writer') && (d.status === 'active' || d.status === 'Active' || !d.status)).length;
      const subscribers = (newsletter || []).filter(d => d.isActive === true || d.is_active === true || d.status === 'active').length;
      
      const totalViews = safeArticles.filter(a => a.status === 'published' || a.status === 'Published').reduce((acc, a) => acc + (a.views || 0), 0);
      const todayViews = safeArticles.filter(a => (a.status === 'published' || a.status === 'Published') && (a.published_at || a.publishedAt || '') >= midnight).reduce((acc, a) => acc + (a.views || 0), 0);

      return {
        totalPublished,
        publishedToday,
        pendingReview,
        activeWriters,
        subscribers,
        viewsToday: todayViews,
        totalViews
      };
    },
    refetchInterval: 60000,
    staleTime: 60000,
  });

  // 2. Line Chart Data (Views last 30 days)
  const { data: viewsData, isLoading: viewsLoading } = useQuery({
    queryKey: ['views-chart'],
    queryFn: async () => {
      const { data: articles } = await supabase.from('articles').select('*');
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const dailyViewsMap: Record<string, number> = {};
      
      (articles || []).forEach(data => {
        const publishedDate = data.published_at || data.publishedAt;
        if ((data.status === 'published' || data.status === 'Published') && publishedDate && publishedDate >= thirtyDaysAgo) {
          const date = new Date(publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dailyViewsMap[date] = (dailyViewsMap[date] || 0) + (data.views || 0);
        }
      });

      return Object.entries(dailyViewsMap).map(([date, views]) => ({ date, views }));
    },
    staleTime: 60000,
  });

  // 3. Bar Chart Data (Weekly Submissions)
  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: ['weekly-submissions'],
    queryFn: async () => {
      const { data: articlesData } = await supabase.from('articles').select('*');
      
      const articles = (articlesData || [])
        .filter(a => a.created_at || a.createdAt)
        .sort((a, b) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime())
        .slice(0, 100);

      const weeklyMap: Record<string, number> = {};
      articles.forEach(data => {
        const date = new Date(data.created_at || data.createdAt);
        const week = getISOWeek(date);
        weeklyMap[week] = (weeklyMap[week] || 0) + 1;
      });

      return Object.entries(weeklyMap).map(([week, count]) => ({ week, count })).reverse();
    },
    staleTime: 60000,
  });

  // 4. Activity Logs
  const { data: activityLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const { data: logs } = await supabase.from('activity_logs').select('*');
      return (logs || [])
        .filter(log => log.timestamp || log.created_at)
        .sort((a, b) => new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime())
        .slice(0, 15);
    },
    staleTime: 60000,
  });

  const getActionColor = (action: string) => {
    if (action.includes('APPROVED') || action.includes('PUBLISHED')) return 'text-emerald-600 bg-emerald-50';
    if (action.includes('REJECTED') || action.includes('SUSPENDED')) return 'text-rose-600 bg-rose-50';
    return 'text-sky-600 bg-sky-50';
  };

  const formatAction = (action: string) => {
    return action.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-kph-charcoal">System Overview</h2>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Real-time Intelligence & Performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9 px-4 font-bold uppercase text-[10px] tracking-widest" onClick={() => window.location.reload()}>
            Refresh Feed
          </Button>
          <Button size="sm" className="h-9 px-4 bg-kph-red hover:bg-neutral-800 font-bold uppercase text-[10px] tracking-widest" onClick={() => navigate('/admin/articles/new')}>
            <Plus className="mr-1 h-3 w-3" /> New Release
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total Articles', value: stats?.totalPublished, icon: FileText, color: 'text-kph-charcoal', bg: 'bg-neutral-50' },
          { label: 'Published Today', value: stats?.publishedToday, icon: Clock, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Pending Review', value: stats?.pendingReview, icon: AlertCircle, color: 'text-amber-600', badge: stats?.pendingReview && stats.pendingReview > 0, bg: 'bg-amber-50' },
          { label: 'Active Writers', value: stats?.activeWriters, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Newsletter', value: stats?.subscribers, icon: Mail, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Daily Views', value: stats?.viewsToday?.toLocaleString() || '0', icon: TrendingUp, color: 'text-kph-red', bg: 'bg-kph-red/5' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm ring-1 ring-neutral-200/50 overflow-hidden">
            <div className={`h-1 w-full ${stat.color === 'text-kph-red' ? 'bg-kph-red' : 'bg-neutral-100'}`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="font-serif text-2xl font-black text-kph-charcoal">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stat.value}
              </div>
              {stat.badge && (
                <Badge variant="outline" className="mt-2 bg-amber-50 text-amber-600 border-amber-200 text-[9px] font-black uppercase tracking-widest">Urgent</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Line Chart */}
        <Card className="col-span-4 border-none shadow-sm ring-1 ring-neutral-200/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-serif text-xl font-bold flex items-center gap-2">
                <div className="w-1 h-6 bg-kph-red rounded-full" />
                Audience Growth
              </CardTitle>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1 ml-3">Total Article Engagements (30 Days)</p>
            </div>
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-neutral-200 text-kph-charcoal bg-neutral-50 px-2 py-0.5">Live Data</Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px] w-full relative">
              {(!viewsData || viewsData.length === 0) && !viewsLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50/50 rounded-lg border border-dashed border-neutral-200">
                  <Activity className="h-8 w-8 text-neutral-300 mb-2" />
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">No Engagement Data Found</p>
                  <p className="text-[10px] text-neutral-400">Published articles will show growth metrics here.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={viewsData || []}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B0000" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8B0000" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} 
                    />
                    <Area type="monotone" dataKey="views" stroke="#8B0000" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Recent Activity */}
        <div className="col-span-3 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-neutral-200/50 bg-[#0a0a0a] text-white">
            <CardHeader>
              <CardTitle className="font-serif text-lg font-bold text-white/90">Command Center</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="ghost" 
                className="w-full justify-between hover:bg-white/5 h-12 text-white/80 group"
                onClick={() => navigate('/admin/articles?status=pending')}
              >
                <span className="flex items-center gap-3 font-bold text-xs uppercase tracking-wider">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-kph-red/20 text-kph-red">
                    <FileText className="h-4 w-4" />
                  </div>
                  Review Pipeline
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-between hover:bg-white/5 h-12 text-white/80 group"
                onClick={() => navigate('/admin/writers?status=pending')}
              >
                <span className="flex items-center gap-3 font-bold text-xs uppercase tracking-wider">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                    <Users className="h-4 w-4" />
                  </div>
                  Eminence Applications
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-between hover:bg-white/5 h-12 text-white/80 group"
                onClick={() => navigate('/admin/newsletter')}
              >
                <span className="flex items-center gap-3 font-bold text-xs uppercase tracking-wider">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  Newsletter Engine
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-neutral-200/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-serif text-lg font-bold">Recent Intelligence</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="custom-scrollbar max-h-[400px] overflow-y-auto pt-0">
              <div className="space-y-6">
                {logsLoading ? (
                  [1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)
                ) : activityLogs?.map((log: any) => (
                  <div key={log.id} className="flex gap-4 items-start group">
                    <div className="relative">
                      <Avatar className="h-8 w-8 border">
                        <AvatarFallback className="bg-neutral-100 text-[10px] font-bold">AX</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white flex items-center justify-center ${getActionColor(log.action)}`}>
                        <CheckCircle2 className="h-2 w-2" />
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-bold text-kph-charcoal truncate">
                          {log.userName || log.user_name || 'System Agent'}
                        </p>
                        <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                          {(log.timestamp || log.created_at) ? formatDistanceToNow(new Date(log.timestamp || log.created_at), { addSuffix: true }) : 'just now'}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                        <span className="font-bold text-kph-charcoal uppercase tracking-tighter mr-1">{formatAction(log.action)}</span> 
                        {log.targetTitle || log.target_title || 'Resources'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="link" className="w-full mt-6 text-[10px] uppercase font-black tracking-widest text-kph-red">
                View All Activity Logs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Second Row of Charts */}
      <Card className="border-none shadow-sm ring-1 ring-neutral-200/50">
        <CardHeader>
          <CardTitle className="font-serif text-xl font-bold flex items-center gap-2">
            <div className="w-1 h-6 bg-kph-red rounded-full" />
            Editorial Velocity
          </CardTitle>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1 ml-3">Weekly Submission Volume (Last 12 Weeks)</p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[200px] w-full relative">
            {(!weeklyData || weeklyData.length === 0) && !weeklyLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50/50 rounded-lg border border-dashed border-neutral-200">
                <TrendingUp className="h-6 w-6 text-neutral-300 mb-2" />
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Awaiting Content Cycle</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc6" />
                  <XAxis dataKey="week" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(235, 235, 240, 0.4)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} 
                  />
                  <Bar dataKey="count" fill="#8B0000" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

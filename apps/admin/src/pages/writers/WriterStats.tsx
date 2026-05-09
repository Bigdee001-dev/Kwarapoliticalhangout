import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  Mail, 
  TrendingUp, 
  FileText, 
  CheckCircle2, 
  Eye, 
  ThumbsUp,
  ArrowRight,
  CalendarDays
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageModal } from '../../components/writers/MessageModal';

const WriterStats: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [messageOpen, setMessageOpen] = useState(false);

  const { data: writer, isLoading: loadingWriter } = useQuery({
    queryKey: ['writer-profile', uid],
    queryFn: async () => {
      if (!uid) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: articles, isLoading: loadingArticles } = useQuery({
    queryKey: ['writer-articles', uid],
    queryFn: async () => {
      if (!uid) return [];
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .or(`author_id.eq.${uid},authorId.eq.${uid}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!uid
  });

  // Calculate Stats
  const stats = React.useMemo(() => {
    if (!articles) return null;
    
    const submitted = articles.length;
    const published = articles.filter((a: any) => a.status === 'published').length;
    const rejected = articles.filter((a: any) => a.status === 'rejected').length;
    const totalViews = articles.reduce((sum: number, a: any) => sum + (a.views || 0), 0);
    const totalLikes = articles.reduce((sum: number, a: any) => sum + (a.likes || 0), 0);
    const rejectionRate = submitted > 0 ? (rejected / submitted) * 100 : 0;

    // Chart Data (Last 6 months)
    const chartData = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const viewsInMonth = articles
        .filter((a: any) => {
          const pubAt = a.published_at || a.publishedAt;
          if (!pubAt) return false;
          const pubDate = new Date(pubAt);
          return isWithinInterval(pubDate, { start: monthStart, end: monthEnd });
        })
        .reduce((sum: number, a: any) => sum + (a.views || 0), 0);

      return {
        month: format(date, 'MMM'),
        views: viewsInMonth
      };
    });

    return {
      submitted,
      published,
      rejected,
      totalViews,
      totalLikes,
      rejectionRate,
      chartData
    };
  }, [articles]);

  if (loadingWriter) return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );

  if (!writer) return <div className="text-center py-20">Writer not found.</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-white shadow-xl ring-1 ring-neutral-200">
            <AvatarImage src={writer.avatar_url || writer.photo_url || writer.photoUrl || writer.photoURL} />
            <AvatarFallback className="bg-neutral-100 text-2xl font-bold font-serif">{(writer.display_name || writer.displayName)?.[0]}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl font-bold text-kph-charcoal">{writer.display_name || writer.displayName}</h1>
              <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest px-2 ${
                writer.role === 'editor' ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-neutral-50 text-neutral-600 border-neutral-100'
              }`}>
                {writer.role}
              </Badge>
              <Badge className={`text-[10px] font-black uppercase tracking-widest px-2 border-none ${
                writer.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {writer.status || 'active'}
              </Badge>
            </div>
            <p className="text-neutral-500 font-medium flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" /> {writer.email}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
              <CalendarDays className="h-3 w-3" /> Enrolled: {writer.created_at ? format(new Date(writer.created_at), 'MMMM dd, yyyy') : 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/writers')} className="border-neutral-200">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Registry
          </Button>
          <Button className="bg-kph-red hover:bg-neutral-800" onClick={() => setMessageOpen(true)}>
            <Mail className="mr-2 h-4 w-4" /> Message Contributor
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-none shadow-sm ring-1 ring-neutral-100 bg-white">
          <CardContent className="p-6">
            <FileText className="h-4 w-4 text-neutral-400 mb-2" />
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Submissions</p>
            <h3 className="font-serif text-3xl font-black mt-1">{stats?.submitted || 0}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-neutral-100 bg-white">
          <CardContent className="p-6">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mb-2" />
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Published</p>
            <h3 className="font-serif text-3xl font-black mt-1 text-emerald-600">{stats?.published || 0}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-neutral-100 bg-white">
          <CardContent className="p-6">
            <TrendingUp className="h-4 w-4 text-rose-500 mb-2" />
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Rejection Rate</p>
            <h3 className="font-serif text-3xl font-black mt-1 text-rose-600">{stats?.rejectionRate.toFixed(1)}%</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-neutral-100 bg-white">
          <CardContent className="p-6">
            <Eye className="h-4 w-4 text-sky-500 mb-2" />
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Total Views</p>
            <h3 className="font-serif text-3xl font-black mt-1 text-sky-600">{stats?.totalViews.toLocaleString() || 0}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-neutral-100 bg-white md:col-span-1 col-span-2">
          <CardContent className="p-6">
            <ThumbsUp className="h-4 w-4 text-amber-500 mb-2" />
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Reader Likes</p>
            <h3 className="font-serif text-3xl font-black mt-1 text-amber-600">{stats?.totalLikes.toLocaleString() || 0}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm ring-1 ring-neutral-100 bg-white overflow-hidden">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Reach Performance</CardTitle>
            <CardDescription className="text-xs uppercase tracking-tighter">Engagement trajectory over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chartData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A3C5E" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1A3C5E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 800, color: '#1A3C5E', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#1A3C5E" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Bio/Info */}
        <Card className="border-none shadow-sm ring-1 ring-neutral-100 bg-white overflow-hidden">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Editorial Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expertise</Label>
              <div className="flex flex-wrap gap-2">
                {(writer.specializations || [writer.specialization || 'Not Specified']).map((s: string) => (
                  <Badge key={s} variant="secondary" className="bg-zinc-100 text-zinc-700 text-[10px] font-bold py-1 px-3">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Professional Narrative</Label>
              <p className="text-sm leading-relaxed text-neutral-600 italic line-clamp-[8]">
                "{writer.bio || 'This contributor has not updated their biography yet.'}"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Articles Table */}
      <Card className="border-none shadow-sm ring-1 ring-neutral-100 bg-white overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-serif text-lg">Editorial Catalog</CardTitle>
            <CardDescription className="text-xs uppercase tracking-tighter">Chronological list of all contributions</CardDescription>
          </div>
          <Link 
            to={`/admin/articles?author=${uid}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-sky-600 hover:text-sky-700">
              Advanced Search <ArrowRight className="ml-1 h-3 w-3" />
            </span>
          </Link>
        </CardHeader>
        <Table>
          <TableHeader className="bg-zinc-50 border-b">
            <TableRow>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground pl-6">Title</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Status</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground text-center">Submission</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground text-center">Publication</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground text-right pr-6">Views</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingArticles ? (
              Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6"><Skeleton className="h-4 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 mx-auto" /></TableCell>
                  <TableCell className="pr-6"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : !articles || articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">No historical data available.</TableCell>
              </TableRow>
            ) : (
              articles.map((article: any) => (
                <TableRow key={article.id} className="hover:bg-zinc-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/admin/articles/${article.id}/edit`)}>
                  <TableCell className="pl-6 py-4">
                    <span className="font-bold text-kph-charcoal line-clamp-1">{article.title}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-none shadow-none ${
                        article.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                        article.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-zinc-100 text-zinc-700'
                    }`}>
                      {article.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-neutral-500 text-xs font-medium">
                    {article.created_at || article.createdAt ? format(new Date(article.created_at || article.createdAt), 'MM/dd/yy') : '-'}
                  </TableCell>
                  <TableCell className="text-center text-neutral-500 text-xs font-medium font-serif italic">
                    {article.published_at || article.publishedAt ? format(new Date(article.published_at || article.publishedAt), 'MM/dd/yy') : 'Unpublished'}
                  </TableCell>
                  <TableCell className="text-right pr-6 font-serif font-black text-zinc-600">
                    {article.views || 0}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <MessageModal 
        open={messageOpen}
        onOpenChange={setMessageOpen}
        writerId={uid!}
        writerName={writer.display_name || writer.displayName || 'Contributor'}
      />
    </div>
  );
};

// Internal Label component for standard style
const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <label className={`block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
    {children}
  </label>
);

export default WriterStats;

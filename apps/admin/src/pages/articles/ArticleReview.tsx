import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { 
  FileText, 
  Users, 
  Clock, 
  Calendar, 
  Tag, 
  Layout, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Edit3, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Zap,
  Star,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import DOMPurify from 'dompurify';

// --- Types ---
interface Article {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  category: string;
  tags: string[];
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'revision';
  createdAt: string;
  publishedAt?: string;
  scheduledAt?: string;
  wordCount: number;
  readTime: string;
  isFeatured: boolean;
  isBreaking: boolean;
  isTrending: boolean;
  rejectionNote?: string;
  revisionNote?: string;
}

interface QualityScore {
  total: number;
  grammar: number;
  length: number;
  readability: number;
  originality: number;
  summary: string;
}

const ArticleReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [note, setNote] = useState('');
  const [publishDate, setPublishDate] = useState('');

  // 1. Fetch Article Data
  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      if (!id) throw new Error('No article ID');
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Article;
    },
  });

  // 2. Fetch AI Quality Score (Placeholder for Supabase Edge Function)
  const { data: quality, isLoading: qualityLoading } = useQuery({
    queryKey: ['article-quality', id],
    queryFn: async () => {
      // Logic for Supabase Edge Function would go here
      // Returning placeholder for now
      return {
        total: 0,
        grammar: 0,
        length: 0,
        readability: 0,
        originality: 0,
        summary: 'Awaiting AI Audit...'
      } as QualityScore;
    },
    enabled: !!id && !!article,
    retry: false
  });

  // 3. Review Mutations
  const approveMutation = useMutation({
    mutationFn: async () => {
      // Placeholder for SEO generation via Supabase Edge Function
      
      const { error } = await supabase
        .from('articles')
        .update({
          status: 'published',
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Article published globally.');
      navigate('/admin/articles');
    },
    onError: (error: any) => {
      console.error('Publication error:', error);
      toast.error(`Publication failed: ${error.message || 'Internal Error'}`);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (rejectionNote: string) => {
      const { error } = await supabase
        .from('articles')
        .update({
          status: 'rejected',
          rejectionNote: rejectionNote,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      setRejectModalOpen(false);
      toast.info('Submission rejected.');
      navigate('/admin/articles');
    }
  });

  const revisionMutation = useMutation({
    mutationFn: async (revisionNote: string) => {
      const { error } = await supabase
        .from('articles')
        .update({
          status: 'revision',
          revisionNote: revisionNote,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      setRevisionModalOpen(false);
      toast.warning('Revision requested.');
      navigate('/admin/articles');
    }
  });

  const toggleFlag = async (field: string, value: boolean) => {
    const { error } = await supabase
      .from('articles')
      .update({ [field]: value })
      .eq('id', id);
    
    if (error) {
      toast.error(`Failed to update flag: ${error.message}`);
      return;
    }
    queryClient.setQueryData(['article', id], (old: any) => ({ ...old, [field]: value }));
    toast.success(`Flag Updated`);
  };

  const schedulePublish = async () => {
    if (!publishDate) return;
    const { error } = await supabase
      .from('articles')
      .update({
        scheduledAt: new Date(publishDate).toISOString()
      })
      .eq('id', id);
    
    if (error) {
      toast.error(`Failed to schedule publication: ${error.message}`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['article', id] });
    toast.success('Publication scheduled.');
  };

  if (articleLoading) {
    return (
      <div className="flex gap-8 p-8">
        <div className="w-[60%] space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-[400px] w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <div className="w-[40%] space-y-6">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="flex flex-col xl:flex-row gap-8 pb-32">
      {/* --- Left Panel: Preview --- */}
      <div className="w-full xl:w-[60%] bg-white rounded-xl border p-8 md:p-12 shadow-sm min-h-screen">
        <div className="max-w-3xl mx-auto space-y-8">
          <header className="space-y-6">
            <Badge className="bg-kph-red hover:bg-neutral-800 text-[10px] font-black tracking-widest uppercase rounded">
              {article.category}
            </Badge>
            <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight text-kph-charcoal">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-y py-4">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={article.authorAvatar || article.author_avatar} />
                <AvatarFallback>{(article.authorName || article.author_name || 'AN').substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-bold text-kph-charcoal">{article.authorName || article.author_name || 'Anonymous'}</span>
                <span className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider">
                  {format(new Date(article.createdAt || article.created_at), 'MMMM d, yyyy')}
                  <span className="h-1 w-1 rounded-full bg-zinc-300" />
                  {article.readTime || article.read_time}
                </span>
              </div>
            </div>
          </header>

          {(article.imageUrl || article.image_url) && (
            <figure className="aspect-video w-full overflow-hidden rounded-lg bg-zinc-100">
              <img 
                src={article.imageUrl || article.image_url} 
                alt="Featured" 
                className="h-full w-full object-cover"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => (e.currentTarget.style.display = 'none')}
              />
            </figure>
          )}

          <div 
             className="prose prose-zinc prose-lg max-w-none font-sans leading-relaxed text-zinc-700 selection:bg-kph-red/10"
             dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
          />

          <div className="flex flex-wrap gap-2 pt-8 border-t">
            {article.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* --- Right Panel: Controls --- */}
      <div className="w-full xl:w-[40%] space-y-6">
        <div className="sticky top-24 space-y-6">
          
          {/* AI Quality Score Section */}
          <Card className="overflow-hidden border-none shadow-sm ring-1 ring-neutral-200">
            <CardHeader className="bg-[#0a0a0a] text-white pb-6 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-kph-red fill-kph-red" />
                  <CardTitle className="font-serif text-lg">AI Editorial Audit</CardTitle>
                </div>
                <Badge variant="outline" className="border-white/20 text-white/60 text-[9px] uppercase tracking-widest font-black">Beta Engine v4.2</Badge>
              </div>
              
              <div className="flex flex-col items-center justify-center py-4">
                {qualityLoading ? (
                  <div className="flex flex-col items-center gap-4">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="h-20 w-20 border-4 border-white/10 border-t-kph-red rounded-full"
                    />
                    <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Analyzing Syntax & Originality...</p>
                  </div>
                ) : quality ? (
                  <div className="flex items-center gap-8 w-full px-4">
                    {/* Score Circle */}
                    <div className="relative h-28 w-28 flex items-center justify-center">
                      <svg className="h-full w-full -rotate-90">
                        <circle 
                          cx="56" cy="56" r="50" 
                          fill="transparent" 
                          stroke="currentColor" 
                          strokeWidth="8"
                          className="text-white/5"
                        />
                        <motion.circle 
                          cx="56" cy="56" r="50" 
                          fill="transparent" 
                          stroke="currentColor" 
                          strokeWidth="8"
                          strokeDasharray="314"
                          initial={{ strokeDashoffset: 314 }}
                          animate={{ strokeDashoffset: 314 - (314 * quality.total) / 100 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className={
                            quality.total > 70 ? 'text-emerald-500' : 
                            quality.total > 40 ? 'text-amber-500' : 
                            'text-rose-500'
                          }
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-serif font-black">{quality.total}</span>
                        <span className="text-[9px] uppercase tracking-tighter opacity-50 font-bold">Points</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                       {['Grammar', 'Length', 'Readability', 'Originality'].map((label, idx) => {
                         const val = [quality.grammar, quality.length, quality.readability, quality.originality][idx];
                         return (
                           <div key={label} className="w-full">
                             <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">
                               <span>{label}</span>
                               <span>{val}/25</span>
                             </div>
                             <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${(val/25)*100}%` }}
                                 className="h-full bg-white/40"
                               />
                             </div>
                           </div>
                         );
                       })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-white/40">Audit unavailable for this entry.</p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="bg-white p-6">
              <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-kph-red pl-4">
                {quality?.summary || "Editorial summary will appear after system analysis."}
              </p>
            </CardContent>
          </Card>

          {/* Metadata Panel */}
          <Card className="border-none shadow-sm ring-1 ring-neutral-200">
            <CardHeader className="pb-4">
              <CardTitle className="font-serif text-lg">Article Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={article.authorAvatar || article.author_avatar} />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-kph-charcoal">Author Profile</span>
                    <Link to={`/writers/${article.authorId || article.author_id}`} className="text-[11px] text-sky-600 font-medium hover:underline flex items-center gap-1">
                       {article.authorName || article.author_name || 'Anonymous'} <ExternalLink className="h-2 w-2" />
                    </Link>
                  </div>
                </div>
              </div>
              <Separator className="opacity-50" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Word Count</p>
                  <p className="text-xs font-bold text-kph-charcoal flex items-center gap-2">
                     <FileText className="h-3 w-3 text-kph-red" /> {article.wordCount || article.word_count || 0} words
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Read Time</p>
                  <p className="text-xs font-bold text-kph-charcoal flex items-center gap-2">
                     <Clock className="h-3 w-3 text-kph-red" /> {article.readTime || article.read_time || '0 min read'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flags Panel */}
          <Card className="border-none shadow-sm ring-1 ring-neutral-200 bg-zinc-50/50">
            <CardHeader className="pb-4">
              <CardTitle className="font-serif text-lg">Publication Flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Star className={`h-4 w-4 ${article.isFeatured ? 'text-amber-500 fill-amber-500' : 'text-zinc-400'}`} />
                   <Label className="text-xs font-bold uppercase tracking-wider cursor-pointer" htmlFor="featured">Featured Asset</Label>
                </div>
                <Switch 
                  id="featured" 
                  checked={article.isFeatured} 
                  onCheckedChange={(v: boolean) => toggleFlag('isFeatured', v)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Zap className={`h-4 w-4 ${article.isBreaking ? 'text-kph-red fill-kph-red' : 'text-zinc-400'}`} />
                   <Label className="text-xs font-bold uppercase tracking-wider cursor-pointer" htmlFor="breaking">Breaking News</Label>
                </div>
                <Switch 
                  id="breaking" 
                  checked={article.isBreaking} 
                  onCheckedChange={(v: boolean) => toggleFlag('isBreaking', v)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <TrendingUp className={`h-4 w-4 ${article.isTrending ? 'text-sky-500' : 'text-zinc-400'}`} />
                   <Label className="text-xs font-bold uppercase tracking-wider cursor-pointer" htmlFor="trending">Trending Alert</Label>
                </div>
                <Switch 
                  id="trending" 
                  checked={article.isTrending} 
                  onCheckedChange={(v: boolean) => toggleFlag('isTrending', v)} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule Section */}
          {article.status !== 'published' && (
            <Card className="border-none shadow-sm ring-1 ring-neutral-200">
               <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-serif text-lg">Publication Queue</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
               </CardHeader>
                <CardContent className="space-y-4">
                  {article.scheduledAt ? (
                    <div className="p-3 bg-sky-50 border border-sky-100 rounded-lg">
                       <p className="text-[10px] font-bold text-sky-800 uppercase tracking-widest mb-1">Scheduled For</p>
                       <p className="text-xs font-bold text-sky-900">{format(new Date(article.scheduledAt), 'PPP p')}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="space-y-1">
                         <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Select Release Time</Label>
                         <input 
                           type="datetime-local" 
                           className="w-full bg-zinc-50 border rounded-lg px-3 py-2 text-xs font-bold text-kph-charcoal"
                           value={publishDate}
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPublishDate(e.target.value)}
                         />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full font-bold uppercase text-[10px] tracking-widest border-sky-200 text-sky-600 hover:bg-sky-50"
                        onClick={schedulePublish}
                        disabled={!publishDate}
                      >
                        Queue for Publication
                      </Button>
                    </div>
                  )}
                </CardContent>
            </Card>
          )}

        </div>
      </div>

      {/* --- Floating Bottom Actions --- */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t p-4 flex justify-center">
        <div className="max-w-screen-xl w-full flex items-center justify-between px-8">
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reviewing</span>
              <span className="text-xs font-bold text-kph-charcoal truncate max-w-[200px]">{article.title}</span>
           </div>
           
           <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="font-bold uppercase text-[10px] tracking-widest h-10 px-6 border-zinc-200 text-sky-600 hover:bg-sky-50"
                onClick={() => navigate(`/admin/articles/${id}/edit`)}
              >
                <Edit3 className="mr-2 h-4 w-4" /> Edit & Publish
              </Button>
              <Button 
                variant="outline" 
                className="font-bold uppercase text-[10px] tracking-widest h-10 px-6 border-amber-200 text-amber-600 hover:bg-amber-50"
                onClick={() => setRevisionModalOpen(true)}
              >
                <MessageSquare className="mr-2 h-4 w-4" /> Request Revision
              </Button>
              <Button 
                variant="outline" 
                className="font-bold uppercase text-[10px] tracking-widest h-10 px-6 border-rose-200 text-rose-600 hover:bg-rose-50"
                onClick={() => setRejectModalOpen(true)}
              >
                <XCircle className="mr-2 h-4 w-4" /> Final Rejection
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 font-bold uppercase text-[10px] tracking-widest h-10 px-8 disabled:opacity-50"
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? (
                   <span className="flex items-center gap-2">
                     <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                     Baking SEO...
                   </span>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" /> Approve & Publish
                  </>
                )}
              </Button>
           </div>
        </div>
      </div>

      {/* --- Modals --- */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Archive Submission</DialogTitle>
            <DialogDescription>Please provide a reason for the total rejection of this article.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Editorial Note</Label>
            <Textarea 
              placeholder="Content does not meet KPH journalistic standards..." 
              value={note}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
              className="resize-none h-32"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              className="font-bold uppercase text-[10px] tracking-widest"
              onClick={() => rejectMutation.mutate(note)}
              disabled={!note || rejectMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={revisionModalOpen} onOpenChange={setRevisionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Request Corrections</DialogTitle>
            <DialogDescription>This article will be sent back to the writer's studio with these instructions.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Revision Required</Label>
            <Textarea 
              placeholder="Please provide more evidence for the claims in the third paragraph..." 
              value={note}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
              className="resize-none h-32"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRevisionModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-amber-600 hover:bg-amber-700 font-bold uppercase text-[10px] tracking-widest"
              onClick={() => revisionMutation.mutate(note)}
              disabled={!note || revisionMutation.isPending}
            >
              Send to Writer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ArticleReview;

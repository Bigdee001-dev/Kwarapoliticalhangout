import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  Video
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const Articles: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const statusFilter = searchParams.get('status') || 'all';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const setStatusFilter = (status: string) => {
    if (status === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    setSearchParams(searchParams);
  };

  const { data: articles, isLoading } = useQuery({
    queryKey: ['admin-articles', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('articles')
        .select('*');
      
      // Order by created_at or createdAt
      // We'll try to order by created_at first
      query = query.order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      if (error) {
        // Fallback for createdAt if created_at fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('articles')
          .select('*')
          .order('createdAt', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        return fallbackData || [];
      }
      return data || [];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const now = new Date().toISOString();
      const updateData: any = {
        status,
        updatedAt: now,
      };
      if (status === 'published') {
        updateData.publishedAt = now;
      }

      const { error } = await supabase
        .from('articles')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      toast.success('Article status updated');
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Published</Badge>;
      case 'draft': return <Badge variant="secondary" className="bg-zinc-100 text-zinc-600">Draft</Badge>;
      case 'pending': return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'revision': return <Badge variant="outline" className="border-sky-200 text-sky-600 bg-sky-50">Revision</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredArticles = articles?.filter((a: any) => 
    (a.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (a.authorName || a.author_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-kph-charcoal">Article Ledger</h1>
          <p className="text-sm text-muted-foreground">Manage editorial flow and publication status.</p>
        </div>
        <Button className="bg-kph-red hover:bg-neutral-800" onClick={() => navigate('/admin/articles/new')}>
          Create New Article
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by title or author..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select 
            className="text-sm border-none bg-transparent font-bold focus:ring-0 cursor-pointer"
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
            <option value="revision">Revision</option>
          </select>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50">
            <TableRow>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground pl-6">Article Title</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Author</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Status</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Created</TableHead>
              <TableHead className="text-right pr-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map(i => (
                <TableRow key={i}>
                  <TableCell className="pl-6"><Skeleton className="h-4 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredArticles?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                  No articles found matching your criteria.
                </TableCell>
              </TableRow>
            ) : filteredArticles?.map((article: any) => (
              <TableRow key={article.id} className="hover:bg-zinc-50/50 transition-colors">
                <TableCell className="font-semibold text-kph-charcoal max-w-sm truncate pl-6">
                  <div className="flex items-center gap-2">
                    {article.title}
                    {(article.video_url || article.videoUrl) && (
                      <Video size={14} className="text-kph-red shrink-0" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-zinc-500 text-sm">
                  {article.authorName || article.author_name || 'Anonymous'}
                </TableCell>
                <TableCell>
                  {getStatusBadge(article.status)}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs font-mono">
                  {(article.created_at || article.createdAt) ? format(new Date(article.created_at || article.createdAt), 'dd MMM yyyy') : '--'}
                </TableCell>
                <TableCell className="text-right pr-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-zinc-100 transition-colors outline-none">
                          <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigate(`/admin/articles/${article.id}`)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/admin/articles/${article.id}/edit`)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Content
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        {article.status !== 'published' && (
                          <DropdownMenuItem 
                            className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
                            onClick={() => updateStatusMutation.mutate({ id: article.id, status: 'published' })}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Approve & Publish
                          </DropdownMenuItem>
                        )}
                        {article.status === 'pending' && (
                          <DropdownMenuItem 
                            className="text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                            onClick={() => updateStatusMutation.mutate({ id: article.id, status: 'rejected' })}
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Reject Submission
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Articles;

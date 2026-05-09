import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const Tips: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: tips, isLoading } = useQuery({
    queryKey: ['tips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tips')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from('tips')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tips'] });
      toast.success('Status updated');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!window.confirm('Delete this intelligence lead?')) return;
      const { error } = await supabase.from('tips').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tips'] });
      toast.success('Lead removed');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 border-none">New Entry</Badge>;
      case 'investigating': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">In Review</Badge>;
      case 'verified': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Verified</Badge>;
      case 'dismissed': return <Badge variant="outline" className="text-neutral-400">Dismissed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-serif text-3xl font-bold text-kph-charcoal">Intelligence & Leads</h1>
        <p className="text-sm text-muted-foreground uppercase tracking-widest font-black">Later Management / Crowdsourced Reports</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-none shadow-sm ring-1 ring-neutral-200">
          <CardHeader className="pb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Leads</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-black">{isLoading ? '...' : tips?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-neutral-200">
          <CardHeader className="pb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unprocessed</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-black text-sky-600">
              {isLoading ? '...' : tips?.filter((t: any) => t.status === 'new').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-neutral-200">
          <CardHeader className="pb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Verified & Ready</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-black text-emerald-600">
               {isLoading ? '...' : tips?.filter((t: any) => t.status === 'verified').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-neutral-200 bg-kph-red text-white">
          <CardHeader className="pb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Urgency Protocol</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-black">Level 0</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden ring-1 ring-neutral-200/50">
        <Table>
          <TableHeader className="bg-neutral-50/50">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="font-bold uppercase text-[10px] tracking-widest h-12">Timestamp</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest h-12">Intelligence Topic</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest h-12">Source Detail</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest h-12 text-center">Status</TableHead>
              <TableHead className="text-right h-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map(i => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : tips?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                   <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                      <MessageSquare className="h-10 w-10" />
                      <p className="font-serif text-lg font-bold">The Intelligence Pipeline is Silent</p>
                      <p className="text-[10px] font-black uppercase tracking-widest">Leads from the public portal will appear here.</p>
                   </div>
                </TableCell>
              </TableRow>
            ) : tips?.map((tip: any) => (
              <TableRow key={tip.id} className="group hover:bg-neutral-50/50 transition-colors">
                <TableCell className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">
                   {(tip.created_at || tip.createdAt) 
                     ? formatDistanceToNow(new Date(tip.created_at || tip.createdAt), { addSuffix: true }) 
                     : 'Just now'}
                </TableCell>
                <TableCell className="font-serif font-bold text-kph-charcoal">
                  {tip.topic || 'Untitled Intel'}
                </TableCell>
                <TableCell>
                  <div className="max-w-[400px]">
                    <p className="text-xs text-muted-foreground line-clamp-2">{tip.content}</p>
                    {(tip.sourceEmail || tip.source_email) && (
                       <span className="text-[9px] font-black text-sky-600 uppercase mt-1 block">{tip.sourceEmail || tip.source_email}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center italic">
                   {getStatusBadge(tip.status || 'new')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                      onClick={() => updateStatusMutation.mutate({ id: tip.id, status: 'investigating' })}
                      title="Investigate"
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      onClick={() => updateStatusMutation.mutate({ id: tip.id, status: 'verified' })}
                      title="Verify"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => deleteMutation.mutate(tip.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Tips;

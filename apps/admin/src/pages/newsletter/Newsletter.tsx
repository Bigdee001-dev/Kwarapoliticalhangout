import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { 
  Mail, 
  Users, 
  Send, 
  Plus, 
  Trash2, 
  Search,
  ExternalLink,
  TrendingUp,
  MailOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Newsletter() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch Subscribers
  const { data: subscribers, isLoading: isSubsLoading } = useQuery({
    queryKey: ['newsletter-subscribers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('newsletter')
        .select('*')
        .order('subscribed_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch Sent Newsletters (Campaigns)
  const { data: campaigns, isLoading: isCampaignsLoading } = useQuery({
    queryKey: ['newsletters-sent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    }
  });

  const deleteSubscriberMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!window.confirm('Are you sure you want to remove this subscriber?')) return;
      const { error } = await supabase.from('newsletter').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      toast.success('Subscriber removed');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const filteredSubscribers = subscribers?.filter((sub: any) => 
    sub.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSubscriberStatus = (sub: any) => {
    if (sub.status === 'active' || sub.isActive || sub.is_active) {
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-black text-[9px] uppercase tracking-widest">Active</Badge>;
    }
    return <Badge variant="outline" className="text-neutral-400 bg-neutral-50 border-neutral-200 font-black text-[9px] uppercase tracking-widest">Inactive</Badge>;
  };

  const totalDispatched = campaigns?.reduce((acc: number, c: any) => acc + (c.recipient_count || c.recipientCount || 0), 0) || 0;
  const activeCount = subscribers?.filter((s: any) => s.status === 'active').length || 0;
  const inactiveCount = (subscribers?.length || 0) - activeCount;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-kph-charcoal">Newsletter Engine</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-black flex items-center gap-2">
            <Mail className="h-3 w-3" /> Distribution & Audience Growth
          </p>
        </div>
        <Button 
          onClick={() => navigate('compose')}
          className="bg-kph-red hover:bg-neutral-800 text-white font-bold gap-2 shadow-lg shadow-kph-red/10 h-11"
        >
          <Plus className="h-4 w-4" /> Compose Weekly Digest
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm ring-1 ring-neutral-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Audience</CardTitle>
            <Users className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-black">{isSubsLoading ? '...' : subscribers?.length || 0}</div>
            <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-tight flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> {activeCount} Active Contacts
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-neutral-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Inactive Leads</CardTitle>
            <MailOpen className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-black text-emerald-600">{inactiveCount}</div>
            <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tight">Unsubscribed or Paused</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-neutral-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Dispatched</CardTitle>
            <Send className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-black">{isCampaignsLoading ? '...' : totalDispatched.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tight italic">Aggregate Historical Reach</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscribers" className="w-full">
        <TabsList className="bg-neutral-200/60 p-1 rounded-xl h-11">
          <TabsTrigger value="subscribers" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-[0.15em] px-6 h-9 transition-all">
            Audience List
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-[0.15em] px-6 h-9 transition-all">
            Intelligence Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscribers" className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by email..." 
                className="pl-9 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Badge variant="outline" className="font-black uppercase tracking-widest text-[10px] py-1 border-neutral-300">
              Active Subscribers
            </Badge>
          </div>

          <div className="rounded-xl border bg-white shadow-sm overflow-hidden ring-1 ring-neutral-200/50">
            <Table>
              <TableHeader className="bg-neutral-50/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest h-12">Subscriber Email</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest h-12">Subscription Date</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest h-12 text-center">Engagement</TableHead>
                  <TableHead className="text-right h-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isSubsLoading ? (
                  [1, 2, 3].map(i => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredSubscribers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      No subscribers found matching your search.
                    </TableCell>
                  </TableRow>
                ) : filteredSubscribers?.map((sub: any) => (
                  <TableRow key={sub.id} className="group hover:bg-neutral-50/50 transition-colors">
                    <TableCell className="font-bold text-kph-charcoal">
                      {sub.email}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(sub.subscribed_at || sub.subscribedAt) 
                        ? format(new Date(sub.subscribed_at || sub.subscribedAt), 'PPP p') 
                        : 'Pending...'}
                    </TableCell>
                    <TableCell className="text-center italic">
                      {getSubscriberStatus(sub)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => deleteSubscriberMutation.mutate(sub.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden ring-1 ring-neutral-200/50">
            <Table>
              <TableHeader className="bg-neutral-50/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest h-12">Digest Title</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest h-12">Sent At</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest h-12 text-center">Recipients</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest h-12 text-center">Status</TableHead>
                  <TableHead className="text-right h-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isCampaignsLoading ? (
                  [1, 2].map(i => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : campaigns?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                        <Send className="h-10 w-10" />
                        <p className="font-serif text-lg font-bold">No Records in Post-Office</p>
                        <p className="text-[10px] font-black uppercase tracking-widest">Sent newsletters will be archived here.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : campaigns?.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-serif font-bold">{c.subject}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(c.sent_at || c.sentAt) ? format(new Date(c.sent_at || c.sentAt), 'PPP p') : '--'}
                    </TableCell>
                    <TableCell className="text-center font-bold">{c.recipient_count || c.recipientCount}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold">Delivered</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="font-bold text-[10px] uppercase tracking-wider gap-1">
                        View <ExternalLink className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

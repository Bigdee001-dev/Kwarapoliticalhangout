import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  MoreHorizontal, 
  Search, 
  CheckCircle2, 
  XCircle, 
  UserMinus, 
  ShieldAlert, 
  TrendingUp, 
  Mail,
  Loader2,
  Clock,
  Ban,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageModal } from '../../components/writers/MessageModal';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

import { useAuthStore } from '../../store/authStore';

const Writers: React.FC = () => {
  const { userRole: currentUserRole } = useAuthStore();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Modals state
  const [messageModal, setMessageModal] = useState<{ open: boolean; writerId: string; writerName: string }>({
    open: false,
    writerId: '',
    writerName: ''
  });
  const [rejectModal, setRejectModal] = useState<{ open: boolean; applicantId: string; applicantName: string }>({
    open: false,
    applicantId: '',
    applicantName: ''
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Queries
  const { data: writers, isLoading: loadingWriters } = useQuery({
    queryKey: ['admin-writers', statusFilter, roleFilter],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .in('role', ['writer', 'editor'])
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: pendingApplicants, isLoading: loadingPending } = useQuery({
    queryKey: ['pending-writers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: activeTab === 'pending'
  });

  // Mutations
  const approveWriterMutation = useMutation({
    mutationFn: async (uid: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'active', role: 'writer', updated_at: new Date().toISOString() })
        .eq('id', uid);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Writer approved!');
      queryClient.invalidateQueries({ queryKey: ['admin-writers'] });
      queryClient.invalidateQueries({ queryKey: ['pending-writers'] });
    },
    onError: (err: any) => {
      toast.error('Approval failed: ' + err.message);
    }
  });

  const handleReject = async () => {
    if (!rejectionReason || rejectionReason.length < 10) {
      toast.error('Please provide a constructive reason (min 10 chars).');
      return;
    }

    setRejecting(true);
    try {
      // In Supabase, we can update status to 'rejected' or delete
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'rejected', 
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString() 
        })
        .eq('id', rejectModal.applicantId);

      if (error) throw error;

      toast.success('Application rejected.');
      queryClient.invalidateQueries({ queryKey: ['pending-writers'] });
      setRejectModal({ open: false, applicantId: '', applicantName: '' });
      setRejectionReason('');
    } catch (error: any) {
      toast.error('Rejection failed: ' + error.message);
    } finally {
      setRejecting(false);
    }
  };

  const handleAction = async (uid: string, action: string) => {
    try {
      let update: any = { updated_at: new Date().toISOString() };
      
      switch(action) {
        case 'promoteToEditor': update.role = 'editor'; break;
        case 'promoteToAdmin': update.role = 'admin'; break;
        case 'demoteToWriter': update.role = 'writer'; break;
        case 'suspendWriter': update.status = 'suspended'; break;
        case 'banWriter': update.status = 'banned'; break;
        case 'activateWriter': update.status = 'active'; break;
        default: throw new Error('Invalid action');
      }

      const { error } = await supabase
        .from('profiles')
        .update(update)
        .eq('id', uid);
      
      if (error) throw error;
      
      toast.success('Action completed successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-writers'] });
    } catch (error: any) {
      toast.error('Action failed: ' + (error.message || 'Unknown error'));
    }
  };

  const filteredWriters = writers?.filter((w: any) => 
    (w.display_name || w.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-bold text-kph-charcoal">Editorial Registry</h1>
        <p className="text-sm text-neutral-500">Orchestrate the roster of writers and editors shaping the hangout.</p>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-zinc-100 p-1 border h-11">
            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold uppercase text-[10px] tracking-widest h-9">
              All Writers
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold uppercase text-[10px] tracking-widest h-9 relative">
              Pending Approval
              {pendingApplicants && pendingApplicants.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-kph-red text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white">
                  {pendingApplicants.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {activeTab === 'all' && (
            <div className="flex items-center gap-3">
               <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or email..." 
                  className="pl-10 w-64 h-11 border-neutral-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32 h-11">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="writer">Writer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-11">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <TabsContent value="all" className="mt-6 border rounded-xl bg-white shadow-sm overflow-hidden border-neutral-200">
          <Table>
            <TableHeader className="bg-zinc-50 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground py-4">Writer</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Identity</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Role</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Status</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground text-center">Output</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground text-right pr-6">Tenure</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingWriters ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                    <TableCell><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-40" /></div></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-8 mx-auto" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : filteredWriters?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">No editorial members found.</TableCell>
                </TableRow>
              ) : (
                filteredWriters?.map((writer: any) => (
                  <TableRow key={writer.id || writer.uid} className="hover:bg-zinc-50/50 transition-colors">
                    <TableCell>
                      <Avatar className="h-10 w-10 border border-neutral-100 ring-4 ring-neutral-50">
                        <AvatarImage src={writer.avatar_url || writer.photo_url || writer.photoUrl || writer.photoURL} />
                        <AvatarFallback className="bg-neutral-100 text-[10px] font-bold">
                          {(writer.display_name || writer.displayName || 'U N').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-kph-charcoal">{writer.display_name || writer.displayName || 'Unknown Name'}</span>
                        <span className="text-xs text-muted-foreground font-medium">{writer.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 ${
                        writer.role === 'editor' ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-neutral-50 text-neutral-600 border-neutral-100'
                      }`}>
                        {writer.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-none shadow-none ${
                        writer.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        writer.status === 'suspended' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {writer.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-serif font-black text-lg text-kph-red">
                      {writer.articles_published || writer.articlesPublished || 0}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <span className="text-xs font-bold text-neutral-500">
                        {writer.created_at ? format(new Date(writer.created_at), 'MMM d, yyyy') : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
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
                            <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground">Oversight</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/admin/writers/${writer.id || writer.uid}`)}>
                              <TrendingUp className="mr-2 h-3.5 w-3.5" /> Intel & Stats
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setMessageModal({ open: true, writerId: writer.id || writer.uid, writerName: writer.display_name || writer.displayName })}>
                              <Mail className="mr-2 h-3.5 w-3.5" /> Dispatch Message
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            {writer.role === 'writer' && (
                              <DropdownMenuItem onClick={() => handleAction(writer.id || writer.uid, 'promoteToEditor')}>
                                <ShieldCheck className="mr-2 h-3.5 w-3.5 text-sky-600" /> Promote to Editor
                              </DropdownMenuItem>
                            )}
                            {currentUserRole === 'admin' && writer.role === 'editor' && (
                              <DropdownMenuItem onClick={() => handleAction(writer.id || writer.uid, 'promoteToAdmin')}>
                                <ShieldAlert className="mr-2 h-3.5 w-3.5 text-rose-600" /> Promote to Admin
                              </DropdownMenuItem>
                            )}
                            {currentUserRole === 'admin' && writer.role !== 'writer' && (
                              <DropdownMenuItem onClick={() => handleAction(writer.id || writer.uid, 'demoteToWriter')}>
                                <UserMinus className="mr-2 h-3.5 w-3.5 text-neutral-600" /> Demote to Writer
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            {writer.status !== 'suspended' && (
                              <DropdownMenuItem 
                                className="text-amber-600 focus:text-amber-700 focus:bg-amber-50"
                                onClick={() => { if(window.confirm(`Suspend ${writer.display_name || writer.displayName}?`)) handleAction(writer.id || writer.uid, 'suspendWriter'); }}
                              >
                                <Clock className="mr-2 h-3.5 w-3.5" /> Suspend
                              </DropdownMenuItem>
                            )}
                            {writer.status !== 'banned' && (
                              <DropdownMenuItem 
                                className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 font-bold"
                                onClick={() => { if(window.confirm(`Permanently ban ${writer.display_name || writer.displayName}?`)) handleAction(writer.id || writer.uid, 'banWriter'); }}
                              >
                                <Ban className="mr-2 h-3.5 w-3.5" /> Ban Forever
                              </DropdownMenuItem>
                            )}
                            {writer.status !== 'active' && (
                              <DropdownMenuItem 
                                className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
                                onClick={() => handleAction(writer.id || writer.uid, 'activateWriter')}
                              >
                                <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Activate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {loadingPending ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <Skeleton key={i} className="h-[280px] w-full rounded-xl" />
              ))}
            </div>
          ) : !pendingApplicants || pendingApplicants.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center bg-zinc-50 border-2 border-dashed rounded-xl border-neutral-200">
               <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6" />
               </div>
               <p className="font-serif text-lg font-bold text-kph-charcoal">Registry Clear</p>
               <p className="text-xs text-muted-foreground mt-1">No pending applications for the Council.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingApplicants.map((app: any) => (
                <div key={app.id} className="group bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                  <div className="p-6 flex-1 space-y-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 border-2 border-neutral-100 ring-4 ring-neutral-50 shadow-sm">
                        <AvatarImage src={app.avatar_url || app.photo_url || app.photoUrl} />
                        <AvatarFallback className="bg-neutral-100 text-xs font-bold font-serif">{(app.display_name || app.displayName)?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h3 className="font-bold text-kph-charcoal leading-tight">{app.display_name || app.displayName}</h3>
                        <p className="text-xs text-muted-foreground font-medium">{app.email}</p>
                        <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 text-[9px] font-black uppercase tracking-widest mt-1">
                          {app.specialization || 'Generalist'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="bg-zinc-50 p-3 rounded-lg border border-neutral-100">
                      <p className="text-[11px] text-neutral-600 leading-relaxed line-clamp-3 italic">
                        "{app.bio || 'No bio provided.'}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                      <Clock className="h-3 w-3" />
                      Applied: {app.created_at ? format(new Date(app.created_at), 'MMM d, yyyy') : 'Recently'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 border-t mt-auto">
                    <Button 
                      variant="ghost" 
                      className="rounded-none h-12 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-black uppercase text-[10px] tracking-widest border-r"
                      onClick={() => approveWriterMutation.mutate(app.id)}
                      disabled={approveWriterMutation.isPending}
                    >
                      {approveWriterMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Approve</>}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="rounded-none h-12 text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-black uppercase text-[10px] tracking-widest"
                      onClick={() => setRejectModal({ open: true, applicantId: app.id, applicantName: app.display_name || app.displayName })}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Modal */}
      <Dialog open={rejectModal.open} onOpenChange={(val) => setRejectModal(prev => ({ ...prev, open: val }))}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Decline Application</DialogTitle>
            <DialogDescription>
              Provide feedback for <span className="font-bold text-kph-charcoal">{rejectModal.applicantName}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Reason for Rejection</Label>
            <Textarea 
              id="reason" 
              placeholder="e.g. Portfolio does not meet current editorial standards..." 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectModal(prev => ({ ...prev, open: false }))}>Cancel</Button>
            <Button 
              variant="destructive" 
              className="bg-rose-600 hover:bg-rose-700 font-bold uppercase text-[10px] tracking-widest"
              onClick={handleReject}
              disabled={rejecting || !rejectionReason}
            >
              {rejecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserMinus className="h-4 w-4 mr-2" />}
              Reject Applicant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MessageModal 
        open={messageModal.open}
        onOpenChange={(val) => setMessageModal(prev => ({ ...prev, open: val }))}
        writerId={messageModal.writerId}
        writerName={messageModal.writerName}
      />
    </div>
  );
};

export default Writers;

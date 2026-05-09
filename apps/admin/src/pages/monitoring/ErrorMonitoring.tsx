import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Terminal, 
  ShieldAlert,
  Bug
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const ErrorMonitoring: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['error-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000
  });

  const resolveMutation = useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from('error_logs')
        .update({ 
          is_resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', logId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
      toast.success('Error marked as resolved');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const resolveAllMutation = async () => {
    if (!logs) return;
    const unresolved = logs.filter((l: any) => !l.is_resolved);
    if (unresolved.length === 0) return;
    
    const promise = supabase
      .from('error_logs')
      .update({ is_resolved: true, resolved_at: new Date().toISOString() })
      .in('id', unresolved.map((l: any) => l.id));

    toast.promise(promise, {
      loading: 'Resolving all issues...',
      success: 'All clear! Interface stabilized.',
      error: 'Batch resolution failed.'
    });

    await promise;
    queryClient.invalidateQueries({ queryKey: ['error-logs'] });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-rose-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      default: return 'bg-zinc-500 text-white';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-3">
            <Bug className="h-8 w-8 text-rose-600" />
            System Vitality
          </h1>
          <p className="text-sm text-muted-foreground">Real-time error tracking across Portal, Writer, and Admin apps.</p>
        </div>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="font-bold uppercase text-[10px] tracking-widest border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            onClick={resolveAllMutation}
            disabled={!logs?.some((l: any) => !l.is_resolved)}
          >
            Resolve All
          </Button>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Unresolved</p>
            <p className="text-xl font-serif font-black text-rose-600">
              {logs?.filter((l: any) => !l.is_resolved).length || 0}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</p>
            <p className="text-xl font-serif font-black text-emerald-600">Healthy</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : logs?.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <ShieldAlert className="h-12 w-12 text-emerald-500 mb-4" />
            <CardTitle>All Clear</CardTitle>
            <CardDescription>No errors logged in the system. Great job!</CardDescription>
          </Card>
        ) : (
          logs?.map((log: any) => (
            <Card key={log.id} className={`overflow-hidden border-l-4 ${log.is_resolved ? 'border-l-emerald-500 opacity-60' : log.severity === 'critical' ? 'border-l-rose-500' : 'border-l-zinc-200'} shadow-sm`}>
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getSeverityColor(log.severity || 'low')}>{(log.severity || 'low').toUpperCase()}</Badge>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">App: {log.app}</span>
                      <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {(log.created_at || log.timestamp) 
                          ? formatDistanceToNow(new Date(log.created_at || log.timestamp), { addSuffix: true }) 
                          : 'just now'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-kph-charcoal mb-1">{log.type}</h3>
                    <p className="text-sm text-zinc-600 font-medium mb-4">{log.message}</p>
                    
                    {log.stack && (
                      <div className="rounded bg-zinc-900 p-4 font-mono text-[10px] text-zinc-400 overflow-x-auto">
                        <div className="flex items-center gap-2 mb-2 text-zinc-500 uppercase font-black tracking-widest">
                          <Terminal className="h-3 w-3" /> Stack Trace
                        </div>
                        <pre className="whitespace-pre-wrap">{log.stack.slice(0, 500)}...</pre>
                      </div>
                    )}
                  </div>
                  <div className="p-6 bg-zinc-50 md:w-64 border-t md:border-t-0 md:border-l flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Context</h4>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-[9px] text-muted-foreground uppercase">User ID</dt>
                          <dd className="text-[10px] font-mono truncate">{log.user_id || 'Guest'}</dd>
                        </div>
                        {log.context && typeof log.context === 'object' && Object.entries(log.context).map(([k, v]) => (
                          <div key={k}>
                            <dt className="text-[9px] text-muted-foreground uppercase">{k}</dt>
                            <dd className="text-[10px] font-mono truncate">{String(v)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    
                    {!log.is_resolved ? (
                      <Button 
                        size="sm" 
                        className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[10px] tracking-widest"
                        onClick={() => resolveMutation.mutate(log.id)}
                        disabled={resolveMutation.isPending}
                      >
                        <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Mark Resolved
                      </Button>
                    ) : (
                      <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                        <CheckCircle2 className="h-4 w-4" /> Resolved
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ErrorMonitoring;

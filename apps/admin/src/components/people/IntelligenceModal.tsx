import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { BrainCircuit, Loader2 } from 'lucide-react';

interface IntelligenceModalProps {
  person: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const IntelligenceModal: React.FC<IntelligenceModalProps> = ({ 
  person, 
  open, 
  onOpenChange 
}) => {
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const addIntelMutation = useMutation({
    mutationFn: async () => {
      if (!person) return;
      
      const newIntelItem = {
        id: crypto.randomUUID(),
        topic: topic || 'General Intel',
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'Admin Override'
      };

      // Fetch current intelligence array
      const { data: currentPerson, error: fetchError } = await supabase
        .from('people')
        .select('intelligence, intel')
        .eq('id', person.id)
        .single();
      
      if (fetchError) throw fetchError;

      const currentIntel = currentPerson.intelligence || currentPerson.intel || [];
      const updatedIntel = [...currentIntel, newIntelItem];

      const { error } = await supabase
        .from('people')
        .update({
          intelligence: updatedIntel,
          updated_at: new Date().toISOString()
        })
        .eq('id', person.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      toast.success('Intelligence log updated');
      setTopic('');
      setContent('');
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error('Failed to update intel: ' + err.message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kph-red/10 text-kph-red">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl">Intelligence Briefing</DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Documenting: {person?.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Intelligence Topic</Label>
            <Input 
              id="topic" 
              placeholder="e.g. Political Affiliation Shift, Business Deal..." 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="font-bold"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detailed Intelligence Content</Label>
            <Textarea 
              id="content" 
              placeholder="Provide specific details, quotes, or observations..." 
              className="min-h-[150px] font-medium leading-relaxed"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            className="bg-neutral-900 border-none font-bold" 
            disabled={!content || addIntelMutation.isPending}
            onClick={() => addIntelMutation.mutate()}
          >
            {addIntelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log Intelligence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

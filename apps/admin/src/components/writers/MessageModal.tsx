import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendMessageToWriter } from '../../lib/brevo';
import { toast } from 'sonner';

interface MessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  writerId: string;
  writerName: string;
}

export const MessageModal: React.FC<MessageModalProps> = ({ 
  open, 
  onOpenChange, 
  writerId, 
  writerName 
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject || !message || message.length < 20) {
      toast.error('Please complete all fields. Message must be at least 20 characters.');
      return;
    }

    setSending(true);
    try {
      // 1. Fetch writer email from Supabase
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', writerId)
        .single();
      
      if (fetchError || !profile?.email) {
        throw new Error('Could not find recipient email address');
      }

      // 2. Send via Brevo
      await sendMessageToWriter(profile.email, writerName, subject, message);
      
      toast.success(`Message dispatched to ${writerName}`);
      onOpenChange(false);
      reset();
    } catch (error: any) {
      console.error('Send Error:', error);
      toast.error(`Failed to deliver message: ${error.message || 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setSubject('');
    setMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if(!val) reset(); }}>
      <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden ring-1 ring-neutral-200">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sky-400 via-kph-red to-amber-400" />
        <DialogHeader className="pt-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl font-bold text-kph-charcoal">Editorial Correspondence</DialogTitle>
              <DialogDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground mt-0.5">
                Messaging: <span className="text-kph-charcoal font-black">{writerName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subject Line</Label>
            <Input 
              id="subject" 
              placeholder="e.g. Revision Required: [Article Title]" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Message Body</Label>
            <Textarea 
              id="message" 
              placeholder="Type your editorial feedback here..." 
              className="min-h-[180px] resize-none leading-relaxed"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex justify-between items-center px-1">
               <p className="text-[9px] text-muted-foreground italic">Professional tone is strictly mandated for all admin communications.</p>
               <p className={`text-[9px] font-bold ${message.length < 20 ? 'text-rose-500' : 'text-emerald-500'}`}>
                 {message.length}/20 min
               </p>
            </div>
          </div>
        </div>

        <DialogFooter className="bg-zinc-50/50 p-6 -mx-6 -mb-6 border-t mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold uppercase text-[10px] tracking-widest">
            Discard
          </Button>
          <Button 
            className="bg-kph-red hover:bg-neutral-800 text-white font-bold uppercase text-[10px] tracking-widest px-8"
            disabled={sending || !subject || message.length < 20}
            onClick={handleSend}
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Dispatching...
              </>
            ) : (
              <>
                <Send className="mr-2 h-3.5 w-3.5" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

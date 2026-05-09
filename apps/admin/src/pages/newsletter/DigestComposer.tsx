import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { sendNewsletter as dispatchNewsletter } from '../../lib/brevo';
import { 
  ChevronLeft, 
  Send, 
  Eye, 
  Loader2,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';

const LOGO_URL = 'https://res.cloudinary.com/dohuj4mx9/image/upload/v1778018185/hd_restoration_result_image_6_xejnhg.png';

export default function DigestComposer() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState(`KPH Weekly Digest: ${format(new Date(), 'MMMM d, yyyy')}`);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch recent published articles to choose from
  const { data: articles, isLoading } = useQuery({
    queryKey: ['recent-published-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch subscriber count for display
  const { data: subscriberCount = 0 } = useQuery({
    queryKey: ['subscriber-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('newsletter')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (error) throw error;
      return count || 0;
    }
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (selectedArticles.length === 0) throw new Error('Select at least one article');
      
      const currentArticlesData = articles?.filter((a: any) => selectedArticles.includes(a.id)) || [];

      // 1. Fetch active subscribers' emails
      const { data: subscribers, error: subError } = await supabase
        .from('newsletter')
        .select('email')
        .eq('status', 'active');
      
      if (subError) throw subError;

      const emails = subscribers
        ?.map(d => d.email)
        .filter((email): email is string => typeof email === 'string' && email.includes('@')) || [];

      if (emails.length === 0) throw new Error('No active subscribers with valid emails found.');

      // 2. Build HTML Content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media only screen and (max-width: 600px) {
              .container { width: 100% !important; padding: 10px !important; }
              .article-title { font-size: 20px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <table class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                  <tr>
                    <td align="center" style="padding: 40px 40px 20px 40px; border-bottom: 1px solid #f0f0f0;">
                      <img src="${LOGO_URL}" alt="KPH Logo" width="120" style="display: block; height: auto; border: 0;" />
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 40px 20px 40px;">
                      <p style="text-transform: uppercase; letter-spacing: 3px; font-size: 10px; font-weight: 900; color: #8B0000; margin: 0 0 10px 0;">WEEKLY INTELLIGENCE RECAP</p>
                      <h1 style="font-family: 'Georgia', serif; font-size: 32px; font-weight: 900; margin: 0; color: #1a1a1a; line-height: 1.2;">${subject}</h1>
                      <p style="color: #666; font-size: 16px; margin: 15px 0 0 0; line-height: 1.5;">Essential political insights and breaking analysis from the heart of Kwara State.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px 40px 40px;">
                      ${currentArticlesData.map((article: any) => `
                        <div style="margin-bottom: 50px; padding-bottom: 20px;">
                          ${(article.image_url || article.imageUrl) ? `
                            <a href="https://kph.ng/article/${article.id}" style="text-decoration: none;">
                              <img src="${article.image_url || article.imageUrl}" style="width: 100%; height: auto; border-radius: 12px; margin-bottom: 20px; display: block;" />
                            </a>
                          ` : ''}
                          <p style="color: #8B0000; text-transform: uppercase; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; margin: 0 0 8px 0;">${article.category}</p>
                          <h2 class="article-title" style="font-family: 'Georgia', serif; font-size: 24px; font-weight: 800; margin: 0 0 12px 0; color: #1a1a1a; line-height: 1.3;">
                            <a href="https://kph.ng/article/${article.id}" style="color: #1a1a1a; text-decoration: none;">${article.title}</a>
                          </h2>
                          <p style="color: #4a4a4a; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
                            ${(article.content || '').replace(/<[^>]*>/g, '').substring(0, 220)}...
                          </p>
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background-color: #8B0000; border-radius: 4px;">
                                <a href="https://kph.ng/article/${article.id}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Read Full Analysis</a>
                              </td>
                            </tr>
                          </table>
                        </div>
                      `).join('')}
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #fafafa; padding: 40px; text-align: center; border-top: 1px solid #f0f0f0;">
                      <p style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #999; margin: 0 0 15px 0;">Kwara Political Hangout • Intelligence Center</p>
                      <p style="color: #666; font-size: 12px; line-height: 1.5; margin: 0;">
                        Ilorin, Kwara State, Nigeria.
                        <br><br>
                        You are receiving this because you subscribed to KPH Weekly Updates.
                        <br><br>
                        <a href="{{unsubscribe_link}}" style="color: #8B0000; text-decoration: underline; font-weight: bold;">Unsubscribe from this list</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      // 3. Send via Brevo
      const result = await dispatchNewsletter(subject, htmlContent, emails);

      // 4. Save campaign history in Supabase
      const { error: logError } = await supabase.from('newsletter_campaigns').insert([{
        subject,
        article_ids: selectedArticles,
        sent_at: new Date().toISOString(),
        recipient_count: emails.length,
        status: 'delivered'
      }]);

      if (logError) console.error('Failed to log campaign:', logError);

      return result;
    },
    onSuccess: (result: any) => {
      toast.success(`Newsletter dispatched to ${result?.sentCount || 0} subscribers`);
      navigate('/admin/newsletter');
    },
    onError: (err: any) => {
      console.error('Newsletter Send Error:', err);
      toast.error(`Dispatch Failed: ${err.message || 'Internal Error'}`);
    }
  });

  const toggleArticle = (id: string) => {
    setSelectedArticles(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectedArticlesData = articles?.filter((a: any) => selectedArticles.includes(a.id)) || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Link to="/admin/newsletter" className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-kph-charcoal transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to Engine
        </Link>
        <div className="flex gap-3">
          <Button variant="outline" className="font-bold gap-2" onClick={() => setIsPreviewOpen(!isPreviewOpen)}>
            <Eye className="h-4 w-4" /> {isPreviewOpen ? 'Edit' : 'Preview'}
          </Button>
          <Button 
            className="bg-kph-red hover:bg-red-800 text-white font-bold gap-2"
            disabled={sendMutation.isPending || selectedArticles.length === 0}
            onClick={() => sendMutation.mutate()}
          >
            {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Dispatch Digest
          </Button>
        </div>
      </div>

      {!isPreviewOpen ? (
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-none shadow-sm ring-1 ring-neutral-200">
              <CardHeader>
                <CardTitle className="font-serif text-xl font-bold">Campaign Details</CardTitle>
                <CardDescription>Define how this newsletter appears in inboxes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Subject Line</label>
                  <Input 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="font-bold text-lg"
                    placeholder="Enter subject..."
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
              ) : (
                articles?.map((article: any) => (
                  <div 
                    key={article.id} 
                    className={`group relative border rounded-xl p-4 cursor-pointer transition-all ${
                      selectedArticles.includes(article.id) 
                        ? 'border-kph-red bg-red-50/30 ring-1 ring-kph-red' 
                        : 'bg-white hover:border-neutral-300'
                    }`}
                    onClick={() => toggleArticle(article.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        checked={selectedArticles.includes(article.id)}
                        onCheckedChange={() => toggleArticle(article.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 data-[state=checked]:bg-kph-red data-[state=checked]:border-kph-red cursor-pointer"
                      />
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-kph-red">{article.category}</p>
                        <h4 className="font-bold text-sm text-kph-charcoal line-clamp-2 leading-tight">{article.title}</h4>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {format(new Date(article.created_at || article.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
             <Card className="border-none shadow-sm ring-1 ring-neutral-200 bg-[#1A3C5E] text-white">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Reach Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Active Subscribers</p>
                      <h2 className="text-4xl font-black">{subscriberCount.toLocaleString()}</h2>
                   </div>
                   <div className="pt-4 border-t border-white/10">
                      <p className="text-[10px] font-medium opacity-70 leading-relaxed">
                        This digest will be delivered to all verified subscribers in the KPH network.
                      </p>
                   </div>
                </CardContent>
             </Card>

             <Card className="border-none shadow-sm ring-1 ring-neutral-200">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Selection Queue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-2">
                      {selectedArticlesData.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No articles selected yet.</p>
                      ) : (
                        selectedArticlesData.map((a: any) => (
                          <div key={a.id} className="flex items-center justify-between group">
                            <span className="text-xs font-bold text-kph-charcoal truncate pr-4">{a.title}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-muted-foreground hover:text-kph-red"
                              onClick={(e) => { e.stopPropagation(); toggleArticle(a.id); }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>
      ) : (
        <Card className="max-w-3xl mx-auto border-none shadow-2xl overflow-hidden ring-1 ring-neutral-200">
           <div className="bg-zinc-50 border-b p-4 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Responsive Email Preview</span>
              <div className="flex gap-2">
                 <div className="h-2 w-2 rounded-full bg-rose-400" />
                 <div className="h-2 w-2 rounded-full bg-amber-400" />
                 <div className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
           </div>
           <div className="p-8 bg-white h-[600px] overflow-auto">
              {/* Preview Content */}
              <div className="max-w-[500px] mx-auto space-y-8">
                 <img src={LOGO_URL} alt="Logo" className="h-10 mx-auto" />
                 <div className="text-center space-y-2">
                    <p className="text-[9px] font-black tracking-widest text-kph-red uppercase">Weekly Intelligence Recap</p>
                    <h1 className="font-serif text-3xl font-bold text-kph-charcoal leading-tight">{subject}</h1>
                 </div>
                 <div className="space-y-12">
                    {selectedArticlesData.map((a: any) => (
                      <div key={a.id} className="space-y-4">
                        {(a.image_url || a.imageUrl) && <img src={a.image_url || a.imageUrl} className="w-full rounded-xl" />}
                        <div className="space-y-2">
                          <p className="text-[9px] font-black tracking-widest text-kph-red uppercase">{a.category}</p>
                          <h2 className="font-serif text-xl font-bold text-kph-charcoal">{a.title}</h2>
                          <p className="text-sm text-neutral-600 leading-relaxed line-clamp-3">
                            {(a.content || '').replace(/<[^>]*>/g, '').substring(0, 150)}...
                          </p>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </Card>
      )}
    </div>
  );
}

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
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <title>${subject}</title>
          <style>
            @media only screen and (max-width: 600px) {
              .container { width: 100% !important; padding: 0 !important; }
              .content-padding { padding: 30px 20px !important; }
              .article-title { font-size: 22px !important; }
              .header-logo { width: 100px !important; }
              .hero-text { font-size: 28px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb;">
            <tr>
              <td align="center" style="padding: 40px 10px;">
                <!-- Main Container -->
                <table class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.03); border: 1px solid #f1f5f9;">
                  <!-- Header -->
                  <tr>
                    <td align="center" style="padding: 40px 40px 0 40px;">
                      <img src="${LOGO_URL}" alt="KPH Logo" width="120" class="header-logo" style="display: block; height: auto; border: 0;" />
                      <div style="margin-top: 30px; height: 1px; width: 60px; background-color: #8B0000; opacity: 0.2;"></div>
                    </td>
                  </tr>

                  <!-- Hero Section -->
                  <tr>
                    <td class="content-padding" style="padding: 40px 60px 40px 60px;">
                      <p style="text-transform: uppercase; letter-spacing: 0.25em; font-size: 11px; font-weight: 800; color: #8B0000; margin: 0 0 16px 0; font-family: 'Inter', system-ui, sans-serif;">Weekly Intelligence</p>
                      <h1 class="hero-text" style="font-family: 'Georgia', serif; font-size: 36px; font-weight: 900; margin: 0; color: #0f172a; line-height: 1.1; letter-spacing: -0.02em; font-style: italic;">${subject}</h1>
                      <p style="color: #475569; font-size: 17px; margin: 20px 0 0 0; line-height: 1.6; font-weight: 400;">
                        Essential political reporting and investigative analysis from Kwara's leading intelligence center.
                      </p>
                    </td>
                  </tr>

                  <!-- Articles List -->
                  <tr>
                    <td class="content-padding" style="padding: 0 60px 40px 60px;">
                      ${currentArticlesData.map((article: any, index: number) => `
                        <!-- Article ${index + 1} -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 48px;">
                          ${(article.image_url || article.imageUrl) ? `
                            <tr>
                              <td style="padding-bottom: 24px;">
                                <a href="https://www.kwarapoliticalhangout.com.ng/article/${article.id}" style="text-decoration: none;">
                                  <img src="${article.image_url || article.imageUrl}" alt="${article.title}" style="width: 100%; height: auto; border-radius: 16px; display: block; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" />
                                </a>
                              </td>
                            </tr>
                          ` : ''}
                          <tr>
                            <td>
                              <span style="background-color: #fef2f2; color: #8B0000; text-transform: uppercase; font-size: 10px; font-weight: 800; letter-spacing: 0.1em; padding: 4px 10px; border-radius: 6px; display: inline-block; margin-bottom: 12px; border: 1px solid #fee2e2;">
                                ${article.category}
                              </span>
                              <h2 class="article-title" style="font-family: 'Georgia', serif; font-size: 26px; font-weight: 800; margin: 0 0 14px 0; color: #0f172a; line-height: 1.3; letter-spacing: -0.01em;">
                                <a href="https://www.kwarapoliticalhangout.com.ng/article/${article.id}" style="color: #0f172a; text-decoration: none;">${article.title}</a>
                              </h2>
                              <p style="color: #334155; font-size: 15.5px; line-height: 1.7; margin: 0 0 24px 0; font-weight: 400;">
                                ${(article.excerpt || article.content || '').replace(/<[^>]*>/g, '').substring(0, 180)}...
                              </p>
                              <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td align="center" style="background-color: #0f172a; border-radius: 12px; transition: all 0.2s ease;">
                                    <a href="https://www.kwarapoliticalhangout.com.ng/article/${article.id}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">Read Briefing</a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          ${index < currentArticlesData.length - 1 ? `
                            <tr>
                              <td style="padding-top: 48px;">
                                <div style="height: 1px; background-color: #f1f5f9;"></div>
                              </td>
                            </tr>
                          ` : ''}
                        </table>
                      `).join('')}
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 48px 60px; text-align: center; border-top: 1px solid #f1f5f9;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="padding-bottom: 30px;">
                            <img src="${LOGO_URL}" alt="KPH Logo" width="80" style="display: block; opacity: 0.5;" />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <p style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; color: #64748b; margin: 0 0 16px 0;">Kwara Political Hangout • Intelligence Center</p>
                            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0; font-weight: 400;">
                              Ilorin, Kwara State, Nigeria.
                              <br><br>
                              You are receiving this intelligence report because you subscribed to the KPH network. This information is intended for the recipient and may contain priority analysis.
                              <br><br>
                              <a href="{{unsubscribe_link}}" style="color: #8B0000; text-decoration: none; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; border-bottom: 1px solid rgba(139,0,0,0.2);">Terminate Subscription</a>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                <!-- Social Links Placeholder -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="margin-top: 30px;">
                  <tr>
                    <td align="center">
                      <p style="color: #94a3b8; font-size: 11px; font-weight: 500;">
                        &copy; ${new Date().getFullYear()} KPH News. All rights reserved.
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
           <div className="p-0 bg-[#f9fafb] h-[700px] overflow-auto">
              {/* Preview Content */}
              <div className="max-w-[600px] mx-auto bg-white my-8 rounded-[24px] shadow-sm ring-1 ring-slate-200 overflow-hidden">
                 <div className="p-10 pb-0 text-center">
                    <img src={LOGO_URL} alt="Logo" className="h-10 mx-auto" />
                    <div className="mt-8 h-px w-12 bg-red-800/20 mx-auto" />
                 </div>
                 
                 <div className="p-10 lg:p-14 space-y-4">
                    <p className="text-[10px] font-black tracking-[0.25em] text-red-800 uppercase">Weekly Intelligence</p>
                    <h1 className="font-serif text-4xl font-bold text-slate-950 leading-tight italic">{subject}</h1>
                    <p className="text-slate-600 text-lg leading-relaxed">
                      Essential political reporting and investigative analysis from Kwara's leading intelligence center.
                    </p>
                 </div>

                 <div className="px-10 lg:px-14 pb-14 space-y-16">
                    {selectedArticlesData.map((a: any, idx: number) => (
                      <div key={a.id} className="space-y-6">
                        {(a.image_url || a.imageUrl) && (
                          <img src={a.image_url || a.imageUrl} className="w-full rounded-2xl shadow-sm border border-slate-100" />
                        )}
                        <div className="space-y-3">
                          <span className="inline-block px-2.5 py-1 bg-red-50 text-red-800 text-[10px] font-black uppercase tracking-widest rounded-md border border-red-100">
                            {a.category}
                          </span>
                          <h2 className="font-serif text-2xl font-bold text-slate-950">{a.title}</h2>
                          <p className="text-slate-600 leading-relaxed line-clamp-3">
                            {(a.excerpt || a.content || '').replace(/<[^>]*>/g, '').substring(0, 180)}...
                          </p>
                          <div className="pt-4">
                            <span className="inline-block px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">
                              Read Briefing
                            </span>
                          </div>
                        </div>
                        {idx < selectedArticlesData.length - 1 && <div className="pt-8 h-px bg-slate-100 w-full" />}
                      </div>
                    ))}
                 </div>

                 <div className="bg-slate-50 p-12 text-center border-t border-slate-100">
                    <img src={LOGO_URL} alt="Logo" className="h-8 mx-auto opacity-40 grayscale mb-8" />
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-4">Kwara Political Hangout • Intelligence Center</p>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                      Ilorin, Kwara State, Nigeria.<br /><br />
                      You are receiving this intelligence report because you subscribed to the KPH network.
                    </p>
                    <div className="mt-8">
                       <span className="text-[10px] font-black text-red-800 uppercase border-b border-red-800/20 pb-1 cursor-pointer">Terminate Subscription</span>
                    </div>
                 </div>
              </div>
           </div>v>
        </Card>
      )}
    </div>
  );
}

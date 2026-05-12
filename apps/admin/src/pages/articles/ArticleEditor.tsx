import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Save, 
  Image as ImageIcon, 
  X, 
  ChevronLeft, 
  Loader2, 
  Settings2,
  Video
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { ImageUploadService } from '@/services/imageUploadService';
import { VideoUploadService } from '@/services/videoUploadService';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const ArticleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [featuredVideo, setFeaturedVideo] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEdit = !!id;

  const uploadToImageKit = async (file: File, folder: string) => {
    try {
      // The ImageUploadService handles the secure signature via Edge Function 
      // and uploads directly to ImageKit Media Library!
      const url = await ImageUploadService.uploadImage(file, `/kph-articles/${folder}`);
      console.log('Generated ImageKit URL:', url);
      return url;
    } catch (error: any) {
      console.error('ImageKit upload error in editor:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  };

  const { data: article, isLoading } = useQuery({
    queryKey: ['article-edit', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: isEdit
  });

  const hasInitialized = React.useRef(false);
  const quillRef = React.useRef<any>(null);

  const imageHandler = React.useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const folder = id || 'temp';
      const toastId = toast.loading('Uploading image asset...');
      try {
        const url = await uploadToImageKit(file, folder);
        
        if (!quillRef.current) {
          throw new Error('Editor not found. Please try again.');
        }

        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', url);
        // Add a newline after the image for better flow
        quill.insertText(range.index + 1, '\n');
        toast.success('Image integrated successfully', { id: toastId });
      } catch (error: any) {
        console.error('Image upload failed:', error);
        toast.error(`Image upload failed: ${error.message || 'Unknown error'}`, { id: toastId });
      }
    };
  }, [id]);

  const videoHandler = React.useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'video/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const folder = id || 'temp';
      const toastId = toast.loading('Uploading video asset...');
      try {
        // Use VideoUploadService for better validation and progress tracking
        const url = await VideoUploadService.uploadVideo(file, `/kph-articles/${folder}`, (pct) => {
          toast.loading(`Uploading video: ${pct}%`, { id: toastId });
        });

        if (!quillRef.current) {
          throw new Error('Editor not found. Please try again.');
        }

        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'video', url);
        // Add a newline after the video
        quill.insertText(range.index + 1, '\n');
        toast.success('Video integrated successfully', { id: toastId });
      } catch (error: any) {
        console.error('Video upload failed:', error);
        toast.error(`Video upload failed: ${error.message || 'Unknown error'}`, { id: toastId });
      }
    };
  }, [id]);

  const modules = React.useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        ['blockquote', 'code-block'],
        [{'list': 'ordered'}, {'list': 'bullet'}, { 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: imageHandler,
        video: videoHandler
      }
    },
    clipboard: {
      matchVisual: false,
    }
  }), [imageHandler, videoHandler]);

  useEffect(() => {
    if (article && !hasInitialized.current) {
      setTitle(article.title || '');
      setContent(article.content || '');
      setCategory(article.category || '');
      setExcerpt(article.excerpt || '');
      setFeaturedImage(article.image_url || article.imageUrl || article.featuredImage || null);
      setFeaturedVideo(article.video_url || null);
      hasInitialized.current = true;
    }
  }, [article]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const toastId = toast.loading('Uploading featured graphic...');
    try {
      const folder = id || 'temp';
      const url = await uploadToImageKit(file, folder);
      setFeaturedImage(url);
      toast.success('Image uploaded successfully', { id: toastId });
    } catch (error: any) {
      console.error('Featured image upload failed:', error);
      toast.error(`Image upload failed: ${error.message || 'Unknown error'}`, { id: toastId });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFeaturedVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    const toastId = toast.loading('Uploading featured video report...');
    try {
      const folder = id || 'temp';
      const url = await VideoUploadService.uploadVideo(file, `/kph-articles/${folder}`, (pct) => {
        toast.loading(`Uploading video: ${pct}%`, { id: toastId });
      });
      setFeaturedVideo(url);
      toast.success('Video uploaded successfully', { id: toastId });
    } catch (error: any) {
      console.error('Featured video upload failed:', error);
      toast.error(`Video upload failed: ${error.message || 'Unknown error'}`, { id: toastId });
    } finally {
      setUploadingVideo(false);
    }
  };

  const calculateReadTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = (text || '').split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  const handleSave = async (status: 'draft' | 'pending' | 'published') => {
    if (!title || !content || !category) {
      toast.error('Please fill in all required fields (Title, Content, Category)');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const wordCount = content.split(/\s+/).length;
      const readTime = calculateReadTime(content);

      const articleData: any = {
        title,
        content,
        category,
        excerpt: excerpt || '',
        status,
        updatedAt: now,
        wordCount: wordCount,
        readTime: readTime,
        authorId: user?.id,
        authorName: user?.user_metadata?.full_name || user?.user_metadata?.displayName || 'Anonymous',
        authorAvatar: user?.user_metadata?.avatar_url || user?.user_metadata?.photo_url || '',
        imageUrl: featuredImage || '',
        video_url: featuredVideo || '',
      };

      if (status === 'published') {
        articleData.publishedAt = now;
      }

      if (isEdit) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', id);
        
        if (error) throw error;
        toast.success('Article updated successfully');
      } else {
        const { data, error } = await supabase
          .from('articles')
          .insert([{ 
            ...articleData, 
            createdAt: now,
            tags: [],
            isFeatured: false,
            isBreaking: false,
            isTrending: false
          }])
          .select()
          .single();
        
        if (error) throw error;
        navigate(`/admin/articles/${data.id}/edit`);
        toast.success('Article created successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (error: any) {
      console.error('Save Article Error:', error);
      toast.error(`Failed to save article: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-kph-red" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/articles')}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="font-serif text-2xl font-bold">
            {isEdit ? 'Edit Editorial' : 'Draft New Piece'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => handleSave('draft')} disabled={saving}>
            Save Draft
          </Button>
          <Button className="bg-kph-red hover:bg-neutral-800 text-sm font-bold h-9" onClick={() => handleSave('pending')} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Submit for Review
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 min-h-[800px] relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-kph-red to-red-400"></div>
             
             {/* Sticky Toolbar Container (Quill Toolbar will be moved here by CSS) */}
             <div className="quill-toolbar-container sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-100 py-3 px-8 shadow-sm"></div>

             <div className="px-8 py-12 lg:px-16 lg:py-12">
               <div className="space-y-4 mb-8 max-w-[800px] mx-auto">
                 <Input 
                   placeholder="The Narrative Title..." 
                   className="border-none text-4xl lg:text-5xl font-serif font-black placeholder:text-neutral-200 focus-visible:ring-0 px-0 h-auto bg-transparent leading-tight text-kph-charcoal"
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                 />
               </div>

               <div className="quill-wrapper max-w-[800px] mx-auto">
                 <ReactQuill 
                   ref={quillRef}
                   theme="snow" 
                   value={content} 
                   onChange={setContent}
                   placeholder="Unfold the story here..."
                   modules={modules}
                 />
               </div>
             </div>
          </div>
        </div>

        {/* Sidebar Settings Area */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-neutral-200 sticky top-6">
            <CardHeader className="pb-4 border-b border-neutral-100">
              <CardTitle className="font-serif text-lg flex items-center gap-2 text-kph-charcoal">
                <Settings2 className="h-4 w-4 text-kph-red" /> Document Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Category */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full h-10 border-neutral-200 focus:ring-kph-red">
                    <SelectValue placeholder="Focus Area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kwara Pulse">Kwara Pulse</SelectItem>
                    <SelectItem value="Governance">Governance</SelectItem>
                    <SelectItem value="Spotlight">Spotlight</SelectItem>
                    <SelectItem value="Economy">Economy</SelectItem>
                    <SelectItem value="Archive">Archive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Featured Image */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Featured Graphic</Label>
                
                {featuredImage ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-200 group shadow-sm">
                    <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setFeaturedImage(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-neutral-200 hover:border-kph-red hover:bg-red-50 cursor-pointer transition-all group">
                      {uploadingImage ? (
                        <Loader2 className="h-6 w-6 animate-spin text-kph-red" />
                      ) : (
                        <>
                          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
                             <ImageIcon className="h-5 w-5 text-kph-red" />
                          </div>
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Upload Image Asset</span>
                        </>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="h-px bg-neutral-100 flex-1" />
                      <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">OR PASTE URL</span>
                      <div className="h-px bg-neutral-100 flex-1" />
                    </div>
                    <div className="space-y-1.5">
                      <Input 
                        placeholder="https://..." 
                        className="h-9 text-xs font-medium border-neutral-200 focus-visible:ring-kph-red bg-neutral-50 focus:bg-white transition-colors"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value;
                            if (val.startsWith('http')) {
                              setFeaturedImage(val);
                            }
                          }
                        }}
                        onBlur={(e) => {
                            const val = e.target.value;
                            if (val && val.startsWith('http')) {
                                setFeaturedImage(val);
                            }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* Featured Video */}
              <div className="space-y-4 pt-4 border-t border-neutral-100">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Featured Video Report</Label>
                
                {featuredVideo ? (
                  <div className="space-y-3">
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-200 bg-black group shadow-sm">
                      <video src={featuredVideo} className="w-full h-full object-contain" controls />
                      <button 
                        onClick={() => setFeaturedVideo(null)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 z-10 hover:scale-110"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-neutral-200 hover:border-kph-red hover:bg-red-50 cursor-pointer transition-all group">
                    {uploadingVideo ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-kph-red" />
                        <span className="text-[8px] font-black text-kph-red uppercase tracking-wide">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
                            <Video className="h-5 w-5 text-kph-red" />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Upload Video Asset</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="video/*" onChange={handleFeaturedVideoUpload} disabled={uploadingVideo} />
                  </label>
                )}
              </div>

              {/* Hook / Excerpt */}
              <div className="space-y-2 pt-4 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hook / Excerpt</Label>
                  <span className="text-[9px] font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">{excerpt.length}/300</span>
                </div>
                <textarea 
                  className="w-full min-h-[100px] bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-kph-red/20 focus:border-kph-red outline-none transition-all resize-none"
                  placeholder="Sum up the essence in a few lines..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value.substring(0, 300))}
                />
              </div>

              {/* Stats Preview */}
              <div className="pt-4 border-t border-neutral-100 space-y-3">
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Est. Read Time</span>
                  <span className="text-xs font-bold text-kph-red">{calculateReadTime(content)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Word Count</span>
                  <span className="text-xs font-bold text-kph-red">{(content || '').split(/\s+/).length} words</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style>{`
        /* Minimalist Canvas Styling for Quill */
        .quill-wrapper .ql-container.ql-snow {
          border: none !important;
          font-family: var(--font-serif), Georgia, serif;
          font-size: 1.25rem;
          line-height: 1.8;
          color: #2b2b2b;
        }
        .quill-wrapper .ql-editor {
          min-height: 600px;
          padding: 1rem 0 6rem 0;
        }
        .quill-wrapper .ql-editor.ql-blank::before {
          left: 0;
          font-style: normal;
          color: #a3a3a3;
        }
        
        /* Double line spacing between paragraphs */
        .quill-wrapper .ql-editor p {
          margin-bottom: 2.5em; /* This gives the double line spacing effect */
        }
        
        /* Typography Polish */
        .quill-wrapper .ql-editor h1,
        .quill-wrapper .ql-editor h2,
        .quill-wrapper .ql-editor h3 {
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 800;
          color: #111;
          margin-top: 2.5em;
          margin-bottom: 1em;
          letter-spacing: -0.02em;
        }
        
        .quill-wrapper .ql-editor h1 { font-size: 2.25rem; }
        .quill-wrapper .ql-editor h2 { font-size: 1.875rem; }
        .quill-wrapper .ql-editor h3 { font-size: 1.5rem; }
        
        /* Clean quotes */
        .quill-wrapper .ql-editor blockquote {
          border-left: 4px solid #ef4444; /* kph-red */
          margin-left: 0;
          padding-left: 1.5rem;
          color: #525252;
          font-style: italic;
          font-size: 1.35rem;
          margin-bottom: 2.5em;
        }

        /* Images and Media */
        .quill-wrapper .ql-editor img,
        .quill-wrapper .ql-editor iframe {
          border-radius: 0.75rem;
          margin: 3em auto;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1);
          max-width: 100%;
          display: block;
        }

        /* Toolbar Styling */
        .quill-wrapper .ql-toolbar.ql-snow {
          border: none !important;
          background: transparent;
          padding: 0;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0.25rem;
        }
        
        /* Move toolbar into sticky container */
        .quill-toolbar-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .quill-wrapper .ql-toolbar .ql-formats {
          margin-right: 0.5rem;
          background: white;
          border: 1px solid #f0f0f0;
          border-radius: 0.5rem;
          padding: 0.15rem;
          box-shadow: 0 2px 5px rgba(0,0,0,0.02);
        }
        
        .quill-wrapper .ql-toolbar button:hover,
        .quill-wrapper .ql-toolbar .ql-picker-label:hover {
          color: #ef4444 !important; /* kph-red */
        }
        .quill-wrapper .ql-toolbar button.ql-active {
          color: #ef4444 !important;
        }
        .quill-wrapper .ql-toolbar .ql-stroke {
          stroke: #525252;
        }
        .quill-wrapper .ql-toolbar .ql-fill {
          fill: #525252;
        }
        .quill-wrapper .ql-toolbar button:hover .ql-stroke,
        .quill-wrapper .ql-toolbar button.ql-active .ql-stroke {
          stroke: #ef4444 !important;
        }
        .quill-wrapper .ql-toolbar button:hover .ql-fill,
        .quill-wrapper .ql-toolbar button.ql-active .ql-fill {
          fill: #ef4444 !important;
        }
        
        .ql-snow .ql-picker.ql-header {
          width: 130px;
        }
      `}</style>
    </div>
  );
};

export default ArticleEditor;

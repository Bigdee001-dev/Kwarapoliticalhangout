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
  Settings2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { ImageUploadService } from '@/services/imageUploadService';
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
  const [uploadingImage, setUploadingImage] = useState(false);
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
        const url = await uploadToImageKit(file, folder);
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
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-neutral-200">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Input 
                  placeholder="The Narrative Title..." 
                  className="border-none text-4xl font-serif font-black placeholder:text-neutral-200 focus-visible:ring-0 px-0 h-auto"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <div className="h-px bg-neutral-100" />
              </div>

              <div className="quill-wrapper">
                <ReactQuill 
                  ref={quillRef}
                  theme="snow" 
                  value={content} 
                  onChange={setContent}
                  placeholder="Unfold the story here..."
                  modules={modules}
                  className="min-h-[500px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings Area */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-neutral-200">
            <CardHeader className="pb-4">
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-kph-red" /> Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full h-10">
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
                  <div className="relative aspect-video rounded-lg overflow-hidden border group">
                    <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setFeaturedImage(null)}
                      className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center aspect-video rounded-lg border border-dashed border-neutral-300 hover:border-kph-red hover:bg-neutral-50 cursor-pointer transition-all">
                      {uploadingImage ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <ImageIcon className="h-6 w-6 text-muted-foreground mb-2" />
                          <span className="text-[10px] font-bold text-muted-foreground">Upload Asset</span>
                        </>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="h-px bg-neutral-100 flex-1" />
                      <span className="text-[10px] font-black text-neutral-300 uppercase">OR</span>
                      <div className="h-px bg-neutral-100 flex-1" />
                    </div>
                    <div className="space-y-1.5">
                      <Input 
                        placeholder="Paste image URL here..." 
                        className="h-8 text-[10px] font-bold"
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

              {/* Excerpt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hook / Excerpt</Label>
                  <span className="text-[9px] text-muted-foreground">{excerpt.length}/300</span>
                </div>
                <textarea 
                  className="w-full min-h-[100px] bg-zinc-50 border rounded-lg p-3 text-xs font-medium focus:ring-1 focus:ring-kph-red outline-none"
                  placeholder="Sum up the essence in a few lines..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value.substring(0, 300))}
                />
              </div>

              {/* Stats Preview */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-muted-foreground">Est. Read Time</span>
                  <span className="text-kph-charcoal">{calculateReadTime(content)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-muted-foreground">Word Count</span>
                  <span className="text-kph-charcoal">{(content || '').split(/\s+/).length} words</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style>{`
        .quill-wrapper .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          background: #fafafa;
          font-family: var(--font-sans);
          font-size: 1.15rem;
          line-height: 1.8;
        }
        .quill-wrapper .ql-editor {
          min-height: 500px;
          padding: 2rem;
        }
        .quill-wrapper .ql-editor p {
          margin-bottom: 1.5rem;
        }
        .quill-wrapper .ql-editor img {
          border-radius: 0.75rem;
          margin: 2rem 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .quill-wrapper .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background: white;
          border-color: #e5e5e5;
          padding: 1rem;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .quill-wrapper .ql-container.ql-snow {
          border-color: #e5e5e5;
        }
        .ql-snow .ql-picker.ql-header {
          width: 120px;
        }
      `}</style>
    </div>
  );
};

export default ArticleEditor;

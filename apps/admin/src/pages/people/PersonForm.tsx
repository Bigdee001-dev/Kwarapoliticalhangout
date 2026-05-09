import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ImagePlus, 
  Trash2, 
  Plus, 
  ChevronLeft, 
  Loader2, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Facebook,
  Calendar as CalendarIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
  id: string;
  index: number;
  register: any;
  remove: (index: number) => void;
}

const SortableTimelineItem = ({ id, index, register, remove }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="grid grid-cols-12 gap-3 items-end bg-zinc-50 p-3 rounded-lg border group"
    >
      <div className="col-span-1 flex items-center justify-center pb-2 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
      </div>
      <div className="col-span-2">
        <Label className="text-[10px] font-bold uppercase mb-1 block">Year</Label>
        <Input {...register(`careerTimeline.${index}.year`)} placeholder="2022" />
      </div>
      <div className="col-span-4">
        <Label className="text-[10px] font-bold uppercase mb-1 block">Role</Label>
        <Input {...register(`careerTimeline.${index}.role`)} placeholder="Managing Director" />
      </div>
      <div className="col-span-4">
        <Label className="text-[10px] font-bold uppercase mb-1 block">Organization</Label>
        <Input {...register(`careerTimeline.${index}.organization`)} placeholder="Access Bank" />
      </div>
      <div className="col-span-1">
        <Button type="button" variant="ghost" size="sm" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => remove(index)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const SUB_CATEGORIES = [
  "Political Icons", "Techpreneurs", "Business Moguls", "Academic Legends",
  "Youth Voices", "Women Making Waves", "Cultural Ambassadors", "Faith Leaders",
  "Diaspora Champions", "Sports Stars", "Civil Society", "Media Personalities"
];

const STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", 
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", 
  "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
];

const personSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
  subCategory: z.string().min(1, "Category is required"),
  state: z.string().min(1, "State is required"),
  title: z.string().min(1, "Title is required"),
  party: z.string().optional(),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  birthplace: z.string().optional(),
  birthDate: z.date().optional(),
  isPublished: z.boolean(),
  socialLinks: z.object({
    twitter: z.string().url().or(z.literal("")).optional(),
    instagram: z.string().url().or(z.literal("")).optional(),
    linkedin: z.string().url().or(z.literal("")).optional(),
    facebook: z.string().url().or(z.literal("")).optional(),
  }),
  careerTimeline: z.array(z.object({
    year: z.string(),
    role: z.string(),
    organization: z.string()
  }))
});

type PersonFormValues = z.infer<typeof personSchema>;

const PersonForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      name: '',
      slug: '',
      subCategory: '',
      state: '',
      title: '',
      party: '',
      bio: '',
      birthplace: '',
      birthDate: undefined,
      isPublished: false,
      socialLinks: { twitter: '', instagram: '', linkedin: '', facebook: '' },
      careerTimeline: []
    }
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "careerTimeline"
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      move(oldIndex, newIndex);
    }
  };

  useEffect(() => {
    if (id) {
      const fetchPerson = async () => {
        try {
          const { data, error } = await supabase
            .from('people')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) throw error;
          
          if (data) {
            form.reset({
              ...data,
              subCategory: data.sub_category || data.subCategory,
              isPublished: data.is_published ?? data.isPublished,
              birthDate: data.birth_date ? new Date(data.birth_date) : (data.birthDate ? new Date(data.birthDate) : undefined),
              socialLinks: data.social_links || data.socialLinks || { twitter: '', instagram: '', linkedin: '', facebook: '' },
              careerTimeline: data.career_timeline || data.careerTimeline || []
            } as any);
            
            const photo = data.photo_url || data.photoUrl;
            const banner = data.banner_url || data.bannerUrl;
            if (photo) setPhotoPreview(photo);
            if (banner) setBannerPreview(banner);
          }
        } catch (error) {
          toast.error('Failed to load profile');
        } finally {
          setFetching(false);
        }
      };
      fetchPerson();
    }
  }, [id, form]);

  const onNameChange = (name: string) => {
    if (!id) {
      const slug = name.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      form.setValue('slug', slug);
    }
  };

  const uploadToImageKit = async (file: File, folder: string) => {
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = `people/${folder}/${fileName}`;

    // Try uploading to 'articles' bucket which we know exists
    const { error } = await supabase.storage
      .from('articles')
      .upload(filePath, file);

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get the direct Supabase public URL as the primary source of truth
    const { data: publicUrlData } = supabase.storage
      .from('articles')
      .getPublicUrl(filePath);
    
    const supabaseUrl = publicUrlData.publicUrl;

    const imageKitEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
    
    if (imageKitEndpoint) {
      const cleanEndpoint = imageKitEndpoint.endsWith('/') ? imageKitEndpoint.slice(0, -1) : imageKitEndpoint;
      // Prepend 'articles/' because we are uploading to the 'articles' bucket
      const finalUrl = `${cleanEndpoint}/articles/${filePath}`;
      console.log('Generated ImageKit URL (People):', finalUrl);
      return finalUrl;
    }

    console.log('Generated Supabase URL (People - No ImageKit):', supabaseUrl);
    return supabaseUrl;
  };

  const onSubmit = async (values: PersonFormValues) => {
    setLoading(true);
    try {
      let photoUrl = photoPreview;
      let bannerUrl = bannerPreview;

      if (photoFile) {
        photoUrl = await uploadToImageKit(photoFile, 'photos');
      }
      if (bannerFile) {
        bannerUrl = await uploadToImageKit(bannerFile, 'banners');
      }

      const personData = {
        name: values.name,
        slug: values.slug,
        sub_category: values.subCategory,
        state: values.state,
        title: values.title,
        party: values.party,
        bio: values.bio,
        birthplace: values.birthplace,
        is_published: values.isPublished,
        photo_url: photoUrl,
        banner_url: bannerUrl,
        social_links: values.socialLinks,
        career_timeline: values.careerTimeline,
        birth_date: values.birthDate ? values.birthDate.toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        const { error } = await supabase
          .from('people')
          .update(personData)
          .eq('id', id);
        if (error) throw error;
        toast.success('Profile updated successfully');
      } else {
        const { error } = await supabase
          .from('people')
          .insert([{ ...personData, created_at: new Date().toISOString() }]);
        if (error) throw error;
        toast.success('Profile created successfully');
      }
      navigate('/admin/people');
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to save profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/people')}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="font-serif text-3xl font-bold">{id ? 'Refine Profile' : 'Immortalize Influencer'}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-sm ring-1 ring-neutral-200">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Identity & Context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} onChange={(e) => { field.onChange(e); onNameChange(e.target.value); }} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug (URL Handle)</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-1 bg-zinc-50 rounded-md border pl-3">
                              <span className="text-[10px] font-bold text-zinc-400">kph.ng/eminent/</span>
                              <Input {...field} className="border-none bg-transparent" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                     <FormField
                      control={form.control}
                      name="subCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sub-Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-60">
                              {SUB_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State of Origin/Influence</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select State" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-60">
                              {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Honorific Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. CEO, Senator, Oba..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch('subCategory') === 'Political Icons' && (
                    <FormField
                      control={form.control}
                      name="party"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Political Party</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. APC, PDP, LP..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>The Narrative (Bio)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Craft a compelling biography..." 
                            className="min-h-[250px] resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>Minimalist plain-text bio. Markdown supported.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm ring-1 ring-neutral-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-serif text-lg">Career Timeline</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ year: '', role: '', organization: '' })}>
                    <Plus className="h-4 w-4 mr-1" /> Add Milestone
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={fields.map(f => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {fields.map((field, index) => (
                          <SortableTimelineItem
                            key={field.id}
                            id={field.id}
                            index={index}
                            register={form.register}
                            remove={remove}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                  {fields.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground italic text-sm">
                      No career milestones added yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-sm ring-1 ring-neutral-200 overflow-hidden">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Face of KPH</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Primary Portrait (4:5)</Label>
                    <div 
                      className="aspect-[4/5] w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-zinc-50 relative overflow-hidden group cursor-pointer"
                      onClick={() => document.getElementById('photo-input')?.click()}
                    >
                      {photoPreview ? (
                        <>
                          <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-bold font-serif">Replace Portrait</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ImagePlus className="h-8 w-8" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Click to upload</span>
                        </div>
                      )}
                      <input 
                        id="photo-input" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if(file) {
                             setPhotoFile(file);
                             setPhotoPreview(URL.createObjectURL(file));
                          }
                        }} 
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Banner Visual (16:9)</Label>
                    <div 
                      className="aspect-video w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-zinc-50 relative overflow-hidden group cursor-pointer"
                      onClick={() => document.getElementById('banner-input')?.click()}
                    >
                      {bannerPreview ? (
                        <>
                          <img src={bannerPreview} alt="Banner" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-bold font-serif">Replace Banner</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ImagePlus className="h-8 w-8" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Optional Banner</span>
                        </div>
                      )}
                      <input 
                         id="banner-input" 
                         type="file" 
                         accept="image/*" 
                         className="hidden" 
                         onChange={(e) => {
                           const file = e.target.files?.[0];
                           if(file) {
                              setBannerFile(file);
                              setBannerPreview(URL.createObjectURL(file));
                           }
                         }} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm ring-1 ring-neutral-200">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Profile Vitals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="birthplace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birthplace</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Ilorin, Kwara" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                        </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm ring-1 ring-neutral-200">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Social Connections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Twitter className="h-4 w-4 text-sky-500" />
                      <Input placeholder="X (Twitter) URL" {...form.register('socialLinks.twitter')} />
                    </div>
                    <div className="flex items-center gap-3">
                      <Instagram className="h-4 w-4 text-rose-500" />
                      <Input placeholder="Instagram URL" {...form.register('socialLinks.instagram')} />
                    </div>
                    <div className="flex items-center gap-3">
                      <Linkedin className="h-4 w-4 text-sky-700" />
                      <Input placeholder="LinkedIn URL" {...form.register('socialLinks.linkedin')} />
                    </div>
                    <div className="flex items-center gap-3">
                      <Facebook className="h-4 w-4 text-blue-600" />
                      <Input placeholder="Facebook URL" {...form.register('socialLinks.facebook')} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[#1A3C5E] text-white shadow-lg">
                <div className="flex flex-col">
                   <span className="font-serif text-sm font-bold">Public Listing</span>
                   <span className="text-[10px] opacity-70">Visible to portal readers</span>
                </div>
                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

               <Button 
                type="submit" 
                className="w-full h-14 bg-kph-red hover:bg-neutral-800 text-white font-serif text-lg font-bold shadow-xl"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Baking Identity...
                  </>
                ) : (
                  id ? 'Update Eminence' : 'Finalize Profile'
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PersonForm;

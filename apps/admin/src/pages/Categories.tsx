import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
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
import { 
  Plus, 
  MoreHorizontal, 
  Trash2, 
  Edit, 
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const Categories: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '' });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  const addMutation = useMutation({
    mutationFn: async (category: any) => {
      const { error } = await supabase.from('categories').insert({
        name: category.name,
        slug: category.slug,
        description: category.description,
        article_count: 0,
        created_at: new Date().toISOString()
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsAddModalOpen(false);
      setNewCategory({ name: '', slug: '', description: '' });
      toast.success('Category established.');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category decommissioned.');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const generateSlug = (name: string) => {
    return name.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-3">
            <Layers className="h-8 w-8 text-kph-red" />
            Taxonomy Management
          </h1>
          <p className="text-sm text-muted-foreground">Define and organize content categories for the portal.</p>
        </div>
        <Button className="bg-kph-red hover:bg-neutral-800" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Category
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm ring-1 ring-neutral-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest">Active Segments</CardDescription>
            <CardTitle className="font-serif text-3xl font-black">{categories?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-neutral-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest">Total Indexed Tags</CardDescription>
            <CardTitle className="font-serif text-3xl font-black">124</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-neutral-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest">System Health</CardDescription>
            <CardTitle className="font-serif text-3xl font-black text-emerald-600 italic">Optimal</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-neutral-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50 border-b">
            <TableRow>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground pl-6">Category Name</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">URL Slug</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Description</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground text-center">Articles</TableHead>
              <TableHead className="w-[80px] pr-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4].map(i => (
                <TableRow key={i}>
                  <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                  <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : categories?.map((cat: any) => (
              <TableRow key={cat.id} className="hover:bg-zinc-50/50 transition-colors">
                <TableCell className="pl-6 font-bold text-kph-charcoal flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-kph-red" />
                  {cat.name}
                </TableCell>
                <TableCell className="font-mono text-[10px] text-muted-foreground">
                  /{cat.slug}
                </TableCell>
                <TableCell className="text-xs text-zinc-500 max-w-sm truncate">
                  {cat.description || 'No description provided.'}
                </TableCell>
                <TableCell className="text-center font-serif font-black">
                  {cat.article_count || 0}
                </TableCell>
                <TableCell className="pr-6 text-right">
                   <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-zinc-100 transition-colors outline-none">
                          <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-xs font-bold uppercase tracking-widest">
                        <Edit className="mr-2 h-3.5 w-3.5" /> Edit Registry
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-xs font-bold uppercase tracking-widest text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                        onClick={() => { if(window.confirm('Delete this taxonomy?')) deleteMutation.mutate(cat.id); }}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Decommission
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl italic">Create Taxonomy Node</DialogTitle>
            <DialogDescription>Define a new segment for content organization.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category Name</label>
              <Input 
                placeholder="e.g. Political Analysis" 
                value={newCategory.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setNewCategory({ ...newCategory, name, slug: generateSlug(name) });
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Slug</label>
              <Input value={newCategory.slug} readOnly className="bg-zinc-50 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</label>
              <Input 
                placeholder="High-level overview of this segment..." 
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-kph-red hover:bg-neutral-800 font-bold uppercase text-[10px] tracking-widest"
              onClick={() => addMutation.mutate(newCategory)}
              disabled={!newCategory.name || addMutation.isPending}
            >
              Add to Index
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;

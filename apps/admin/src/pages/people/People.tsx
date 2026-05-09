import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Plus, 
  Search, 
  FileDown, 
  UserPlus,
  BrainCircuit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ImportModal } from '../../components/people/ImportModal';
import { IntelligenceModal } from '../../components/people/IntelligenceModal';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

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

const People: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [intelModalOpen, setIntelModalOpen] = useState(false);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: people, isLoading } = useQuery({
    queryKey: ['people', categoryFilter, stateFilter],
    queryFn: async () => {
      let query = supabase.from('people').select('*');

      if (categoryFilter !== 'all') {
        query = query.eq('sub_category', categoryFilter);
      }
      
      if (stateFilter !== 'all') {
        query = query.eq('state', stateFilter);
      }

      const { data, error } = await query.order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  const togglePublishedMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string, isPublished: boolean }) => {
      const { error } = await supabase
        .from('people')
        .update({ is_published: isPublished, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      toast.success('Visibility updated');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!window.confirm('Are you sure you want to delete this profile? This action is irreversible.')) return;
      const { error } = await supabase.from('people').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      toast.success('Person removed from database');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const filteredPeople = people?.filter((p: any) => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-kph-charcoal">Council of Eminence</h1>
          <p className="text-sm text-muted-foreground">Manage the profiles of the most influential Nigerians.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-neutral-200" onClick={() => setImportModalOpen(true)}>
            <FileDown className="mr-2 h-4 w-4" /> Bulk Import
          </Button>
          <Button className="bg-kph-red hover:bg-neutral-800" onClick={() => navigate('/admin/people/new')}>
            <UserPlus className="mr-2 h-4 w-4" /> Add Influencer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {SUB_CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {STATES.map(state => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50">
            <TableRow>
              <TableHead className="w-[80px]">Photo</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Full Name</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Category & State</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground text-center">Articles</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Public</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map(i => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-10 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredPeople?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                  No records found.
                </TableCell>
              </TableRow>
            ) : filteredPeople?.map((person: any) => (
              <TableRow key={person.id} className="hover:bg-zinc-50/50 transition-colors">
                <TableCell>
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={person.photo_url || person.photoUrl} alt={person.name} />
                    <AvatarFallback className="bg-neutral-100 text-[10px] font-bold">
                      {person.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-kph-charcoal">{person.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{person.title}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="w-fit text-[9px] font-black uppercase tracking-tighter border-neutral-200">
                      {person.sub_category || person.subCategory}
                    </Badge>
                    <span className="text-[10px] font-bold text-zinc-500">{person.state} State</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-zinc-100 text-zinc-600 font-bold border-none">{person.linked_articles_count || person.linkedArticlesCount || 0}</Badge>
                </TableCell>
                <TableCell>
                  <Switch 
                    checked={person.is_published ?? person.isPublished} 
                    onCheckedChange={(val) => togglePublishedMutation.mutate({ id: person.id, isPublished: val })}
                  />
                </TableCell>
                <TableCell className="text-right">
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
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigate(`/admin/people/${person.id}/edit`)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedPerson(person);
                          setIntelModalOpen(true);
                        }}>
                          <BrainCircuit className="mr-2 h-4 w-4 text-rose-600" /> Log Intelligence
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`https://kph.ng/eminent/${person.slug}`, '_blank')}>
                          <ExternalLink className="mr-2 h-4 w-4" /> View on Portal
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem 
                          className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 font-bold"
                          onClick={() => deleteMutation.mutate(person.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Profile
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ImportModal 
        open={importModalOpen} 
        onOpenChange={setImportModalOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['people'] })}
      />

      <IntelligenceModal 
        person={selectedPerson}
        open={intelModalOpen}
        onOpenChange={setIntelModalOpen}
      />
    </div>
  );
};

export default People;

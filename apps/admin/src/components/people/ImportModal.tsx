import React, { useState } from 'react';
import Papa from 'papaparse';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertCircle, FileUp, CheckCircle2, Loader2, X, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedPerson {
  name: string;
  subCategory: string;
  state: string;
  title: string;
  bio: string;
  imageUrl?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  [key: string]: any;
}

const REQUIRED_FIELDS = ['name', 'subCategory', 'state', 'title', 'bio'] as const;

const CSV_TEMPLATE_HEADERS = [
  'name', 'subCategory', 'state', 'title', 'bio',
  'imageUrl', 'twitter', 'instagram', 'linkedin', 'facebook'
];

const CSV_SAMPLE_ROWS = [
  [
    'Abdulrahman AbdulRazaq', 'Political Icons', 'Kwara',
    'Executive Governor, Kwara State', 'A brief biography of the person goes here...',
    'https://example.com/photo.jpg', '@govkwara', '@govkwara', 'linkedin.com/in/govkwara', ''
  ],
  [
    'Bukola Saraki', 'Political Icons', 'Kwara',
    '3rd Senate President of Nigeria', 'Former Senate President of Nigeria...',
    '', '@bkolasaraki', '@bkolasaraki', '', ''
  ]
];

function downloadTemplate() {
  const csvContent = [
    CSV_TEMPLATE_HEADERS.join(','),
    ...CSV_SAMPLE_ROWS.map(row => row.map(v => `"${v}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kph_people_import_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function getMissingFields(row: ParsedPerson): string[] {
  return REQUIRED_FIELDS.filter(f => !row[f]?.trim());
}

function makeSlug(name: string): string {
  return name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
}

export const ImportModal: React.FC<ImportModalProps> = ({ open, onOpenChange, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ParsedPerson[]>([]);
  const [errors, setErrors] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        const parsed = results.data as ParsedPerson[];
        const errIndices: number[] = [];
        
        parsed.forEach((row, idx) => {
          if (getMissingFields(row).length > 0) errIndices.push(idx);
        });

        setData(parsed);
        setErrors(errIndices);
      },
      error: (err) => toast.error('Error parsing CSV: ' + err.message)
    });
  };

  const handleImport = async () => {
    if (data.length === 0 || errors.length === data.length) return;

    setImporting(true);
    try {
      const validData = data.filter((_, idx) => !errors.includes(idx));
      
      const payload = validData.map((person) => ({
        name: person.name.trim(),
        sub_category: person.subCategory.trim(),
        state: person.state.trim(),
        title: person.title.trim(),
        bio: person.bio.trim(),
        photo_url: person.imageUrl?.trim() || null,
        is_published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        slug: makeSlug(person.name),
        social_links: {
          twitter: person.twitter?.trim() || '',
          instagram: person.instagram?.trim() || '',
          linkedin: person.linkedin?.trim() || '',
          facebook: person.facebook?.trim() || ''
        }
      }));

      const { error } = await supabase.from('people').insert(payload);
      if (error) throw error;

      toast.success(`${validData.length} people imported successfully!`);
      if (errors.length > 0) {
        toast.warning(`${errors.length} rows were skipped due to missing required fields.`);
      }
      onSuccess();
      onOpenChange(false);
      reset();
    } catch (error: any) {
      console.error(error);
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setData([]);
    setErrors([]);
  };

  const validCount = data.length - errors.length;

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) reset(); }}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Bulk Import People</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Upload a <b>.csv</b> file with columns:{' '}
                <code className="bg-zinc-100 px-1 py-0.5 rounded text-[11px]">name, subCategory, state, title, bio</code>{' '}
                <span className="text-muted-foreground">(required)</span>{' and '}
                <code className="bg-zinc-100 px-1 py-0.5 rounded text-[11px]">imageUrl, twitter, instagram, linkedin, facebook</code>{' '}
                <span className="text-muted-foreground">(optional)</span>
              </p>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={downloadTemplate}>
                <Download className="h-3.5 w-3.5" />
                Download Template
              </Button>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-2">
          {!file ? (
            <div className="flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer relative min-h-[200px]">
              <input 
                type="file" 
                accept=".csv" 
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                onChange={handleFileUpload}
              />
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                <FileUp className="h-7 w-7" />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm text-kph-charcoal">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">Only .csv files are supported</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              {/* File Header */}
              <div className="flex items-center justify-between bg-zinc-100 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span className="text-sm font-bold truncate max-w-xs">{file.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">({data.length} rows)</span>
                </div>
                <div className="flex items-center gap-2">
                  {validCount > 0 && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] font-bold">
                      {validCount} Valid
                    </Badge>
                  )}
                  {errors.length > 0 && (
                    <Badge className="bg-rose-100 text-rose-700 border-none text-[10px] font-bold">
                      {errors.length} Errors
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={reset} className="h-7 w-7 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="border rounded-lg overflow-auto flex-1">
                <Table>
                  <TableHeader className="bg-zinc-50 sticky top-0">
                    <TableRow>
                      <TableHead className="w-12">Photo</TableHead>
                      <TableHead>Name / Title</TableHead>
                      <TableHead>Sub-Category</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Socials</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.slice(0, 15).map((row, idx) => {
                      const missing = getMissingFields(row);
                      const hasError = missing.length > 0;
                      return (
                        <TableRow key={idx} className={hasError ? 'bg-rose-50/60' : ''}>
                          <TableCell>
                            <Avatar className="h-9 w-9 border">
                              <AvatarImage src={row.imageUrl} alt={row.name} />
                              <AvatarFallback className="text-[9px] font-bold bg-neutral-100">
                                {row.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm">
                                {row.name || <span className="text-rose-400 italic text-xs">missing</span>}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                {row.title || <span className="text-rose-400 italic">missing</span>}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.subCategory || <span className="text-rose-400 italic">missing</span>}
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.state || <span className="text-rose-400 italic">missing</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {row.twitter && <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 border-sky-200 text-sky-600">TW</Badge>}
                              {row.instagram && <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 border-pink-200 text-pink-600">IG</Badge>}
                              {row.linkedin && <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 border-blue-200 text-blue-600">LI</Badge>}
                              {row.facebook && <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 border-indigo-200 text-indigo-600">FB</Badge>}
                              {!row.twitter && !row.instagram && !row.linkedin && !row.facebook && (
                                <span className="text-[10px] text-zinc-400">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {hasError ? (
                              <div className="flex items-start gap-1">
                                <AlertCircle className="h-3 w-3 text-rose-500 mt-0.5 shrink-0" />
                                <span className="text-[10px] font-bold text-rose-600 leading-tight">
                                  Missing: {missing.join(', ')}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">✓ Valid</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {data.length > 15 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-4 italic">
                          … and {data.length - 15} more rows not shown
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 font-bold uppercase text-[10px] tracking-widest px-8 gap-2"
            disabled={!file || validCount === 0 || importing}
            onClick={handleImport}
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              `Import ${validCount} ${validCount === 1 ? 'Person' : 'People'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MousePointerClick, Eye, TrendingUp, Zap, 
  RotateCcw, ExternalLink, Image as ImageIcon,
  LayoutTemplate, Sidebar, MonitorSmartphone,
  Loader2, Save, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────────
interface AdUnit {
  enabled: boolean;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  title?: string;
  stats: { clicks: number; impressions: number; lastUpdated: string };
}
interface AdConfig { homeBanner: AdUnit; sidebarAd: AdUnit; }

const DEFAULT_UNIT: AdUnit = {
  enabled: false, imageUrl: '', linkUrl: '#',
  altText: 'Advertisement', title: 'Sponsored Content',
  stats: { clicks: 0, impressions: 0, lastUpdated: new Date().toISOString() }
};
const DEFAULT_CONFIG: AdConfig = {
  homeBanner: { ...DEFAULT_UNIT },
  sidebarAd: { ...DEFAULT_UNIT }
};

// ── Helpers ────────────────────────────────────────────────────────────────────
async function fetchAdConfig(): Promise<AdConfig> {
  const { data, error } = await supabase
    .from('site_settings').select('value').eq('id', 'ads').single();
  if (error || !data) return DEFAULT_CONFIG;
  const cfg = data.value as any;
  return {
    homeBanner: { ...DEFAULT_UNIT, ...(cfg.homeBanner || {}) },
    sidebarAd:  { ...DEFAULT_UNIT, ...(cfg.sidebarAd  || {}) },
  };
}

async function saveAdConfig(config: AdConfig) {
  const { error } = await supabase.from('site_settings')
    .upsert({ id: 'ads', value: config as any });
  if (error) throw error;
}

function ctr(unit: AdUnit) {
  if (!unit.stats.impressions) return '0%';
  return ((unit.stats.clicks / unit.stats.impressions) * 100).toFixed(1) + '%';
}

// ── Sub-component: Ad Slot Editor ──────────────────────────────────────────────
interface SlotEditorProps {
  label: string;
  icon: React.ElementType;
  description: string;
  unit: AdUnit;
  onChange: (u: AdUnit) => void;
  saving: boolean;
  onSave: () => void;
  onResetStats: () => void;
}

const SlotEditor: React.FC<SlotEditorProps> = ({
  label, icon: Icon, description, unit, onChange, saving, onSave, onResetStats
}) => {
  const updateField = (field: keyof AdUnit, val: any) =>
    onChange({ ...unit, [field]: val });

  return (
    <Card className="border-none shadow-sm ring-1 ring-neutral-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kph-red/10 text-kph-red">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-serif text-lg">{label}</CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">
              {unit.enabled ? 'Live' : 'Paused'}
            </span>
            <Switch
              checked={unit.enabled}
              onCheckedChange={(v) => updateField('enabled', v)}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Impressions', value: unit.stats.impressions.toLocaleString(), icon: Eye, color: 'text-sky-600', bg: 'bg-sky-50' },
            { label: 'Clicks', value: unit.stats.clicks.toLocaleString(), icon: MousePointerClick, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'CTR', value: ctr(unit), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-3 text-center`}>
              <stat.icon className={`h-4 w-4 mx-auto mb-1 ${stat.color}`} />
              <div className={`text-xl font-black font-serif ${stat.color}`}>{stat.value}</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Creative */}
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Creative</p>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Image URL <span className="text-muted-foreground font-normal">(direct link to ad image)</span></Label>
            <Input
              placeholder="https://example.com/ad-banner.jpg"
              value={unit.imageUrl}
              onChange={(e) => updateField('imageUrl', e.target.value)}
            />
          </div>

          {unit.imageUrl && (
            <div className="relative rounded-xl overflow-hidden border bg-zinc-50 aspect-[4/1]">
              <img src={unit.imageUrl} alt="Ad preview" className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 bg-black/50 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Preview</div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Destination URL</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://advertiser.com/landing-page"
                value={unit.linkUrl}
                onChange={(e) => updateField('linkUrl', e.target.value)}
                className="flex-1"
              />
              {unit.linkUrl && unit.linkUrl !== '#' && (
                <Button variant="outline" size="icon" asChild>
                  <a href={unit.linkUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Ad Title <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                placeholder="Advertiser Name"
                value={unit.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Alt Text <span className="text-muted-foreground font-normal">(accessibility)</span></Label>
              <Input
                placeholder="Advertisement"
                value={unit.altText}
                onChange={(e) => updateField('altText', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground text-xs gap-1.5"
            onClick={onResetStats}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Stats
          </Button>
          <Button
            size="sm"
            className="bg-kph-red hover:bg-neutral-800 font-bold uppercase text-[10px] tracking-widest px-6 gap-2"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
const Ads: React.FC = () => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);

  const { data: config, isLoading, refetch } = useQuery({
    queryKey: ['ad-config'],
    queryFn: fetchAdConfig,
    staleTime: 30000,
  });

  const [localConfig, setLocalConfig] = React.useState<AdConfig | null>(null);
  const effectiveConfig = localConfig || config || DEFAULT_CONFIG;

  React.useEffect(() => {
    if (config && !localConfig) setLocalConfig(config);
  }, [config]);

  const handleSave = async (slot: 'homeBanner' | 'sidebarAd') => {
    if (!localConfig) return;
    setSaving(slot);
    try {
      await saveAdConfig(localConfig);
      queryClient.invalidateQueries({ queryKey: ['ad-config'] });
      toast.success(`${slot === 'homeBanner' ? 'Homepage Banner' : 'Sidebar Ad'} saved!`);
    } catch (e: any) {
      toast.error(`Failed to save: ${e.message}`);
    } finally {
      setSaving(null);
    }
  };

  const handleResetStats = async (slot: 'homeBanner' | 'sidebarAd') => {
    if (!localConfig) return;
    const updated: AdConfig = {
      ...localConfig,
      [slot]: {
        ...localConfig[slot],
        stats: { clicks: 0, impressions: 0, lastUpdated: new Date().toISOString() }
      }
    };
    setLocalConfig(updated);
    try {
      await saveAdConfig(updated);
      toast.success('Stats reset successfully');
    } catch (e: any) {
      toast.error(`Failed to reset stats: ${e.message}`);
    }
  };

  const totalImpressions = (effectiveConfig.homeBanner.stats.impressions || 0) + (effectiveConfig.sidebarAd.stats.impressions || 0);
  const totalClicks = (effectiveConfig.homeBanner.stats.clicks || 0) + (effectiveConfig.sidebarAd.stats.clicks || 0);
  const overallCtr = totalImpressions ? ((totalClicks / totalImpressions) * 100).toFixed(1) + '%' : '0%';
  const activeSlots = [effectiveConfig.homeBanner, effectiveConfig.sidebarAd].filter(u => u.enabled).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-kph-red" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-kph-charcoal">Ad Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Control all advertising slots across the KPH portal.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Slots', value: `${activeSlots} / 2`, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Impressions', value: totalImpressions.toLocaleString(), icon: Eye, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Total Clicks', value: totalClicks.toLocaleString(), icon: MousePointerClick, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Overall CTR', value: overallCtr, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(stat => (
          <Card key={stat.label} className="border-none shadow-sm ring-1 ring-neutral-200 overflow-hidden">
            <div className={`h-1 w-full ${stat.bg}`} />
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className={`font-serif text-2xl font-black ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Slot Editors */}
      <div className="space-y-6">
        {localConfig && (
          <>
            <SlotEditor
              label="Homepage Hero Banner"
              icon={LayoutTemplate}
              description="Full-width banner displayed below the breaking news ticker on the homepage"
              unit={localConfig.homeBanner}
              onChange={(u) => setLocalConfig({ ...localConfig, homeBanner: u })}
              saving={saving === 'homeBanner'}
              onSave={() => handleSave('homeBanner')}
              onResetStats={() => handleResetStats('homeBanner')}
            />

            <SlotEditor
              label="Sidebar Advertisement"
              icon={Sidebar}
              description="Square / tall ad displayed in the sidebar on article listing and detail pages"
              unit={localConfig.sidebarAd}
              onChange={(u) => setLocalConfig({ ...localConfig, sidebarAd: u })}
              saving={saving === 'sidebarAd'}
              onSave={() => handleSave('sidebarAd')}
              onResetStats={() => handleResetStats('sidebarAd')}
            />
          </>
        )}
      </div>

      {/* Info Notice */}
      <Card className="border-none shadow-sm ring-1 ring-neutral-200 bg-zinc-50">
        <CardContent className="pt-6 pb-5">
          <div className="flex items-start gap-4">
            <MonitorSmartphone className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-bold text-kph-charcoal">How ads work on KPH</p>
              <p>Ads are stored in the <code className="bg-neutral-200 px-1 rounded">site_settings</code> table under the key <code className="bg-neutral-200 px-1 rounded">ads</code>. Enable a slot and provide a valid image URL and destination link — it will go live instantly on the public site with no deployment required.</p>
              <p className="mt-2">Impressions are counted each time the ad is rendered. Clicks are counted when the user taps/clicks the ad. Both are stored in the same settings record.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Ads;

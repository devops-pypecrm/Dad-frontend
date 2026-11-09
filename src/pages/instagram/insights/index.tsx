import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InstagramPage } from '@/components/instagram/InstagramPage';
import { InstagramConnectionGate } from '@/components/instagram/InstagramConnectionGate';
import { PermissionNotice } from '@/components/instagram/tools/PermissionNotice';
import { IgAvatar } from '@/components/instagram/inbox/IgAvatar';
import { IG } from '@/components/instagram/inbox/ig';
import { igToolsApi, type IgMedia } from '@/services/instagramToolsService';
import { apiErrorMessage } from '@/lib/apiError';

const n = (v?: number) => (v === undefined || v === null ? '—' : v >= 10000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString());
const Tile = ({ l, v }: { l: string; v?: number }) => <div className="rounded-xl border p-4" style={{ borderColor: IG.line }}><p className="text-[12px]" style={{ color: IG.sub }}>{l}</p><p className="text-[26px] font-semibold leading-8" style={{ color: IG.text }}>{n(v)}</p></div>;
const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="rounded-xl border p-5" style={{ borderColor: IG.line }}><h3 className="mb-3 text-[15px] font-semibold" style={{ color: IG.text }}>{title}</h3>{children}</section>;
const Note = ({ children }: { children: React.ReactNode }) => <p className="py-6 text-center text-[13px]" style={{ color: IG.sub }}>{children}</p>;

function PostGrid({ posts }: { posts: IgMedia[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {posts.map(p => (
        <a key={p.id} href={p.permalink} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border" style={{ borderColor: IG.line }}>
          <div className="aspect-square bg-[#efefef]">{(p.thumbnail_url || p.media_url) && <img src={p.thumbnail_url || p.media_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />}</div>
          <div className="space-y-0.5 p-3 text-[12px]" style={{ color: IG.sub }}>
            <p className="line-clamp-2" style={{ color: IG.text }}>{p.caption || 'No caption'}</p>
            <p>♥ {n(p.like_count)} · 💬 {n(p.comments_count)}{p.insights?.reach !== undefined && <> · 👁 {n(p.insights.reach)}</>}</p>
            {p.insights && <p>Saves {n(p.insights.saved)} · Shares {n(p.insights.shares)}</p>}
          </div>
        </a>
      ))}
    </div>
  );
}

function Overview() {
  const [days, setDays] = useState(30);
  const q = useQuery({ queryKey: ['ig-tools', 'insights', days], queryFn: () => igToolsApi.insights(days), retry: false });
  const d = q.data;
  return (
    <div className="space-y-5">
      <PermissionNotice need="insights" />
      <div className="flex items-center justify-between">
        <p className="text-[13px]" style={{ color: IG.sub }}>Instagram reports the last 30 days at most.</p>
        <Select value={String(days)} onValueChange={v => setDays(Number(v))}><SelectTrigger className="h-9 w-[130px] text-sm"><SelectValue /></SelectTrigger><SelectContent>{[7, 14, 30].map(x => <SelectItem key={x} value={String(x)}>Last {x} days</SelectItem>)}</SelectContent></Select>
      </div>
      {q.error ? <Note>{apiErrorMessage(q.error, 'Could not load insights')}</Note> : q.isLoading || !d ? <Note>Loading…</Note> : <>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile l="Followers" v={d.profile.followers_count} /><Tile l="Posts" v={d.profile.media_count} /><Tile l="Accounts reached" v={d.totals.reach} /><Tile l="Views" v={d.totals.views} />
          <Tile l="Profile views" v={d.totals.profile_views} /><Tile l="Accounts engaged" v={d.totals.accounts_engaged} /><Tile l="Interactions" v={d.totals.total_interactions} /><Tile l="Net follows" v={d.totals.follows_and_unfollows} />
        </div>
        {d.permissionHint && <Note>{d.permissionHint}</Note>}
        <Panel title="Reach per day">
          {!d.series.ok ? <Note>{d.series.error}</Note> : <div className="h-56"><ResponsiveContainer width="100%" height="100%"><AreaChart data={d.series.data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={x => x.slice(5)} /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} /><Tooltip /><Area type="monotone" dataKey="reach" stroke={IG.blue} fill={IG.blue} fillOpacity={0.15} /></AreaChart></ResponsiveContainer></div>}
        </Panel>
        <div className="grid gap-4 md:grid-cols-2">
          {(['age', 'gender', 'country', 'city'] as const).map(k => {
            const r = d.demographics[k];
            return <Panel key={k} title={`Followers by ${k}`}>{!r.ok ? <Note>Needs at least 100 followers, or the permission is missing.</Note> : r.data.length === 0 ? <Note>No data yet.</Note> : <div className="h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={r.data} layout="vertical"><XAxis type="number" hide /><YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill={IG.blue} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>}</Panel>;
          })}
        </div>
      </>}
    </div>
  );
}

function TopPosts() {
  const q = useQuery({ queryKey: ['ig-tools', 'top'], queryFn: igToolsApi.topMedia, retry: false });
  return <div className="space-y-4"><PermissionNotice need="insights" />{q.error ? <Note>{apiErrorMessage(q.error, 'Could not load posts')}</Note> : q.isLoading ? <Note>Loading…</Note> : <PostGrid posts={q.data || []} />}</div>;
}

function Competitors() {
  const [u, setU] = useState('');
  const m = useMutation({ mutationFn: () => igToolsApi.discover(u), onError: e => toast.error(apiErrorMessage(e, 'Lookup failed')) });
  const d = m.data;
  return (
    <div className="space-y-5">
      <p className="text-[13px]" style={{ color: IG.sub }}>Look up any public business or creator account to compare followers and engagement. Instagram only shares public numbers.</p>
      <form className="flex max-w-md items-center gap-2" onSubmit={e => { e.preventDefault(); if (u.trim()) m.mutate(); }}>
        <div className="flex h-10 flex-1 items-center gap-2 rounded-lg px-3" style={{ background: IG.soft }}><Search className="h-4 w-4" style={{ color: IG.sub }} /><input className="ig-bare flex-1 text-[14px]" placeholder="username" value={u} onChange={e => setU(e.target.value)} /></div>
        <button type="submit" disabled={m.isPending} className="rounded-lg px-4 py-2 text-[14px] font-semibold text-white disabled:opacity-50" style={{ background: IG.blue }}>{m.isPending ? 'Looking…' : 'Look up'}</button>
      </form>
      {d && <>
        <div className="flex items-center gap-4"><IgAvatar src={d.profile_picture_url} name={d.username} className="h-16 w-16" /><div><p className="text-[16px] font-semibold" style={{ color: IG.text }}>@{d.username}</p><p className="text-[13px]" style={{ color: IG.sub }}>{d.name}</p></div></div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Tile l="Followers" v={d.followers_count} /><Tile l="Posts" v={d.media_count} /><Tile l="Avg. engagement / post" v={d.avgEngagementPerPost} /><Tile l="Engagement rate %" v={d.engagementRatePct ?? undefined} /></div>
        <PostGrid posts={d.media} />
      </>}
    </div>
  );
}

export default function InstagramInsights() {
  return (
    <InstagramPage title="Insights" subtitle="Reach, audience, top posts and competitor benchmarks">
      <InstagramConnectionGate returnPath="/instagram/insights">
        <Tabs defaultValue="overview" className="space-y-5">
          <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="top">Top posts</TabsTrigger><TabsTrigger value="competitors">Competitors</TabsTrigger></TabsList>
          <TabsContent value="overview"><Overview /></TabsContent>
          <TabsContent value="top"><TopPosts /></TabsContent>
          <TabsContent value="competitors"><Competitors /></TabsContent>
        </Tabs>
      </InstagramConnectionGate>
    </InstagramPage>
  );
}

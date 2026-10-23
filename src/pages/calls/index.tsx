import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { formatIST } from '@/lib/dateUtils';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Search,
  Download,
  Trash2,
  Clock,
  Mic,
  ChevronLeft,
  ChevronRight,
  Building,
  User2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCalls, getCallStats, deleteCallRecording, type Call, type CallFilters } from '@/services/callService';
import { getBranches } from '@/services/settingsService';
import { getUsers } from '@/services/userService';
import { CallRecordingPlayer } from '@/components/CallRecordingPlayer';
import { api } from '@/services/api';
import { isAdmin } from '@/utils/roleUtils';
import { DateRangeDropdown, getDefaultDateRange, type DateRangeValue } from '@/components/dashboard-v2/DateRangeDropdown';

export default function CallsPage() {
  const queryClient = useQueryClient();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userIsAdmin = isAdmin(userInfo);

  const [filters, setFilters] = useState<CallFilters>({
    page: 1,
    limit: 15,
    direction: 'all',
    status: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [range, setRange] = useState<DateRangeValue>(getDefaultDateRange());

  const effectiveFilters: CallFilters = {
    ...filters,
    startDate: range.period !== 'allTime' ? range.startDate : undefined,
    endDate: range.period !== 'allTime' ? range.endDate : undefined,
  };

  const { data: callsData, isLoading } = useQuery({
    queryKey: ['calls', effectiveFilters, searchQuery],
    queryFn: () => getCalls({ ...effectiveFilters, search: searchQuery || undefined })
  });

  const { data: stats } = useQuery({
    queryKey: ['callStats', range, filters.userId],
    queryFn: () => {
      if (range.period === 'allTime') return getCallStats('allTime', filters.userId);
      if (range.startDate && range.endDate) {
        return getCallStats('custom', filters.userId, { startDate: range.startDate, endDate: range.endDate });
      }
      return getCallStats('allTime', filters.userId);
    }
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers()
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => getBranches()
  });

  const users = usersData?.users || [];
  const branchesList = branchesData || [];
  const showUserFilter = users.length > 1;

  const deleteMutation = useMutation({
    mutationFn: deleteCallRecording,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      toast.success('Recording deleted');
    },
    onError: () => {
      toast.error('Failed to delete recording');
    }
  });

  const handleFilterChange = (key: keyof CallFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleDownload = async (recordingUrl: string) => {
    try {
      const filename = recordingUrl.split('/').pop();
      const response = await api.get(`/calls/recording/${filename}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'recording.webm';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download recording');
    }
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'inbound'
      ? <PhoneIncoming className="h-3.5 w-3.5 text-emerald-600" />
      : <PhoneOutgoing className="h-3.5 w-3.5 text-primary" />;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px]">Completed</Badge>;
      case 'missed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">Missed</Badge>;
      case 'busy':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px]">Busy</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">Failed</Badge>;
      case 'initiated':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">In Progress</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status || 'Unknown'}</Badge>;
    }
  };

  const formatDuration = (minutes?: number, seconds?: number) => {
    if (seconds !== undefined && seconds !== null && seconds > 0) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    if (!minutes || minutes <= 0) return '-';
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getContactName = (call: Call) => {
    let name = 'Unknown';
    let company = '';

    if (call.lead) {
      name = `${call.lead.firstName} ${call.lead.lastName || ''}`.trim();
      company = call.lead.company || '';
    } else if (call.contact) {
      name = `${call.contact.firstName} ${call.contact.lastName || ''}`.trim();
    }

    return { name, company };
  };

  return (
    <div className="bg-white min-h-screen p-4 sm:p-8 space-y-6 animate-in fade-in duration-300 font-poppins">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Phone className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Call Logs
            </h1>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 ml-11">
            View and manage all call recordings across your organisation.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <DateRangeDropdown
            value={range}
            onChange={setRange}
            variant="accent"
            presets={['today', 'yesterday', 'week', 'thisMonth', 'lastMonth', 'custom', 'allTime']}
          />
          {userIsAdmin && (
            <Link to="/settings/call-recording">
              <Button variant="outline" size="sm" className="h-9 rounded-[10px] text-xs">
                <Phone className="h-3.5 w-3.5 mr-1.5" />
                Recording Settings
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-[14px] border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Calls</span>
            <div className="h-8 w-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center">
              <Phone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {stats?.totalCalls ?? '-'}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">In the selected period</p>
        </div>

        <div className="rounded-[14px] border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Duration</span>
            <div className="h-8 w-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {formatDuration(stats?.avgDuration)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">minutes:seconds</p>
        </div>

        <div className="rounded-[14px] border border-destructive/20 bg-destructive/5 p-4 sm:p-5 shadow-xs transition-all hover:border-destructive/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-destructive uppercase tracking-wider">Missed Calls</span>
            <div className="h-8 w-8 rounded-[10px] bg-destructive/15 text-destructive flex items-center justify-center">
              <PhoneMissed className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-destructive">
            {stats?.missedCalls ?? '-'}
          </div>
          <p className="text-[11px] text-destructive/80 mt-1">
            {stats?.totalCalls ? ((stats.missedCalls / stats.totalCalls) * 100).toFixed(0) : 0}% of total
          </p>
        </div>

        <div className="rounded-[14px] border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 shadow-xs transition-all hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Recordings</span>
            <div className="h-8 w-8 rounded-[10px] bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <Mic className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
            {stats?.callsWithRecording ?? '-'}
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-1">calls with recordings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-[14px] border border-border/60 bg-card p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              className="pl-9 h-9 text-xs rounded-[10px] bg-background border-border/60 focus-visible:ring-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={filters.direction}
            onValueChange={(v) => handleFilterChange('direction', v)}
          >
            <SelectTrigger className="w-full md:w-[150px] h-9 text-xs rounded-[10px] bg-background border-border/60">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directions</SelectItem>
              <SelectItem value="inbound">Inbound</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.status}
            onValueChange={(v) => handleFilterChange('status', v)}
          >
            <SelectTrigger className="w-full md:w-[150px] h-9 text-xs rounded-[10px] bg-background border-border/60">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.branchId || 'all'}
            onValueChange={(v) => handleFilterChange('branchId', v)}
          >
            <SelectTrigger className="w-full md:w-[150px] h-9 text-xs rounded-[10px] bg-background border-border/60">
              <div className="flex items-center gap-2">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="All Branches" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branchesList.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showUserFilter && (
            <Select
              value={filters.userId || 'all'}
              onValueChange={(v) => handleFilterChange('userId', v)}
            >
              <SelectTrigger className="w-full md:w-[180px] h-9 text-xs rounded-[10px] bg-background border-border/60">
                <div className="flex items-center gap-2">
                  <User2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="All Agents" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {users.map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Call Log Table */}
      <div className="rounded-[14px] border border-border/70 bg-card overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Dir</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Recording</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {callsData?.calls.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <div className="space-y-3">
                          <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground">
                            <Phone className="h-6 w-6" />
                          </div>
                          <h3 className="text-base font-semibold text-foreground">No calls found</h3>
                          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            No calls matched the selected filters or date range.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    callsData?.calls.map((call) => (
                      <tr key={call.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-medium text-foreground text-xs">
                            {formatIST(call.date, 'MMM d, yyyy')}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {formatIST(call.date, 'h:mm a')}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {getDirectionIcon(call.direction)}
                        </td>
                        <td className="py-3.5 px-4">
                          {(() => {
                            const { name, company } = getContactName(call);
                            return (
                              <>
                                <span className="font-semibold text-[13px] text-foreground">{name}</span>
                                {company && (
                                  <div className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[160px]">{company}</div>
                                )}
                              </>
                            );
                          })()}
                          {call.createdBy && (
                            <div className="text-[10px] text-muted-foreground/80 mt-0.5">
                              by {call.createdBy.firstName} {call.createdBy.lastName}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-foreground">
                          {call.phoneNumber || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-foreground">
                          {formatDuration(call.duration, call.recordingDuration)}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(call.callStatus)}
                        </td>
                        <td className="py-3.5 px-4">
                          {call.recordingUrl ? (
                            <CallRecordingPlayer
                              recordingUrl={call.recordingUrl}
                              duration={call.recordingDuration}
                            />
                          ) : (
                            <span className="text-[11px] text-muted-foreground">No recording</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex gap-1 justify-end">
                            {call.recordingUrl && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground rounded-[8px]"
                                  onClick={() => handleDownload(call.recordingUrl!)}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-[8px]"
                                  onClick={() => {
                                    if (confirm('Delete this recording?')) {
                                      deleteMutation.mutate(call.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {callsData && callsData.pagination.totalPages > 1 && (
              <div className="p-3.5 px-4 border-t border-border/50 flex items-center justify-between bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  Showing {((callsData.pagination.page - 1) * callsData.pagination.limit) + 1} to{' '}
                  {Math.min(callsData.pagination.page * callsData.pagination.limit, callsData.pagination.total)} of{' '}
                  {callsData.pagination.total} calls
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={callsData.pagination.page === 1}
                    onClick={() => handlePageChange(callsData.pagination.page - 1)}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={callsData.pagination.page >= callsData.pagination.totalPages}
                    onClick={() => handlePageChange(callsData.pagination.page + 1)}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

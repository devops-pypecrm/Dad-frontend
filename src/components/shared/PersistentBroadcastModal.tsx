import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markAsRead } from '@/services/notificationService';
import { socketService } from '@/services/socketService';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, ShieldAlert, AlertTriangle, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

const SEVERITY_STYLES: Record<string, {
  Icon: typeof Bell;
  iconWrap: string;
  ping: string;
  topBar: string;
  button: string;
}> = {
  info: {
    Icon: Bell,
    iconWrap: 'bg-indigo-500/10 text-indigo-400',
    ping: 'bg-indigo-400/20',
    topBar: 'from-violet-600 via-indigo-500 to-purple-600',
    button: 'from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-indigo-600/20 hover:shadow-indigo-600/40 border-indigo-500/30',
  },
  warning: {
    Icon: AlertTriangle,
    iconWrap: 'bg-amber-500/10 text-amber-400',
    ping: 'bg-amber-400/20',
    topBar: 'from-amber-500 via-orange-500 to-amber-600',
    button: 'from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/20 hover:shadow-amber-600/40 border-amber-500/30',
  },
  critical: {
    Icon: ShieldAlert,
    iconWrap: 'bg-red-500/10 text-red-400',
    ping: 'bg-red-400/20',
    topBar: 'from-red-600 via-rose-500 to-red-600',
    button: 'from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-600/20 hover:shadow-red-600/40 border-red-500/30',
  },
  update: {
    Icon: Sparkles,
    iconWrap: 'bg-emerald-500/10 text-emerald-400',
    ping: 'bg-emerald-400/20',
    topBar: 'from-emerald-600 via-green-500 to-emerald-600',
    button: 'from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-emerald-600/20 hover:shadow-emerald-600/40 border-emerald-500/30',
  },
};

export function PersistentBroadcastModal() {
  const queryClient = useQueryClient();
  const [currentNotifIndex, setCurrentNotifIndex] = useState(0);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  // Fetch unread popup notifications
  const { data, refetch } = useQuery({
    queryKey: ['unread-popup-notifications'],
    queryFn: async () => {
      try {
        const res = await getNotifications(1, 'popup', false);
        return res;
      } catch (err) {
        const status = (err as any).response?.status;
        if (status !== 401) {
          console.error('Error fetching popup notifications:', err);
        }
        return { notifications: [] };
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

  const notifications = (data?.notifications || []).filter(
    (n: any) => !(n.title && n.title.includes('New Lead Assigned'))
  );
  const currentNotif = notifications[currentNotifIndex];

  // Socket listener for real-time popups
  useEffect(() => {
    const handleNewNotification = (notif: any) => {
      if (notif && notif.type === 'popup') {
        refetch();
      }
    };

    socketService.on('notification', handleNewNotification);
    return () => {
      socketService.off('notification');
    };
  }, [refetch]);

  // Adjust index when notifications list updates
  useEffect(() => {
    if (currentNotifIndex >= notifications.length && notifications.length > 0) {
      setCurrentNotifIndex(notifications.length - 1);
    }
  }, [notifications.length, currentNotifIndex]);

  // Mutation to mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await markAsRead(id);
    },
    onSuccess: () => {
      // Invalidate queries to sync with Bell count and popups list
      queryClient.invalidateQueries({ queryKey: ['unread-popup-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      refetch();
    },
  });

  const handleMarkAsRead = () => {
    if (currentNotif) {
      markAsReadMutation.mutate(currentNotif.id);
    }
  };

  // Detects whether the message body is actually scrollable, and whether
  // there's more content below the current scroll position, so we can show
  // a "scroll for more" hint - otherwise longer broadcasts silently hide
  // content below the fold with no indication there's more to read.
  const checkOverflow = () => {
    const el = messageRef.current;
    if (!el) return;
    setHasMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  };

  useEffect(() => {
    checkOverflow();
  }, [currentNotif?.id]);

  if (notifications.length === 0 || !currentNotif) {
    return null;
  }

  const isLast = currentNotifIndex === notifications.length - 1;
  const severity = SEVERITY_STYLES[currentNotif.severity] ? currentNotif.severity : 'info';
  const style = SEVERITY_STYLES[severity];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop overlay (non-dismissible) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Panel container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className={cn(
            "relative w-full max-w-lg overflow-hidden rounded-2xl border bg-slate-900/90 shadow-2xl backdrop-blur-xl",
            "border-slate-800 text-slate-100",
            "before:absolute before:inset-0 before:pointer-events-none before:rounded-2xl before:border before:border-white/5 before:bg-gradient-to-b before:from-white/10 before:to-transparent"
          )}
        >
          {/* Top glow border */}
          <div className={cn("absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r", style.topBar)} />

          {/* Modal Content */}
          <div className="p-6 sm:p-8 flex flex-col items-center text-center">
            {/* Pulsing Animated Icon */}
            <div className={cn("relative mb-5 flex h-16 w-16 items-center justify-center rounded-full", style.iconWrap)}>
              <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", style.ping)} />
              <style.Icon className="h-8 w-8 stroke-[1.5]" />
            </div>

            {/* Notification Badge / Index */}
            {notifications.length > 1 && (
              <div className="mb-3 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/20">
                Notification {currentNotifIndex + 1} of {notifications.length}
              </div>
            )}

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-3">
              {currentNotif.title}
            </h3>

            {/* Message Body - relative wrapper so the "more below" fade/hint
                can sit over the scroll area without shifting layout. */}
            <div className="relative w-full mb-8">
              <div
                ref={messageRef}
                onScroll={checkOverflow}
                className="text-sm sm:text-base text-slate-300 leading-relaxed max-h-60 overflow-y-auto pr-2 w-full text-left whitespace-pre-line scrollbar-thin"
              >
                {currentNotif.message}
              </div>
              {hasMoreBelow && (
                <div className="pointer-events-none absolute bottom-0 inset-x-0 flex flex-col items-center">
                  <div className="h-8 w-full bg-gradient-to-t from-slate-900/95 to-transparent" />
                  <ChevronDown className="h-4 w-4 text-slate-400 -mt-1 animate-bounce" />
                </div>
              )}
            </div>

            {/* Actions Panel */}
            <div className="flex w-full flex-col gap-3">
              <Button
                onClick={handleMarkAsRead}
                disabled={markAsReadMutation.isPending}
                className={cn(
                  "w-full h-12 text-sm font-semibold tracking-wide text-white rounded-xl shadow-lg transition-all duration-300 bg-gradient-to-r",
                  style.button,
                  "border flex items-center justify-center gap-2"
                )}
              >
                {markAsReadMutation.isPending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Mark as Read
                  </>
                )}
              </Button>

              {/* Next/Carousel option if multiple notifications exist */}
              {notifications.length > 1 && !isLast && (
                <button
                  onClick={() => setCurrentNotifIndex(prev => prev + 1)}
                  className="text-xs font-medium text-slate-400 hover:text-indigo-400 flex items-center justify-center gap-1 transition-colors self-center py-2 cursor-pointer"
                >
                  Skip to next <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// WhatsApp Web look: colours and wallpaper used by the Team Inbox.
export const WA = {
  font: '"Segoe UI", "Helvetica Neue", Helvetica, "Lucida Grande", Arial, Ubuntu, Cantarell, "Fira Sans", sans-serif',
  panel: '#f0f2f5',        // header / composer / empty-state grey
  chat: '#efeae2',         // chat wallpaper
  out: '#d9fdd3',          // outgoing bubble
  inn: '#ffffff',          // incoming bubble
  text: '#111b21',
  sub: '#667781',
  icon: '#54656f',
  line: '#e9edef',
  green: '#00a884',
  greenDark: '#008069',
  unread: '#25d366',
  tick: '#53bdeb',
  selected: '#f0f2f5',
  hover: '#f5f6f6',
  pill: 'rgba(255,255,255,0.92)',
  notice: '#ffeecd',
} as const;

// Subtle doodle tile like WhatsApp's wallpaper (inline SVG, no asset needed).
const doodle = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='#0b141a' stroke-opacity='0.06' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'><circle cx='18' cy='20' r='5'/><path d='M60 14l6 10h-12z'/><path d='M96 18c4-6 12-2 8 5l-8 8-8-8c-4-7 4-11 8-5z'/><rect x='14' y='62' width='14' height='10' rx='2'/><path d='M58 64q6-8 12 0t12 0'/><circle cx='100' cy='70' r='3'/><path d='M22 100l8 8M30 100l-8 8'/><path d='M62 98h16M62 104h10'/><circle cx='102' cy='104' r='6'/></g></svg>`
);
export const CHAT_WALLPAPER = `url("data:image/svg+xml,${doodle}")`;

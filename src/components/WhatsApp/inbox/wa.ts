// WhatsApp Web look: colours and wallpaper used by the Team Inbox.
export const WA = {
  font: '"Segoe UI", "Helvetica Neue", Helvetica, "Lucida Grande", Arial, Ubuntu, Cantarell, "Fira Sans", sans-serif',
  panel: 'var(--wa-panel)',
  chat: 'var(--wa-chat)',
  out: 'var(--wa-out)',
  inn: 'var(--wa-in)',
  text: 'var(--wa-text)',
  sub: 'var(--wa-sub)',
  icon: 'var(--wa-icon)',
  line: 'var(--wa-line)',
  header: 'var(--wa-header)',
  green: '#128C7E',        // teal accent / buttons
  greenDark: '#075E54',
  unread: '#25D366',       // brand green: badges, active highlights
  tick: '#53bdeb',
  selected: 'var(--wa-selected)',
  hover: 'var(--wa-hover)',
  pill: 'var(--wa-pill)',
  notice: 'var(--wa-notice)',
} as const;

// Subtle doodle tile like WhatsApp's wallpaper (inline SVG, no asset needed).
const doodle = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='#0b141a' stroke-opacity='0.06' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'><circle cx='18' cy='20' r='5'/><path d='M60 14l6 10h-12z'/><path d='M96 18c4-6 12-2 8 5l-8 8-8-8c-4-7 4-11 8-5z'/><rect x='14' y='62' width='14' height='10' rx='2'/><path d='M58 64q6-8 12 0t12 0'/><circle cx='100' cy='70' r='3'/><path d='M22 100l8 8M30 100l-8 8'/><path d='M62 98h16M62 104h10'/><circle cx='102' cy='104' r='6'/></g></svg>`
);
export const CHAT_WALLPAPER = `url("data:image/svg+xml,${doodle}")`;

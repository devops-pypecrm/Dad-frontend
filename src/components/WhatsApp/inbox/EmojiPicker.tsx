const EMOJIS = ['😀','😁','😂','🤣','😊','😍','🥰','😘','😉','😎','🤔','😅','🙂','🙃','😇','🤗','😢','😭','😡','😴','👍','👎','👏','🙏','💪','👌','✌️','🤝','👋','🎉','🔥','✨','❤️','💙','💚','💯','✅','❌','⭐','📞','📅','📍','💰','🎁','📷','📎','⏰','🙌'];

/** Compact emoji tray that opens above the composer. */
export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <div className="absolute bottom-full left-0 z-20 mb-2 w-[300px] rounded-xl bg-white p-2 shadow-[0_2px_8px_rgba(11,20,26,0.25)]">
      <div className="grid grid-cols-8 gap-0.5">
        {EMOJIS.map(e => <button key={e} type="button" onClick={() => onPick(e)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[22px] hover:bg-[#f0f2f5]">{e}</button>)}
      </div>
    </div>
  );
}

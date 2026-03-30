'use client';
interface AnnouncementBarProps {
  text: string;
  linkText?: string;
  onLinkClick?: () => void;
}

export function AnnouncementBar({ text, linkText, onLinkClick }: AnnouncementBarProps) {
  return (
    <div className="w-full bg-alonzo-black text-white text-center py-2.5 text-2xs tracking-wider">
      {text}
      {linkText && (
        <button
          onClick={onLinkClick}
          className="underline ml-1 font-semibold hover:opacity-80 transition-opacity"
        >
          {linkText}
        </button>
      )}
    </div>
  );
}

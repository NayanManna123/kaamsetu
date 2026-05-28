export default function NotificationBadge({ count = 0 }) {
  if (!count || count <= 0) return null;

  return (
    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-danger-500 rounded-full animate-badge-pulse shadow-sm">
      {count > 99 ? '99+' : count}
    </span>
  );
}

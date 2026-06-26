export default function Loading() {
  return (
    <div className="page-container animate-pulse space-y-4">
      <div className="space-y-2">
        <div className="h-8 w-48 skeleton rounded-xl" />
        <div className="h-4 w-64 skeleton rounded-lg" />
      </div>
      <div className="h-14 skeleton rounded-2xl" />
      <div className="h-[52px] skeleton rounded-2xl" />
      <div className="space-y-3">
        <div className="h-28 skeleton rounded-[20px]" />
        <div className="h-28 skeleton rounded-[20px]" />
        <div className="h-28 skeleton rounded-[20px]" />
      </div>
    </div>
  );
}

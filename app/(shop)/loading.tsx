import { ProductGridSkeleton, Skeleton } from "@/components/ui/StateViews";

export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pt-4">
      <Skeleton className="h-12 w-full rounded-2xl" />
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-20 shrink-0 rounded-2xl" />
        ))}
      </div>
      <ProductGridSkeleton count={4} />
    </div>
  );
}

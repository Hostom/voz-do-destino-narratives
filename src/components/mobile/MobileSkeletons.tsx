import { Skeleton } from "@/components/ui/skeleton";

export const MessageSkeleton = () => (
  <div className="space-y-3 p-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    ))}
  </div>
);

export const InventoryItemSkeleton = () => (
  <div className="grid grid-cols-2 gap-3 p-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="p-3 rounded-lg border border-border bg-card/50">
        <Skeleton className="h-10 w-10 rounded mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    ))}
  </div>
);

export const CharacterStatsSkeleton = () => (
  <div className="p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-5 w-20" />
    </div>
    <Skeleton className="h-3 w-full rounded-full" />
    <Skeleton className="h-3 w-3/4 rounded-full" />
    <div className="grid grid-cols-3 gap-2 mt-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="text-center">
          <Skeleton className="h-8 w-8 mx-auto rounded" />
          <Skeleton className="h-3 w-12 mx-auto mt-1" />
        </div>
      ))}
    </div>
  </div>
);

export const DicePanelSkeleton = () => (
  <div className="p-4 space-y-4">
    <div className="grid grid-cols-4 gap-3">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
    <Skeleton className="h-24 w-full rounded-lg" />
  </div>
);

export const ChatSkeleton = () => (
  <div className="space-y-3 p-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[70%] ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className={`h-10 rounded-lg ${i % 2 === 0 ? 'w-32' : 'w-40'}`} />
        </div>
      </div>
    ))}
  </div>
);

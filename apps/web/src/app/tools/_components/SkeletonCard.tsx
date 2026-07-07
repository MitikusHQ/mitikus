import { cn } from '@/lib/utils'

function Bone({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} />
}

export function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-xl border bg-card overflow-hidden">
      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Icon + badges row */}
        <div className="flex items-start justify-between gap-2">
          <Bone className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex gap-1.5">
            <Bone className="w-12 h-5 rounded-full" />
            <Bone className="w-16 h-5 rounded-full" />
          </div>
        </div>
        {/* Name */}
        <Bone className="h-5 w-3/4" />
        {/* Description */}
        <div className="space-y-1.5">
          <Bone className="h-3.5 w-full" />
          <Bone className="h-3.5 w-5/6" />
        </div>
        {/* Meta */}
        <div className="flex gap-3">
          <Bone className="h-3 w-14" />
          <Bone className="h-3 w-20" />
        </div>
        {/* Caps */}
        <div className="flex gap-1">
          <Bone className="h-4 w-16 rounded-full" />
          <Bone className="h-4 w-20 rounded-full" />
          <Bone className="h-4 w-12 rounded-full" />
        </div>
      </div>
      {/* Footer */}
      <div className="border-t px-5 py-3 flex justify-between items-center bg-muted/20">
        <Bone className="h-4 w-14" />
        <Bone className="h-4 w-4 rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

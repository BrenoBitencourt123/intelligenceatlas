import { Skeleton } from '@/components/ui/skeleton';
import { MainLayout } from '@/components/layout/MainLayout';

export const EssaySkeleton = () => (
  <MainLayout>
    <div className="min-h-screen bg-background">
      <main className="container max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-[62%] space-y-4">
            {/* Pedagogical section */}
            <Skeleton className="h-48 rounded-lg" />
            
            {/* Action buttons */}
            <div className="flex gap-2 py-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-32" />
            </div>
            
            {/* Block cards */}
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-40 rounded-lg" />
          </div>
          
          <div className="hidden lg:block lg:w-[38%]">
            <Skeleton className="h-96 rounded-lg" />
          </div>
        </div>
      </main>
    </div>
  </MainLayout>
);

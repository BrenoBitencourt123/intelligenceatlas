import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';

export const ProfileSkeleton = () => (
  <MainLayout>
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Skeleton className="h-8 w-32 mb-6" />
      
      {/* Avatar Section Skeleton */}
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-40 mt-1" />
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardContent>
      </Card>

      {/* Personal Info Skeleton */}
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>

      {/* Plan Skeleton */}
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-16 mb-2" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>

      {/* Security Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  </MainLayout>
);

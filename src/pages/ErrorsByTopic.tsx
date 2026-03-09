import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { TopicMap } from '@/components/objectives/TopicMap';

export default function ErrorsByTopic() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-8 pb-24">
        {user && <TopicMap userId={user.id} />}
      </div>
    </MainLayout>
  );
}

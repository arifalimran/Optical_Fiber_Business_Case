import { Card, CardContent } from '@/components/ui/card';

export default function ProjectDetailLoading() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="animate-pulse space-y-8">
        <div className="space-y-4">
          <div className="h-9 w-40 rounded-lg bg-muted" />
          <div className="h-10 w-96 rounded-lg bg-muted" />
          <div className="h-5 w-80 rounded-lg bg-muted/80" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-6 w-48 rounded-lg bg-muted" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-20 rounded-lg bg-muted/80" />
                  <div className="h-20 rounded-lg bg-muted/80" />
                  <div className="h-20 rounded-lg bg-muted/80" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="h-6 w-40 rounded-lg bg-muted" />
                <div className="h-4 w-full rounded bg-muted/80" />
                <div className="h-4 w-4/5 rounded bg-muted/80" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="h-6 w-40 rounded-lg bg-muted" />
              <div className="h-4 w-full rounded bg-muted/80" />
              <div className="h-4 w-full rounded bg-muted/80" />
              <div className="h-4 w-3/4 rounded bg-muted/80" />
              <div className="h-10 w-full rounded-lg bg-muted" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

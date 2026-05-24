import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JobsTable } from "@/components/tables/JobsTable";
import { LoadingState } from "@/components/layout/LoadingState";
import { useAsync } from "@/hooks/useAsync";
import { jobService } from "@/services/jobService";

export default function Jobs() {
  const { data: jobs, loading, error } = useAsync(() => jobService.getAll());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Async Jobs</h1>
        <p className="text-muted-foreground">Track video extraction, CSV imports, and enrichment tasks</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Queue</CardTitle>
          <CardDescription>Background processing status and progress</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <LoadingState />}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!loading && !error && <JobsTable data={jobs || []} />}
        </CardContent>
      </Card>
    </div>
  );
}

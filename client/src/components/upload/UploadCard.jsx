import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function UploadCard({ title, description, icon: Icon, accept, onUpload, progress = 0, loading = false }) {
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload?.(file);
    e.target.value = "";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label>
          <input type="file" accept={accept} className="hidden" onChange={handleChange} disabled={loading} />
          <Button variant="outline" asChild disabled={loading}>
            <span>Choose file</span>
          </Button>
        </label>
        {loading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground">Uploading... {progress}%</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

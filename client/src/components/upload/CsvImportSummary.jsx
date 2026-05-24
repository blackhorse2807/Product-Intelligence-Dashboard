import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SEVERITY_VARIANT = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "secondary",
};

export function CsvImportSummary({ result }) {
  if (!result?.summary) return null;

  const { summary, rows = [] } = result;
  const failed = summary.failedRows?.length
    ? summary.failedRows
    : rows.filter((r) => !r.isValid);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">CSV import summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Total" value={summary.totalRows} />
          <Stat label="Valid" value={summary.validRows} good />
          <Stat label="Invalid" value={summary.invalidRows} warn={summary.invalidRows > 0} />
          <Stat label="HIGH" value={summary.issueBreakdown?.HIGH || 0} />
          <Stat label="MEDIUM" value={summary.issueBreakdown?.MEDIUM || 0} />
          <Stat label="LOW" value={summary.issueBreakdown?.LOW || 0} />
        </div>

        {failed.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Failed rows</p>
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failed.map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell className="font-mono text-xs">{row.sku_id || "—"}</TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {row.product_title || "—"}
                      </TableCell>
                      <TableCell>{row.qualityScore}%</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.issues?.slice(0, 3).map((issue, i) => (
                            <Badge
                              key={i}
                              variant={SEVERITY_VARIANT[issue.severity] || "secondary"}
                              className="text-[10px]"
                            >
                              {issue.type}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, good, warn }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-lg font-semibold ${good ? "text-emerald-400" : warn ? "text-amber-400" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

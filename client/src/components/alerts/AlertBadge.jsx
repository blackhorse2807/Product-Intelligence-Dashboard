import { Badge } from "@/components/ui/badge";
import { SEVERITY } from "@/constants";

const severityVariant = {
  [SEVERITY.HIGH]: "danger",
  [SEVERITY.MEDIUM]: "warning",
  [SEVERITY.LOW]: "secondary",
};

export function AlertBadge({ severity }) {
  return <Badge variant={severityVariant[severity] || "outline"}>{severity}</Badge>;
}

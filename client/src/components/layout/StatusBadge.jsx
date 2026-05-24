import { Badge } from "@/components/ui/badge";
import { JOB_STATUS } from "@/constants";

const statusVariant = {
  [JOB_STATUS.PENDING]: "secondary",
  [JOB_STATUS.RUNNING]: "warning",
  [JOB_STATUS.COMPLETED]: "success",
  [JOB_STATUS.FAILED]: "danger",
  [JOB_STATUS.PARTIALLY_COMPLETED]: "warning",
};

export function StatusBadge({ status }) {
  return <Badge variant={statusVariant[status] || "outline"}>{status}</Badge>;
}

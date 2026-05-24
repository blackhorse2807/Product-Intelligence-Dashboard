import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";
import { Link, useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/formatters";
import { ChevronRight, ExternalLink } from "lucide-react";

const columnHelper = createColumnHelper();

function QualityBadge({ score }) {
  const variant = score >= 80 ? "success" : score >= 50 ? "warning" : "danger";
  return <Badge variant={variant}>{score}%</Badge>;
}

export function ProductsTable({ data = [] }) {
  const navigate = useNavigate();

  const columns = [
    columnHelper.accessor("skuId", {
      header: "SKU",
      cell: (info) => <span className="font-mono text-xs text-muted-foreground">{info.getValue()}</span>,
    }),
    columnHelper.accessor("title", {
      header: "Product",
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="min-w-[200px]">
            <p className="font-medium text-foreground line-clamp-2">{info.getValue()}</p>
            {row.brand && (
              <p className="mt-0.5 text-xs text-muted-foreground">{row.brand}</p>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("category", {
      header: "Category",
      cell: (info) => info.getValue() || <span className="text-muted-foreground">—</span>,
    }),
    columnHelper.accessor("price", {
      header: "Price",
      cell: (info) => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor("qualityScore", {
      header: "Quality",
      cell: (info) => <QualityBadge score={info.getValue() ?? 0} />,
    }),
    columnHelper.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: (info) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-primary hover:text-primary"
          asChild
          onClick={(e) => e.stopPropagation()}
        >
          <Link to={`/products/${info.row.original._id}`}>
            View
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const openProduct = (id) => navigate(`/products/${id}`);

  return (
    <div className="overflow-hidden rounded-lg border border-border/80">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/30 hover:bg-muted/30">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="font-semibold">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                tabIndex={0}
                role="link"
                onClick={() => openProduct(row.original._id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openProduct(row.original._id);
                  }
                }}
                className="cursor-pointer transition-colors hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-12 text-center">
                <p className="text-muted-foreground">No products yet.</p>
                <p className="mt-1 text-sm text-muted-foreground/80">
                  Upload a video to extract your first listing.
                </p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {data.length > 0 && (
        <p className="border-t border-border/60 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
          <ExternalLink className="mr-1 inline h-3 w-3" />
          Click any row or use <span className="font-medium text-foreground">View</span> to open product details
        </p>
      )}
    </div>
  );
}

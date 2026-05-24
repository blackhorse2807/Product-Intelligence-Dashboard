import { useEffect, useRef, useState } from "react";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PenLine,
  Save,
  Upload,
  Tag,
  IndianRupee,
  Palette,
  Ruler,
  Layers,
  FileText,
  Package,
} from "lucide-react";
import { parseProductCsv } from "@/utils/parseProductCsv";
import { TITLE_ESSENTIAL_FIELDS } from "@/constants/titleRequiredFields";
import { parseProductAmount } from "@/utils/productPricing";

const TITLE_ESSENTIAL_KEYS = new Set(TITLE_ESSENTIAL_FIELDS.map((f) => f.dbKey));

const EMPTY_FORM = {
  skuId: "",
  title: "",
  description: "",
  brand: "",
  category: "",
  price: "",
  mrp: "",
  availability: "",
  color: "",
  size: "",
  material: "",
};

const AVAILABILITY_OPTIONS = [
  { value: "in_stock", label: "In stock" },
  { value: "limited", label: "Limited" },
  { value: "out_of_stock", label: "Out of stock" },
];

function AvailabilitySelector({ value, onChange }) {
  const selected = value || "in_stock";

  return (
    <div className="flex rounded-lg border border-border bg-muted/20 p-1">
      {AVAILABILITY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
            selected === opt.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, required, highlight, children }) {
  return (
    <div
      className={
        highlight === "essential"
          ? "rounded-xl border border-red-500/30 bg-red-500/5 p-3 sm:col-span-2"
          : highlight === "missing"
            ? "rounded-xl border border-amber-500/30 bg-amber-500/5 p-3"
            : "rounded-xl border border-border/50 bg-muted/10 p-3"
      }
    >
      <label
        className={`mb-1.5 block text-xs font-medium ${required ? "text-red-400" : "text-muted-foreground"}`}
      >
        {label}
        {required && " *"}
      </label>
      {children}
    </div>
  );
}

export function ProductEditDialog({
  open,
  onOpenChange,
  product,
  onSave,
  titleMissing,
  missingFields = [],
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const csvRef = useRef(null);
  const missingKeys = new Set(missingFields.map((m) => m.dbKey));

  useEffect(() => {
    if (product) {
      setForm({
        skuId: product.skuId || "",
        title: product.title === "Pending Review" ? "" : product.title || "",
        description: product.description || "",
        brand: product.brand || "",
        category: product.category || "",
        price: product.price != null && product.price !== "" ? String(product.price) : "",
        mrp: product.mrp != null && product.mrp !== "" ? String(product.mrp) : "",
        availability: product.availability || "in_stock",
        color: product.color || "",
        size: product.size || "",
        material: product.material || "",
      });
    }
  }, [product, open]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setMessage("");
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseProductCsv(reader.result);
      if (parsed) {
        setForm((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(parsed).map(([k, v]) => [k, v ?? prev[k]])
          ),
        }));
        setMessage("CSV loaded — review and save.");
      } else {
        setMessage("Could not parse CSV. Use headers: sku_id, product_title, brand, etc.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    for (const field of TITLE_ESSENTIAL_FIELDS) {
      if (!form[field.dbKey]?.trim()) {
        setMessage(`${field.label} is required.`);
        return;
      }
    }

    setSaving(true);
    setMessage("");
    try {
      await onSave({
        ...form,
        price: parseProductAmount(form.price),
        mrp: parseProductAmount(form.mrp),
      });
      onOpenChange(false);
    } catch (err) {
      setMessage(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const fieldHighlight = (dbKey) => {
    if (TITLE_ESSENTIAL_KEYS.has(dbKey)) return "essential";
    if (missingKeys.has(dbKey)) return "missing";
    return "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader onClose={() => onOpenChange(false)}>
        <div className="pr-10">
          <div className="mb-2 flex items-center gap-2">
            <PenLine className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">Product details</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Title, brand, and category are required. Enhanced titles use only these saved fields.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">Manual entry</Badge>
            <Badge variant="outline">CSV import supported</Badge>
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
            <Button type="button" variant="outline" size="sm" onClick={() => csvRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
          </div>

          <Section icon={Tag} title="Listing essentials">
            <Field
              label={`Product title${titleMissing ? " (not found in video)" : ""}`}
              required
              highlight={fieldHighlight("title")}
            >
              <Input
                value={form.title}
                onChange={handleChange("title")}
                placeholder="e.g. Nike Blue Running Shoes"
                required
              />
            </Field>
            <Field label="Brand" required highlight={fieldHighlight("brand")}>
              <Input value={form.brand} onChange={handleChange("brand")} placeholder="Nike" required />
            </Field>
            <Field label="Category" required highlight={fieldHighlight("category")}>
              <Input
                value={form.category}
                onChange={handleChange("category")}
                placeholder="Running Shoes"
                required
              />
            </Field>
            <Field label="SKU ID" highlight={fieldHighlight("skuId")}>
              <Input value={form.skuId} onChange={handleChange("skuId")} placeholder="SKU-001" />
            </Field>
          </Section>

          <Section icon={IndianRupee} title="Pricing & availability">
            <Field label="Price (selling price)" highlight={fieldHighlight("price")}>
              <Input type="number" value={form.price} onChange={handleChange("price")} placeholder="1999" />
            </Field>
            <Field label="MRP" highlight={fieldHighlight("mrp")}>
              <Input type="number" value={form.mrp} onChange={handleChange("mrp")} placeholder="2499" />
            </Field>
            <Field label="Availability" highlight={fieldHighlight("availability")}>
              <AvailabilitySelector
                value={form.availability}
                onChange={(v) => {
                  setForm((prev) => ({ ...prev, availability: v }));
                  setMessage("");
                }}
              />
            </Field>
          </Section>

          <Section icon={Palette} title="Attributes">
            <Field label="Color" highlight={fieldHighlight("color")}>
              <Input value={form.color} onChange={handleChange("color")} placeholder="Blue" />
            </Field>
            <Field label="Size" highlight={fieldHighlight("size")}>
              <Input value={form.size} onChange={handleChange("size")} placeholder="M / 42 / 10 UK" />
            </Field>
            <Field label="Material" highlight={fieldHighlight("material")}>
              <Input value={form.material} onChange={handleChange("material")} placeholder="Mesh / Cotton" />
            </Field>
          </Section>

          <Section icon={FileText} title="Description">
            <Field label="Product description" highlight={fieldHighlight("description")}>
              <Textarea
                value={form.description}
                onChange={handleChange("description")}
                rows={4}
                placeholder="Features, fit, and use-case details..."
                className="sm:col-span-2"
              />
            </Field>
          </Section>

          {message && (
            <p
              className={`text-sm ${message.includes("loaded") ? "text-emerald-400" : "text-red-400"}`}
            >
              {message}
            </p>
          )}
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save product"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

/** Compact summary shown when dialog is closed */
export function ProductDetailsSummary({ product, onEdit }) {
  if (!product) return null;

  const chips = [
    { icon: Package, label: "SKU", value: product.skuId },
    { icon: Tag, label: "Brand", value: product.brand },
    { icon: Layers, label: "Category", value: product.category },
    { icon: Palette, label: "Color", value: product.color },
    { icon: Ruler, label: "Size", value: product.size },
  ].filter((c) => c.value);

  return (
    <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Saved product details
          </p>
          <h3 className="mt-1 text-lg font-semibold leading-snug">
            {product.title === "Pending Review" ? "Title not set" : product.title}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map(({ icon: Icon, label, value }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">{label}:</span>
                <span className="font-medium">{value}</span>
              </span>
            ))}
          </div>
        </div>
        <Button onClick={onEdit} variant="outline" className="shrink-0 gap-2">
          <PenLine className="h-4 w-4" />
          Edit details
        </Button>
      </div>
    </div>
  );
}

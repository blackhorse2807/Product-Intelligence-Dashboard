import { useState } from "react";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PenLine, Save } from "lucide-react";
import { parseProductAmount } from "@/utils/productPricing";
import { TITLE_ESSENTIAL_FIELDS } from "@/constants/titleRequiredFields";

const EMPTY_FORM = {
  skuId: "",
  title: "",
  description: "",
  brand: "",
  category: "",
  price: "",
  mrp: "",
  availability: "in_stock",
  color: "",
  size: "",
  material: "",
};

const AVAILABILITY_OPTIONS = [
  { value: "in_stock", label: "In stock" },
  { value: "limited", label: "Limited" },
  { value: "out_of_stock", label: "Out of stock" },
];

export function ManualProductDialog({ open, onOpenChange, onCreate }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setMessage("");
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
      await onCreate({
        ...form,
        price: parseProductAmount(form.price),
        mrp: parseProductAmount(form.mrp),
      });
      setForm(EMPTY_FORM);
      onOpenChange(false);
    } catch (err) {
      setMessage(err.message || "Failed to create product.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader onClose={() => onOpenChange(false)}>
        <div className="pr-10">
          <div className="mb-2 flex items-center gap-2">
            <PenLine className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">Add product manually</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter catalog fields directly — no video or CSV required.
          </p>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-red-400">Product title *</label>
              <Input
                value={form.title}
                onChange={handleChange("title")}
                placeholder="e.g. Nike Blue Running Shoes"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-red-400">Brand *</label>
              <Input value={form.brand} onChange={handleChange("brand")} placeholder="Nike" required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-red-400">Category *</label>
              <Input
                value={form.category}
                onChange={handleChange("category")}
                placeholder="Running Shoes"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">SKU ID</label>
              <Input value={form.skuId} onChange={handleChange("skuId")} placeholder="SKU-001" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">Price</label>
              <Input type="number" value={form.price} onChange={handleChange("price")} placeholder="1999" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">MRP</label>
              <Input type="number" value={form.mrp} onChange={handleChange("mrp")} placeholder="2499" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs text-muted-foreground">Availability</label>
              <div className="flex rounded-lg border border-border bg-muted/20 p-1">
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, availability: opt.value }))}
                    className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                      form.availability === opt.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">Color</label>
              <Input value={form.color} onChange={handleChange("color")} placeholder="Blue" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">Size</label>
              <Input value={form.size} onChange={handleChange("size")} placeholder="M" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs text-muted-foreground">Material</label>
              <Input value={form.material} onChange={handleChange("material")} placeholder="Mesh" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs text-muted-foreground">Description</label>
              <Textarea
                value={form.description}
                onChange={handleChange("description")}
                rows={3}
                placeholder="Features and details..."
              />
            </div>
          </div>

          {message && <p className="text-sm text-red-400">{message}</p>}
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Creating..." : "Create product"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

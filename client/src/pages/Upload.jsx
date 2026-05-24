import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileSpreadsheet, PenLine, Video } from "lucide-react";
import { UploadCard } from "@/components/upload/UploadCard";
import { CsvImportSummary } from "@/components/upload/CsvImportSummary";
import { ManualProductDialog } from "@/components/upload/ManualProductDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { uploadService } from "@/services/uploadService";
import { jobService } from "@/services/jobService";
import { productService } from "@/services/productService";

async function waitForJob(jobId, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await jobService.getById(jobId);
    const job = res.data.data;
    if (job.status === "COMPLETED") return job;
    if (job.status === "FAILED") throw new Error(job.errorMessage || "Processing failed");
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Processing timed out — check Jobs page");
}

export default function Upload() {
  const navigate = useNavigate();
  const [videoProgress, setVideoProgress] = useState(0);
  const [csvProgress, setCsvProgress] = useState(0);
  const [videoLoading, setVideoLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const handleVideoUpload = async (file) => {
    setVideoLoading(true);
    setMessage("");
    setStatus("Uploading video to Cloudinary...");
    try {
      const res = await uploadService.uploadVideo(file, (e) => {
        const percent = Math.round((e.loaded * 100) / (e.total || 1));
        setVideoProgress(percent);
      });

      const jobId = res.data.data?.jobId;
      setStatus("Running OCR & extracting product fields from video...");

      const job = await waitForJob(jobId);
      const productId = job.metadata?.productId;

      if (productId) {
        setMessage("Extraction complete! Review detected fields and fill any missing data.");
        navigate(`/products/${productId}`);
        return;
      }

      setMessage("Video processed. Open Products to view the new listing.");
    } catch (err) {
      setMessage(err.message);
      setStatus("");
    } finally {
      setVideoLoading(false);
    }
  };

  const handleCsvUpload = async (file) => {
    setCsvLoading(true);
    setMessage("");
    setCsvResult(null);
    try {
      const res = await uploadService.uploadCsv(file, (e) => {
        const percent = Math.round((e.loaded * 100) / (e.total || 1));
        setCsvProgress(percent);
      });
      const payload = res.data?.data;
      setCsvResult(payload);
      setMessage(res.data.message || "CSV import complete.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setCsvLoading(false);
    }
  };

  const handleManualCreate = async (form) => {
    const res = await productService.create(form);
    const productId = res.data?.data?.product?._id;
    if (productId) {
      navigate(`/products/${productId}`);
      return;
    }
    setMessage("Product created. Open Products to view the listing.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Center</h1>
        <p className="text-muted-foreground">
          Add products via video OCR, CSV bulk import, or manual entry
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <UploadCard
          title="Product Video"
          description="Extract sku, title, price, brand, and 9 more fields via OCR."
          icon={Video}
          accept="video/*"
          onUpload={handleVideoUpload}
          progress={videoProgress}
          loading={videoLoading}
        />
        <UploadCard
          title="Products CSV"
          description="Bulk import catalog rows with validation, quality scores, and partial success."
          icon={FileSpreadsheet}
          accept=".csv,text/csv"
          onUpload={handleCsvUpload}
          progress={csvProgress}
          loading={csvLoading}
        />
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PenLine className="h-5 w-5 text-primary" />
              <CardTitle>Manual entry</CardTitle>
            </div>
            <CardDescription>
              Type product details directly — no video or CSV file needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setManualOpen(true)}>
              Enter product details
            </Button>
          </CardContent>
        </Card>
      </div>

      <ManualProductDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        onCreate={handleManualCreate}
      />

      {csvResult && <CsvImportSummary result={csvResult} />}

      {(status || message) && (
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {status && <CardDescription className="text-primary">{status}</CardDescription>}
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

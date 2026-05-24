import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { UserCircle, Package, ListTodo, Bell, Save, Camera } from "lucide-react";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const fileRef = useRef(null);
  const [name, setName] = useState(user?.name || "");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await refreshUser();
        if (!cancelled && data?.stats) setStats(data.stats);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await authService.updateProfile({ name });
      const data = res.data?.data;
      if (data?.stats) setStats(data.stats);
      if (data?.user) await refreshUser();
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setMessage("");
    setError("");
    try {
      const res = await authService.uploadAvatar(file);
      const data = res.data?.data;
      if (data?.stats) setStats(data.stats);
      await refreshUser();
      setMessage("Profile picture updated.");
    } catch (err) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const statCards = [
    { label: "Products", value: stats?.productCount ?? 0, icon: Package },
    { label: "Jobs", value: stats?.jobCount ?? 0, icon: ListTodo },
    { label: "Open alerts", value: stats?.openAlerts ?? 0, icon: Bell },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your profile</h1>
        <p className="text-muted-foreground">Account details and workspace summary</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-16 w-16 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <UserCircle className="h-9 w-9" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm hover:bg-accent"
                title="Change profile picture"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle>{user?.name || "Seller"}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG, WebP or GIF · max 5MB
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0 capitalize">
              {user?.role || "seller"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">Display name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">Email</label>
              <Input value={user?.email || ""} disabled />
            </div>
            {message && <p className="text-sm text-emerald-400">{message}</p>}
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={uploadingAvatar}
                onClick={() => fileRef.current?.click()}
              >
                {uploadingAvatar ? "Uploading..." : "Upload photo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <Icon className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{loading ? "—" : value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Your catalog is private to your account. The same SKU can be used by different sellers.
      </p>
    </div>
  );
}

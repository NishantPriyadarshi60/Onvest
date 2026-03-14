"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InviteInvestorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fundId: string;
  fundName: string;
}

export function InviteInvestorModal({
  open,
  onOpenChange,
  fundId,
  fundName,
}: InviteInvestorModalProps) {
  const { getAccessToken } = usePrivy();
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/funds/${fundId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to send invite");
      toast.success("Invite email sent");
      setEmail("");
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function getOrFetchLink(): Promise<string | null> {
    if (link) return link;
    setLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/funds/${fundId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to get link");
      setLink(data.inviteUrl);
      return data.inviteUrl;
    } catch (err) {
      toast.error((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    const url = await getOrFetchLink();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite investor to {fundName}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="email">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Send via Email</TabsTrigger>
            <TabsTrigger value="link">Copy Link</TabsTrigger>
          </TabsList>
          <TabsContent value="email">
            <form onSubmit={handleSendEmail} className="space-y-4 pt-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="investor@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send invite"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="link">
            <div className="space-y-4 pt-4">
              <p className="text-sm text-slate-600">
                Share this link with investors. They can apply directly without an invite email.
              </p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={link ?? "Click to generate link"}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyLink()}
                  disabled={loading}
                >
                  {loading ? "Loading…" : link ? "Copy" : "Generate & Copy"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

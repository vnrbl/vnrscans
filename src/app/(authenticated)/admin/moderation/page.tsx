"use client";

import { Link, useNavigate } from "@/lib/router-compat";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink, Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminLog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function AdminModeration() {
  const qc = useQueryClient();
  const [reviewDialog, setReviewDialog] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionTaken, setActionTaken] = useState("none");
  const [statusFilter, setStatusFilter] = useState("pending");

  const queue = useQuery({
    queryKey: ["admin", "moderation", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("moderation_queue")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const reviewItem = useMutation({
    mutationFn: async ({ id, status, item }: { id: string; status: string; item: Record<string, unknown> }) => {
      const { data: user } = await supabase.auth.getUser();
      await applyModerationAction(item, actionTaken);

      const { error } = await supabase
        .from("moderation_queue")
        .update({
          status,
          reviewed_by: user.user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
          action_taken: actionTaken,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      if (item.source_report_id) {
        await supabase
          .from("reports")
          .update({ status: (status === "approved" ? "dismissed" : "resolved") as any })
          .eq("id", item.source_report_id as string);
      }

      await logAdminAction(`moderation_${status}`, "moderation", id, {
        content_type: item.content_type,
        action_taken: actionTaken,
      });
    },
    onSuccess: () => {
      toast.success("Item reviewed");
      setReviewDialog(null);
      setReviewNotes("");
      setActionTaken("none");
      qc.invalidateQueries({ queryKey: ["admin", "moderation"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const priorityColors = {
    urgent: "destructive",
    high: "default",
    normal: "secondary",
    low: "outline",
  };

  const statusColors = {
    pending: "default",
    approved: "secondary",
    rejected: "destructive",
    escalated: "outline",
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Moderation Queue</h1>
          <p className="text-sm text-muted-foreground">Review flagged content and reports</p>
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mt-6">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="escalated">Escalated</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          {queue.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

          {queue.data && queue.data.length === 0 && (
            <div className="rounded-lg border border-border/40 bg-card p-8 text-center">
              <Flag className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <p className="mt-2 text-sm text-muted-foreground">No items in queue</p>
            </div>
          )}

          <div className="space-y-3">
            {(queue.data || []).map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/40 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={priorityColors[item.priority as keyof typeof priorityColors] as any}>
                        {item.priority}
                      </Badge>
                      <Badge variant="outline">
                        {item.content_type}
                      </Badge>
                      {item.auto_flagged && (
                        <Badge variant="secondary">
                          🤖 Auto ({Math.round((item.flag_score ?? 0) * 100)}%)
                        </Badge>
                      )}
                      <Badge variant={statusColors[item.status as keyof typeof statusColors] as any}>
                        {item.status}
                      </Badge>
                    </div>

                    <h3 className="mt-2 font-semibold">Reason: {item.reason}</h3>
                    
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>ID: {item.content_id.slice(0, 8)}</span>
                      {item.reported_by && <span>Reported by: user {item.reported_by.slice(0, 8)}…</span>}
                      <span>Created: {new Date(item.created_at).toLocaleString()}</span>
                      {item.reviewed_at && (
                        <>
                          <span>Reviewed: {new Date(item.reviewed_at).toLocaleString()}</span>
                          {item.reviewed_by && <span>By: user {item.reviewed_by.slice(0, 8)}…</span>}
                        </>
                      )}
                    </div>

                    {item.review_notes && (
                      <div className="mt-2 rounded-md bg-muted/50 p-2 text-sm">
                        <strong>Notes:</strong> {item.review_notes}
                      </div>
                    )}

                    {item.action_taken && item.action_taken !== "none" && (
                      <div className="mt-2">
                        <Badge variant="outline">Action: {item.action_taken}</Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1">
                    {item.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setReviewDialog({ ...item, action: "approved" });
                            setActionTaken("none");
                          }}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setReviewDialog({ ...item, action: "rejected" });
                            setActionTaken("content_removed");
                          }}
                        >
                          <XCircle className="mr-1 h-4 w-4 text-red-500" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setReviewDialog({ ...item, action: "escalated" });
                            setActionTaken("none");
                          }}
                        >
                          <AlertTriangle className="mr-1 h-4 w-4 text-yellow-500" />
                          Escalate
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                    >
                      <Link 
                        to={getContentLink(item.content_type, item.content_id)}
                        target="_blank"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!reviewDialog} onOpenChange={(v) => { if (!v) setReviewDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDialog?.action === "approved" && "Approve Content"}
              {reviewDialog?.action === "rejected" && "Reject Content"}
              {reviewDialog?.action === "escalated" && "Escalate to Admin"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Action to Take</Label>
              <Select value={actionTaken} onValueChange={setActionTaken}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Action</SelectItem>
                  <SelectItem value="warning">Send Warning</SelectItem>
                  <SelectItem value="content_removed">Remove Content</SelectItem>
                  <SelectItem value="user_banned">Ban User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Review Notes</Label>
              <Textarea
                rows={4}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add your review notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => reviewItem.mutate({ id: reviewDialog?.id, status: reviewDialog?.action, item: reviewDialog })}
              disabled={reviewItem.isPending}
            >
              {reviewItem.isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

async function applyModerationAction(item: Record<string, unknown>, action: string) {
  const contentType = String(item.content_type ?? "");
  const contentId = String(item.content_id ?? "");

  if (action === "content_removed" && contentType === "comment") {
    await supabase.from("comments").update({ is_hidden: true }).eq("id", contentId);
  }
  if (action === "user_banned" && contentType === "comment") {
    const { data: comment } = await supabase.from("comments").select("user_id").eq("id", contentId).single();
    if (comment?.user_id) {
      await supabase.from("profiles").update({ is_banned: true }).eq("user_id", comment.user_id);
    }
  }
}

function getContentLink(type: string, id: string): string {
  switch (type) {
    case "comment":
      return `/admin/comments`;
    case "report":
      return `/admin/reports`;
    case "series":
      return `/admin/series`;
    case "chapter":
      return `/admin/series`;
    default:
      return `/admin`;
  }
}

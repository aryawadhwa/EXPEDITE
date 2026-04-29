import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ProspectCard } from "@/components/review/ProspectCard";
import { ReviewCardRenderer } from "@/components/review/ReviewCardRenderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, ChevronLeft, ChevronRight, Inbox, Loader2, CheckCheck, XCircle, Mail, Linkedin, Twitter, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api";
import { toast } from "sonner";

// Channel icon helper
const getChannelIcon = (channel: string) => {
  switch (channel?.toLowerCase()) {
    case "linkedin": return <Linkedin className="w-4 h-4 text-blue-500" />;
    case "twitter": return <Twitter className="w-4 h-4 text-sky-400" />;
    case "reddit": return <MessageSquare className="w-4 h-4 text-orange-500" />;
    case "slack": return <MessageSquare className="w-4 h-4 text-purple-500" />;
    default: return <Mail className="w-4 h-4 text-blue-400" />;
  }
};

interface DraftEdits {
  [draftId: string]: {
    subject: string;
    body: string;
  };
}

interface Draft {
  id: string;
  _id?: string;
  name: string;
  subject: string;
  body: string;
  channel: string;
  company?: string;
  context_source?: string;
  public_contact?: string;
  linkedin?: string;
  relevance_reason?: string;
  ai_reasoning?: string;
  relevance_score?: number;
  metadata?: {
    messageType?: "connection" | "inmail" | "message";
    subreddit?: string;
    postType?: "link" | "image" | "text";
    slackChannel?: string;
    threadTs?: string;
  };
  attachments?: { filename: string; asset_id: string }[];
}

export default function ReviewQueue() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Multi-select state
  const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  // Bulk reject dialog
  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState(false);
  const [bulkRejectFeedback, setBulkRejectFeedback] = useState("");

  // Track edits for each draft
  const [draftEdits, setDraftEdits] = useState<DraftEdits>({});

  const api = useApi();
  const navigate = useNavigate();

  // Get filter params from URL query
  const [searchParams] = useSearchParams();
  const filterMissionId = searchParams.get("mission_id");
  const filterDraftId = searchParams.get("draft_id");

  const fetchDrafts = useCallback(async () => {
    try {
      const data = await api.getPendingDrafts(filterMissionId || undefined);
      setDrafts(data || []);
      // Initialize edits for all drafts
      const initialEdits: DraftEdits = {};
      (data || []).forEach((d: Draft) => {
        const id = d.id || d._id;
        initialEdits[id] = { subject: d.subject, body: d.body };
      });
      setDraftEdits(initialEdits);

      setDraftEdits(initialEdits);

      // If a specific draft_id was requested, navigate to it
      if (filterDraftId && data?.length) {
        const idx = data.findIndex((d: Draft) => (d.id || d._id) === filterDraftId);
        if (idx >= 0) {
          setCurrentIndex(idx);
        }
      }
    } catch (error) {
      console.error("Failed to fetch drafts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [api, filterMissionId, filterDraftId]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const currentDraft = drafts[currentIndex];
  const currentDraftId = currentDraft?.id || currentDraft?._id;
  const currentEdits = currentDraftId ? draftEdits[currentDraftId] : null;

  // ==========================================================================
  // EDIT HANDLERS
  // ==========================================================================

  const handleSubjectChange = (value: string) => {
    if (!currentDraftId) return;
    setDraftEdits(prev => ({
      ...prev,
      [currentDraftId]: { ...prev[currentDraftId], subject: value }
    }));
  };

  const handleBodyChange = (value: string) => {
    if (!currentDraftId) return;
    setDraftEdits(prev => ({
      ...prev,
      [currentDraftId]: { ...prev[currentDraftId], body: value }
    }));
  };

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================

  const handleNext = () => {
    if (currentIndex < drafts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // ==========================================================================
  // SINGLE ACTIONS
  // ==========================================================================

  const handleApprove = async () => {
    if (!currentDraft) return;
    setIsActioning(true);
    try {
      const edits = draftEdits[currentDraftId];
      const res = await api.approveDraft(
        currentDraftId,
        edits?.subject || currentDraft.subject,
        edits?.body || currentDraft.body
      );

      if (res.workflow_created) {
        toast.success("Workflow Started", { description: "Redirecting to active agents..." });
        navigate("/agents");
        return;
      }

      toast.success("Draft Approved", { description: "Email has been queued for sending." });
      const newDrafts = drafts.filter((_, i) => i !== currentIndex);
      setDrafts(newDrafts);
      if (currentIndex >= newDrafts.length && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } catch (error) {
      console.error("Failed to approve:", error);
      toast.error("Failed to approve draft");
    } finally {
      setIsActioning(false);
    }
  };

  const handleReject = async () => {
    if (!currentDraft) return;
    setShowBulkRejectDialog(true);
    setSelectedDrafts(new Set([currentDraftId]));
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleRegenerate = async () => {
    if (!currentDraft) return;
    setIsRegenerating(true);
    try {
      const result = await api.regenerateDraft(currentDraftId);
      // Update the current draft with new content
      const updatedDrafts = [...drafts];
      updatedDrafts[currentIndex] = {
        ...updatedDrafts[currentIndex],
        subject: result.subject,
        body: result.body,
        ai_reasoning: result.ai_reasoning,
      };
      setDrafts(updatedDrafts);
      // Update edits
      setDraftEdits(prev => ({
        ...prev,
        [currentDraftId]: { subject: result.subject, body: result.body }
      }));
      toast.success("Draft Regenerated", { description: "AI has created a new draft based on your mission." });
    } catch (error) {
      console.error("Failed to regenerate:", error);
      toast.error("Failed to regenerate draft");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleLoadAssets = async () => {
    if (!currentDraftId) return [];
    try {
      return await api.getAvailableAssets(currentDraftId);
    } catch (error) {
      console.error("Failed to load assets:", error);
      return [];
    }
  };

  const handleAttachmentsChange = async (newAttachments: { filename: string; asset_id: string }[]) => {
    if (!currentDraftId) return;
    try {
      await api.updateDraftAttachments(currentDraftId, newAttachments.map(a => a.asset_id));
      // Update local state
      const updatedDrafts = [...drafts];
      updatedDrafts[currentIndex] = {
        ...updatedDrafts[currentIndex],
        attachments: newAttachments,
      };
      setDrafts(updatedDrafts);
      toast.success("Attachments Updated");
    } catch (error) {
      console.error("Failed to update attachments:", error);
      toast.error("Failed to update attachments");
    }
  };

  // ==========================================================================
  // MULTI-SELECT & BULK ACTIONS
  // ==========================================================================

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedDrafts(new Set());
  };

  const toggleDraftSelection = (draftId: string) => {
    const newSelected = new Set(selectedDrafts);
    if (newSelected.has(draftId)) {
      newSelected.delete(draftId);
    } else {
      newSelected.add(draftId);
    }
    setSelectedDrafts(newSelected);
  };

  const selectAllDrafts = () => {
    const allIds = new Set(drafts.map(d => d.id || d._id));
    setSelectedDrafts(allIds);
  };

  const deselectAllDrafts = () => {
    setSelectedDrafts(new Set());
  };

  const handleBulkApprove = async () => {
    if (selectedDrafts.size === 0) {
      toast.error("No drafts selected");
      return;
    }

    setIsActioning(true);
    let successCount = 0;
    let failCount = 0;

    // ⚡ Bolt Optimization: Parallelize bulk approval API requests using Promise.all
    // This reduces overall wait time from O(n) sequentially to O(1) concurrently
    const approvalPromises = Array.from(selectedDrafts).map(async (draftId) => {
      try {
        const draft = drafts.find(d => (d.id || d._id) === draftId);
        const edits = draftEdits[draftId];
        await api.approveDraft(
          draftId,
          edits?.subject || draft?.subject,
          edits?.body || draft?.body
        );
        return { success: true, draftId };
      } catch (e) {
        console.error(`Failed to approve ${draftId}:`, e);
        return { success: false, draftId };
      }
    });

    const results = await Promise.all(approvalPromises);
    successCount = results.filter(r => r.success).length;
    failCount = results.filter(r => !r.success).length;

    toast.success(`Approved ${successCount} drafts`, {
      description: failCount > 0 ? `${failCount} failed` : undefined
    });

    // Refresh drafts
    await fetchDrafts();
    setSelectedDrafts(new Set());
    setSelectMode(false);
    setIsActioning(false);
    setCurrentIndex(0);
  };

  const handleBulkRejectConfirm = async () => {
    if (selectedDrafts.size === 0 || !bulkRejectFeedback.trim()) {
      toast.error("Please provide feedback");
      return;
    }

    setIsActioning(true);
    let successCount = 0;

    // ⚡ Bolt Optimization: Parallelize bulk rejection API requests using Promise.all
    // This reduces overall wait time from O(n) sequentially to O(1) concurrently
    const rejectionPromises = Array.from(selectedDrafts).map(async (draftId) => {
      try {
        await api.rejectDraft(draftId, bulkRejectFeedback);
        return { success: true, draftId };
      } catch (e) {
        console.error(`Failed to reject ${draftId}:`, e);
        return { success: false, draftId };
      }
    });

    const results = await Promise.all(rejectionPromises);
    successCount = results.filter(r => r.success).length;

    toast.success(`Rejected ${successCount} drafts`, {
      description: "Feedback sent to AI agent."
    });

    // Refresh drafts
    await fetchDrafts();
    setSelectedDrafts(new Set());
    setSelectMode(false);
    setShowBulkRejectDialog(false);
    setBulkRejectFeedback("");
    setIsActioning(false);
    setCurrentIndex(0);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <header className="flex items-center justify-between px-6 h-14 border-b border-border bg-card/50">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </header>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/2 border-r border-border p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="w-1/2 p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Queue Empty</h2>
          <p className="text-muted-foreground">No prospects waiting for review.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black/50 backdrop-blur-sm">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-16 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10">
            <Inbox className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">Review Queue</h1>
            <p className="text-xs text-zinc-500 font-mono">
              {selectMode ? `${selectedDrafts.size} selected` : `PENDING: ${drafts.length}`}
            </p>
          </div>

          {currentDraft && !selectMode && (
            <div className="flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300">
              {getChannelIcon(currentDraft.channel)}
              <span className="uppercase tracking-wider font-medium">{currentDraft.channel || "EMAIL"}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Bulk Actions */}
          {selectMode ? (
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectedDrafts.size === drafts.length ? deselectAllDrafts : selectAllDrafts}
                className="text-xs text-zinc-400 hover:text-white"
              >
                {selectedDrafts.size === drafts.length ? "Deselect All" : "Select All"}
              </Button>
              <div className="w-px h-4 bg-white/10" />
              <Button
                size="sm"
                onClick={handleBulkApprove}
                disabled={selectedDrafts.size === 0 || isActioning}
                className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20 h-7 text-xs"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                Approve ({selectedDrafts.size})
              </Button>
              <Button
                size="sm"
                onClick={() => setShowBulkRejectDialog(true)}
                disabled={selectedDrafts.size === 0 || isActioning}
                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20 h-7 text-xs"
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                Reject ({selectedDrafts.size})
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleSelectMode} className="text-zinc-400 hover:text-white h-7 text-xs">
                Exit
              </Button>
            </div>
          ) : (
            <>
              {/* Approve All Button - only show when there are multiple drafts */}
              {drafts.length > 1 && filterMissionId && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={async () => {
                    if (!confirm(`Approve and send all ${drafts.length} drafts?`)) return;
                    
                    setIsActioning(true);
                    try {
                      const result = await api.approveAllDrafts(filterMissionId);
                      toast.success("All Drafts Approved!", {
                        description: `${result.sent_count} emails queued for sending`,
                      });
                      // Refresh drafts
                      await fetchDrafts();
                      setCurrentIndex(0);
                    } catch (e) {
                      toast.error("Failed to approve all", {
                        description: (e as Error).message
                      });
                    } finally {
                      setIsActioning(false);
                    }
                  }}
                  disabled={isActioning}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md"
                >
                  {isActioning ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCheck className="w-4 h-4 mr-2" />
                  )}
                  Approve All ({drafts.length})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectMode}
                className="bg-transparent border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
              >
                Multi-Select
              </Button>

              <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-0.5 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="h-8 w-8 text-zinc-400 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <span className="text-xs font-mono text-zinc-500 min-w-[3rem] text-center">
                  {currentIndex + 1} / {drafts.length}
                </span>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  disabled={currentIndex === drafts.length - 1}
                  className="h-8 w-8 text-zinc-400 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="ml-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                onClick={async () => {
                  if (confirm("Are you sure you want to clear all pending drafts?")) {
                    setIsActioning(true);
                    try {
                      await api.clearAllDrafts();
                      toast.success("All drafts cleared");
                      setDrafts([]);
                    } catch (e) {
                      toast.error("Failed to clear drafts");
                    } finally {
                      setIsActioning(false);
                    }
                  }
                }}
              >
                Clear All
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Prospect List (in select mode) or Single Prospect */}
        <div className="w-1/2 border-r border-white/10 overflow-auto bg-black/20">
          {selectMode ? (
            <div className="p-4 space-y-2">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-4 px-2">
                Select Drafts
              </p>
              {drafts.map((draft, idx) => {
                const draftId = draft.id || draft._id;
                const isSelected = selectedDrafts.has(draftId);
                return (
                  <div
                    key={draftId}
                    onClick={() => toggleDraftSelection(draftId)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border",
                      isSelected
                        ? "bg-primary/10 border-primary/40 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                        : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleDraftSelection(draftId)}
                      className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm text-zinc-200 truncate">{draft.name || "Unknown"}</p>
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-white/10 text-zinc-500">
                          {draft.channel || 'email'}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-500 truncate">{draft.company || "Unknown"}</p>
                      <p className="text-xs text-zinc-400 mt-2 line-clamp-1">
                        <span className="text-zinc-600 mr-2">SUBJECT:</span>
                        {draft.subject}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <ProspectCard
              name={currentDraft?.name || "Unknown"}
              title={currentDraft?.context_source || "Web Search"}
              company={currentDraft?.company || "Unknown"}
              location={currentDraft?.public_contact || ""}
              linkedinUrl={currentDraft?.linkedin || ""}
              recentNews={[]}
              aiReasoning={currentDraft?.relevance_reason || currentDraft?.ai_reasoning || "Matched based on mission criteria."}
              tags={currentDraft?.relevance_score ? [`Relevance: ${Math.round(currentDraft.relevance_score * 100)}%`] : []}
            />
          )}
        </div>

        {/* Right: Dynamic Content Editor based on Channel */}
        <div className="w-1/2 overflow-auto bg-black/10">
          {!selectMode && currentDraft && (
            <ReviewCardRenderer
              channel={currentDraft.channel || "email"}
              subject={currentEdits?.subject || currentDraft.subject || ""}
              body={currentEdits?.body || currentDraft.body || ""}
              draftId={currentDraftId}
              metadata={{
                // LinkedIn metadata
                recipientName: currentDraft.name,
                recipientTitle: currentDraft.company,
                messageType: currentDraft.metadata?.messageType,
                // Reddit metadata
                subreddit: currentDraft.metadata?.subreddit,
                postType: currentDraft.metadata?.postType,
                // Slack metadata
                slackChannel: currentDraft.metadata?.slackChannel,
                threadTs: currentDraft.metadata?.threadTs,
                // Email attachments
                attachments: currentDraft.attachments,
              }}
              onSubjectChange={handleSubjectChange}
              onBodyChange={handleBodyChange}
              onRegenerate={handleRegenerate}
              onAttachmentsChange={handleAttachmentsChange}
              onLoadAssets={handleLoadAssets}
              isRegenerating={isRegenerating}
            />
          )}
          {selectMode && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                <CheckCheck className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-zinc-300 mb-2">Bulk Selection Mode</h3>
              <p className="text-sm max-w-xs text-center leading-relaxed">
                Select multiple drafts from the list on the left to approve or reject them in a single batch.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      {!selectMode && (
        <footer className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/40 backdrop-blur-xl absolute bottom-0 left-0 right-0 z-10">
          <Button
            variant="ghost"
            className="gap-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
            onClick={handleReject}
            disabled={isActioning}
          >
            <X className="w-4 h-4" />
            Reject & Edit Strategy
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
              onClick={handleSkip}
              disabled={isActioning || currentIndex === drafts.length - 1}
            >
              Skip
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </Button>
            <Button
              className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] border-0"
              onClick={handleApprove}
              disabled={isActioning}
            >
              {isActioning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {currentDraft?.channel === "twitter" ? "Approve & Tweet" :
                    currentDraft?.channel === "reddit" ? "Approve & Post" :
                      currentDraft?.channel === "linkedin" ? "Approve & Send" :
                        currentDraft?.channel === "slack" ? "Approve & Send" :
                          "Approve & Send"}
                </>
              )}
            </Button>
          </div>
        </footer>
      )}

      {/* Bulk Reject Dialog */}
      <Dialog open={showBulkRejectDialog} onOpenChange={setShowBulkRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {selectedDrafts.size} Draft{selectedDrafts.size > 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>
              Provide feedback for the AI to improve future drafts.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="e.g., Too salesy, needs more personalization, wrong tone..."
              value={bulkRejectFeedback}
              onChange={(e) => setBulkRejectFeedback(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkRejectConfirm}
              disabled={!bulkRejectFeedback.trim() || isActioning}
            >
              {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

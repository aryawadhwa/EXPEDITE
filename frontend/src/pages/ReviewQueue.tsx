import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

export default function ReviewQueue() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drafts, setDrafts] = useState<any[]>([]);
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

  const fetchDrafts = async () => {
    try {
      const data = await api.getPendingDrafts(filterMissionId || undefined);
      setDrafts(data || []);
      // Initialize edits for all drafts
      const initialEdits: DraftEdits = {};
      (data || []).forEach((d: any) => {
        const id = d.id || d._id;
        initialEdits[id] = { subject: d.subject, body: d.body };
      });
      setDraftEdits(initialEdits);
      
      // If a specific draft_id was requested, navigate to it
      if (filterDraftId && data?.length) {
        const idx = data.findIndex((d: any) => (d.id || d._id) === filterDraftId);
        if (idx >= 0) {
          setCurrentIndex(idx);
        }
      }
    } catch (error) {
      console.error("Failed to fetch drafts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [api, filterMissionId, filterDraftId]);

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

    for (const draftId of selectedDrafts) {
      try {
        const draft = drafts.find(d => (d.id || d._id) === draftId);
        const edits = draftEdits[draftId];
        await api.approveDraft(
          draftId,
          edits?.subject || draft?.subject,
          edits?.body || draft?.body
        );
        successCount++;
      } catch (e) {
        console.error(`Failed to approve ${draftId}:`, e);
        failCount++;
      }
    }

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

    for (const draftId of selectedDrafts) {
      try {
        await api.rejectDraft(draftId, bulkRejectFeedback);
        successCount++;
      } catch (e) {
        console.error(`Failed to reject ${draftId}:`, e);
      }
    }

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
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">Review Queue</h1>
          {currentDraft && !selectMode && (
            <Badge variant="outline" className="gap-1.5">
              {getChannelIcon(currentDraft.channel)}
              {(currentDraft.channel || "email").toUpperCase()}
            </Badge>
          )}
          <Badge variant="secondary" className="font-mono">
            {selectMode ? `${selectedDrafts.size} selected` : `${currentIndex + 1} / ${drafts.length}`}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Bulk Actions */}
          {selectMode ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={selectedDrafts.size === drafts.length ? deselectAllDrafts : selectAllDrafts}
                className="text-xs"
              >
                {selectedDrafts.size === drafts.length ? "Deselect All" : "Select All"}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleBulkApprove}
                disabled={selectedDrafts.size === 0 || isActioning}
                className="gap-1 bg-success hover:bg-success/90"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Approve ({selectedDrafts.size})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkRejectDialog(true)}
                disabled={selectedDrafts.size === 0 || isActioning}
                className="gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject ({selectedDrafts.size})
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleSelectMode}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectMode}
                className="text-xs"
              >
                Multi-Select
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
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
              <div className="w-px h-4 bg-border mx-2" />
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                disabled={currentIndex === drafts.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Prospect List (in select mode) or Single Prospect */}
        <div className="w-1/2 border-r border-border overflow-auto bg-card/30">
          {selectMode ? (
            <div className="p-4 space-y-2">
              <p className="text-sm text-muted-foreground mb-4">
                Select drafts to approve or reject in bulk:
              </p>
              {drafts.map((draft, idx) => {
                const draftId = draft.id || draft._id;
                const isSelected = selectedDrafts.has(draftId);
                return (
                  <div
                    key={draftId}
                    onClick={() => toggleDraftSelection(draftId)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${isSelected
                      ? "bg-primary/10 border-primary/50"
                      : "bg-secondary/30 border-transparent hover:bg-secondary/50"
                      }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleDraftSelection(draftId)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{draft.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground truncate">{draft.company || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        Subject: {draft.subject?.slice(0, 40)}...
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
        <div className="w-1/2 overflow-auto">
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
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <CheckCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Select drafts from the left panel</p>
                <p className="text-sm mt-2">Then use bulk actions in the header</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      {!selectMode && (
        <footer className="flex items-center justify-between px-6 py-4 border-t border-border bg-card">
          <Button
            variant="secondary"
            className="gap-2"
            onClick={handleReject}
            disabled={isActioning}
          >
            <X className="w-4 h-4" />
            Reject & Edit Strategy
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleSkip}
              disabled={isActioning || currentIndex === drafts.length - 1}
            >
              Skip for Now
            </Button>
            <Button
              className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
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

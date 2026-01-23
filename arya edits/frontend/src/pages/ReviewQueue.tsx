import { useState, useEffect, useCallback } from "react";
import { ProspectCard } from "@/components/review/ProspectCard";
import { EmailEditor } from "@/components/review/EmailEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ChevronLeft, ChevronRight, Inbox, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api";
import { toast } from "sonner";

interface Draft {
  id?: string;
  _id?: string;
  name?: string;
  company?: string;
  ai_reasoning?: string;
  subject?: string;
  body?: string;
}

export default function ReviewQueue() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const api = useApi();

  const fetchDrafts = useCallback(async () => {
    try {
      const data = await api.getPendingDrafts();
      setDrafts(data || []);
    } catch (error) {
      console.error("Failed to fetch drafts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const currentDraft = drafts[currentIndex];

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

  const handleApprove = async () => {
    if (!currentDraft) return;
    setIsActioning(true);
    try {
      await api.approveDraft(currentDraft.id || currentDraft._id);
      toast.success("Draft Approved", { description: "Email has been queued for sending." });
      // Remove from local list
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
    const feedback = prompt("Please provide feedback for the AI to improve the email:");
    if (!feedback) return;

    setIsActioning(true);
    try {
      await api.rejectDraft(currentDraft.id || currentDraft._id, feedback);
      toast.success("Draft Rejected", { description: "Feedback sent to AI agent." });
      // Remove from local list (or refresh to get updated version)
      await fetchDrafts();
    } catch (error) {
      console.error("Failed to reject:", error);
      toast.error("Failed to reject draft");
    } finally {
      setIsActioning(false);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleRegenerate = async () => {
    if (!currentDraft) return;
    setIsRegenerating(true);
    try {
      const result = await api.regenerateDraft(currentDraft.id || currentDraft._id);
      // Update the current draft with new content
      const updatedDrafts = [...drafts];
      updatedDrafts[currentIndex] = {
        ...updatedDrafts[currentIndex],
        subject: result.subject,
        body: result.body,
        ai_reasoning: result.ai_reasoning,
      };
      setDrafts(updatedDrafts);
      toast.success("Draft Regenerated", { description: "AI has created a new draft." });
    } catch (error) {
      console.error("Failed to regenerate:", error);
      toast.error("Failed to regenerate draft");
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        {/* Header Skeleton */}
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
          {/* Left Skeleton */}
          <div className="w-1/2 border-r border-border p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-32 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          {/* Right Skeleton */}
          <div className="w-1/2 p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>

        {/* Footer Skeleton */}
        <footer className="flex items-center justify-between px-6 py-4 border-t border-border bg-card">
          <Skeleton className="h-10 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </footer>
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
          <h1 className="text-lg font-semibold text-foreground">Approvals</h1>
          <Badge variant="secondary" className="font-mono">
            {currentIndex + 1} / {drafts.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </header>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Prospect Context */}
        <div className="w-1/2 border-r border-border overflow-auto bg-card/30">
          <ProspectCard
            name={currentDraft?.name || "Unknown"}
            title=""
            company={currentDraft?.company || "Unknown"}
            location=""
            linkedinUrl=""
            recentNews={[]}
            aiReasoning={currentDraft?.ai_reasoning || "No reasoning provided."}
            tags={[]}
          />
        </div>

        {/* Right: Email Draft */}
        <div className="w-1/2 overflow-auto">
          <EmailEditor
            subject={currentDraft?.subject || ""}
            body={currentDraft?.body || ""}
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
          />
        </div>
      </div>

      {/* Action Footer */}
      <footer className="flex items-center justify-between px-6 py-4 border-t border-border bg-card">
        <Button
          variant="destructive"
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
            className="gap-2 bg-primary hover:bg-primary/90 glow-primary"
            onClick={handleApprove}
            disabled={isActioning}
          >
            {isActioning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                Approve & Send
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}


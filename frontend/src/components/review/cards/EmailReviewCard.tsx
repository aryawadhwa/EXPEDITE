import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, RefreshCw, Loader2, Mail, Paperclip, Plus, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface Asset {
  id: string;
  filename: string;
  content_type: string;
  size: number;
}

interface EmailReviewCardProps {
  subject: string;
  body: string;
  attachments?: { filename: string; asset_id: string }[];
  draftId?: string;
  onSubjectChange?: (value: string) => void;
  onBodyChange?: (value: string) => void;
  onRegenerate?: () => Promise<void>;
  onAttachmentsChange?: (attachments: { filename: string; asset_id: string }[]) => void;
  isRegenerating?: boolean;
  availableAssets?: Asset[];
  onLoadAssets?: () => Promise<Asset[]>;
}

export function EmailReviewCard({
  subject: initialSubject,
  body: initialBody,
  attachments = [],
  draftId,
  onSubjectChange,
  onBodyChange,
  onRegenerate,
  onAttachmentsChange,
  isRegenerating = false,
  availableAssets = [],
  onLoadAssets,
}: EmailReviewCardProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [showAssetDialog, setShowAssetDialog] = useState(false);
  const [assets, setAssets] = useState<Asset[]>(availableAssets);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(
    new Set(attachments.map(a => a.asset_id))
  );
  const [loadingAssets, setLoadingAssets] = useState(false);

  useEffect(() => {
    setSubject(initialSubject);
  }, [initialSubject]);

  useEffect(() => {
    setBody(initialBody);
  }, [initialBody]);

  useEffect(() => {
    setSelectedAssetIds(new Set(attachments.map(a => a.asset_id)));
  }, [attachments]);

  const handleSubjectChange = (value: string) => {
    setSubject(value);
    onSubjectChange?.(value);
  };

  const handleBodyChange = (value: string) => {
    setBody(value);
    onBodyChange?.(value);
  };

  const handleOpenAssetDialog = async () => {
    setShowAssetDialog(true);
    if (onLoadAssets && assets.length === 0) {
      setLoadingAssets(true);
      try {
        const loadedAssets = await onLoadAssets();
        setAssets(loadedAssets);
      } catch (e) {
        console.error("Failed to load assets:", e);
      } finally {
        setLoadingAssets(false);
      }
    }
  };

  const toggleAsset = (assetId: string) => {
    const newSelected = new Set(selectedAssetIds);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssetIds(newSelected);
  };

  const handleSaveAttachments = () => {
    const newAttachments = assets
      .filter(a => selectedAssetIds.has(a.id))
      .map(a => ({ asset_id: a.id, filename: a.filename }));
    onAttachmentsChange?.(newAttachments);
    setShowAssetDialog(false);
  };

  const removeAttachment = (assetId: string) => {
    const newAttachments = attachments.filter(a => a.asset_id !== assetId);
    onAttachmentsChange?.(newAttachments);
    setSelectedAssetIds(prev => {
      const next = new Set(prev);
      next.delete(assetId);
      return next;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-foreground">Email Draft</span>
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Generated
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={onRegenerate}
            disabled={isRegenerating || !onRegenerate}
          >
            {isRegenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {isRegenerating ? "Regenerating..." : "Regenerate"}
          </Button>
        </div>

        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
            Subject Line
            <span className="float-right font-mono text-[10px]">{subject.length}/100</span>
          </label>
          <Input
            value={subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="bg-background border border-border/50 focus:border-primary/50 font-medium"
            maxLength={100}
          />
        </div>
      </div>

      {/* Body Editor */}
      <div className="flex-1 p-5 overflow-auto">
        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
          Email Body
        </label>
        <Textarea
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          className="w-full resize-none bg-background border border-border/50 focus:border-primary/50 text-sm leading-relaxed rounded-lg p-4"
          style={{
            minHeight: '200px',
            height: `${Math.max(200, body.split('\n').length * 24 + 40)}px`
          }}
        />
      </div>

      {/* Attachments & Stats */}
      <div className="p-5 border-t border-border">
        {/* Attachments Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Attachments ({attachments.length})
            </label>
            <Dialog open={showAssetDialog} onOpenChange={setShowAssetDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-7 text-xs"
                  onClick={handleOpenAssetDialog}
                >
                  <Plus className="w-3 h-3" />
                  Add from Knowledge
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Attach Files from Knowledge</DialogTitle>
                  <DialogDescription>
                    Select files from your Knowledge Assets to attach to this email.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[300px] overflow-auto">
                  {loadingAssets ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : assets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No assets available</p>
                      <p className="text-xs mt-1">Upload files in the Knowledge section first</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {assets.map((asset) => (
                        <div
                          key={asset.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedAssetIds.has(asset.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-secondary'
                            }`}
                          onClick={() => toggleAsset(asset.id)}
                        >
                          <Checkbox
                            checked={selectedAssetIds.has(asset.id)}
                            onCheckedChange={() => toggleAsset(asset.id)}
                          />
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{asset.filename}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(asset.size)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowAssetDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveAttachments}>
                    Attach Selected ({selectedAssetIds.size})
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {attachments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="gap-1.5 pr-1 hover:bg-secondary group"
                >
                  <Paperclip className="w-3 h-3" />
                  {att.filename}
                  <button
                    onClick={() => removeAttachment(att.asset_id)}
                    className="ml-1 p-0.5 rounded hover:bg-destructive/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No attachments. Click "Add from Knowledge" to attach files.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="font-mono">{body.split(/\s+/).filter(Boolean).length}</span> words
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono">{subject.length}</span> subject chars
            </div>
          </div>
          <Badge variant="secondary" className="bg-success/10 text-success text-xs">
            Ready to Send
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
             Keep subject under 50 chars for mobile
          </span>
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
             Personalize the first line
          </span>
        </div>
      </div>
    </div>
  );
}

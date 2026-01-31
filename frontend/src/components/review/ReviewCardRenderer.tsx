import { EmailReviewCard } from "./cards/EmailReviewCard";
import { TwitterReviewCard } from "./cards/TwitterReviewCard";
import { RedditReviewCard } from "./cards/RedditReviewCard";
import { InstagramReviewCard } from "./cards/InstagramReviewCard";
import { SlackReviewCard } from "./cards/SlackReviewCard";
import { ContentEditor } from "./ContentEditor";

interface Asset {
  id: string;
  filename: string;
  content_type: string;
  size: number;
}

interface ReviewCardRendererProps {
  channel: string;
  subject?: string;
  body?: string;
  draftId?: string;
  // Channel-specific metadata
  metadata?: {
    // LinkedIn
    messageType?: "connection" | "inmail" | "message";
    recipientName?: string;
    recipientTitle?: string;
    // Reddit
    subreddit?: string;
    postType?: "text" | "link" | "image";
    // Twitter
    tweetType?: "tweet" | "reply" | "quote";
    // Instagram
    mediaUrl?: string;
    // Slack
    slackChannel?: string;
    threadTs?: string;
    // Email
    attachments?: { filename: string; asset_id: string }[];
  };
  onSubjectChange?: (value: string) => void;
  onBodyChange?: (value: string) => void;
  onRegenerate?: () => Promise<void>;
  onAttachmentsChange?: (attachments: { filename: string; asset_id: string }[]) => void;
  onLoadAssets?: () => Promise<Asset[]>;
  isRegenerating?: boolean;
}

/**
 * Dynamic Review Card Renderer
 * 
 * Renders the appropriate card component based on the channel type.
 * Each channel has its own specialized UI that matches the platform's style.
 */
export function ReviewCardRenderer({
  channel,
  subject = "",
  body = "",
  draftId,
  metadata = {},
  onSubjectChange,
  onBodyChange,
  onRegenerate,
  onAttachmentsChange,
  onLoadAssets,
  isRegenerating = false,
}: ReviewCardRendererProps) {
  const normalizedChannel = channel?.toLowerCase() || "email";

  switch (normalizedChannel) {
    case "email":
    case "gmail":
      return (
        <EmailReviewCard
          subject={subject}
          body={body}
          draftId={draftId}
          attachments={metadata.attachments}
          onSubjectChange={onSubjectChange}
          onBodyChange={onBodyChange}
          onRegenerate={onRegenerate}
          onAttachmentsChange={onAttachmentsChange}
          onLoadAssets={onLoadAssets}
          isRegenerating={isRegenerating}
        />
      );

    case "twitter":
    case "x":
      return (
        <TwitterReviewCard
          body={body}
          tweetType={metadata.tweetType || "tweet"}
          onBodyChange={onBodyChange}
          onRegenerate={onRegenerate}
          isRegenerating={isRegenerating}
        />
      );

    case "reddit":
      return (
        <RedditReviewCard
          subject={subject}
          body={body}
          subreddit={metadata.subreddit}
          postType={metadata.postType || "text"}
          onSubjectChange={onSubjectChange}
          onBodyChange={onBodyChange}
          onRegenerate={onRegenerate}
          isRegenerating={isRegenerating}
        />
      );

    case "instagram":
      return (
        <InstagramReviewCard
          body={body}
          postType={metadata.postType as "post" | "story" | "reel" || "post"}
          mediaUrl={metadata.mediaUrl}
          onBodyChange={onBodyChange}
          onRegenerate={onRegenerate}
          isRegenerating={isRegenerating}
        />
      );

    case "slack":
      return (
        <SlackReviewCard
          body={body}
          channel={metadata.slackChannel || "general"}
          threadTs={metadata.threadTs}
          onBodyChange={onBodyChange}
          onRegenerate={onRegenerate}
          isRegenerating={isRegenerating}
        />
      );

    // Fallback to generic ContentEditor for unknown channels
    default:
      return (
        <ContentEditor
          channel={normalizedChannel}
          subject={subject}
          body={body}
          onSubjectChange={onSubjectChange}
          onBodyChange={onBodyChange}
          onRegenerate={onRegenerate}
          isRegenerating={isRegenerating}
        />
      );
  }
}

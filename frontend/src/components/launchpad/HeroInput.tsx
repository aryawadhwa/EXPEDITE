import { useState, useRef, useEffect } from "react";
import { Loader2, Mic, MicOff, Paperclip, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Extend Window interface for Web Speech API
interface Asset {
  id: string;
  filename: string;
  content_type?: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

export function HeroInput() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [selectedAttachments, setSelectedAttachments] = useState<Asset[]>([]);
  const [isAutonomous, setIsAutonomous] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const api = useApi();
  const navigate = useNavigate();

  // Initialize Speech Recognition
  const shouldListenRef = useRef(false);
  const transcriptRef = useRef(""); // Persist final text across restarts

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Add final transcript to ref
        transcriptRef.current += finalTranscript;

        // Update input with stored final + current interim
        setQuery(transcriptRef.current + interimTranscript);
      };

      recognition.onend = () => {
        // Auto-restart if we should still be listening
        if (shouldListenRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.log("Could not restart recognition:", e);
          }
        } else {
          setIsListening(false);
          // Do NOT clear transcriptRef here
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);

        // Stop on permission or network errors
        if (
          event.error === "not-allowed" ||
          event.error === "audio-capture" ||
          event.error === "network"
        ) {
          shouldListenRef.current = false;
          setIsListening(false);

          const errorMessage = event.error === "network"
            ? "Network error: Speech recognition requires internet connection."
            : "Microphone access denied. Please allow access in settings.";

          toast.error("Speech Recognition Failed", {
            description: errorMessage,
          });
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported", {
        description: "Your browser does not support speech recognition.",
      });
      return;
    }

    if (isListening) {
      // Manual stop
      shouldListenRef.current = false;
      // Small delay to allow final result to flush
      setTimeout(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
      }, 150);
    } else {
      // Start fresh
      setQuery("");
      transcriptRef.current = ""; // Clear previous recording
      shouldListenRef.current = true;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Trigger asset picker when user types #
    if (value.endsWith("#")) {
      try {
        const assets = await api.getAssets();
        setAvailableAssets(assets || []);
        setShowAssetPicker(true);
      } catch (err) {
        console.error("Failed to fetch assets", err);
      }
    } else if (!value.includes("#")) {
      setShowAssetPicker(false);
    }
  };

  const handleSelectAsset = (asset: Asset) => {
    if (!selectedAttachments.find((a) => a.id === asset.id)) {
      setSelectedAttachments((prev) => [...prev, asset]);
    }
    setQuery((prev) => prev.replace(/#$/, ""));
    setShowAssetPicker(false);
  };

  const handleRemoveAttachment = (id: string) => {
    setSelectedAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      setIsLoading(true);
      try {
        // Include attachment info in the objective
        let objective = query;
        if (selectedAttachments.length > 0) {
          objective += ` [Attachments: ${selectedAttachments.map((a) => a.filename).join(", ")}]`;
        }

        const attachments = selectedAttachments.map(a => ({
          filename: a.filename,
          content_type: a.content_type || 'application/octet-stream',
          asset_id: a.id
        }));
        
        // Create mission
        const mission = await api.createMission(objective, attachments, isAutonomous, location);
        
        setQuery("");
        setSelectedAttachments([]);
        
        toast.success("Mission Launched!", {
          description: "Redirecting to mission control...",
        });
        navigate(`/chat/${mission._id || mission.id}`);
      } catch (error) {
        console.error("Failed to create mission:", error);
        toast.error("Mission launch failed", {
          description: "Please check your connection and try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-visible">
      {/* Ambient glow */}
      <div
        className={cn(
          "absolute -inset-4 rounded-3xl blur-2xl transition-all duration-700",
          isFocused || isListening ? "opacity-60" : "opacity-30"
        )}
        style={{
          background: isListening
            ? "radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)",
        }}
      />

      {/* Selected Attachments */}
      {selectedAttachments.length > 0 && (
        <div className="relative mb-3 flex flex-wrap gap-2 px-1">
          {selectedAttachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
            >
              <Paperclip className="w-3 h-3" />
              <span>{att.filename}</span>
              <button
                onClick={() => handleRemoveAttachment(att.id)}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        {/* Asset Picker Dropdown */}
        {showAssetPicker && (
          <div className="absolute bottom-full left-0 z-50 mb-2 max-h-48 w-full max-w-[18rem] overflow-auto rounded-xl border border-border bg-popover shadow-xl sm:w-72">
            {availableAssets.length > 0 ? (
              <>
                <div className="p-2 text-xs text-muted-foreground border-b border-border">
                  Select an attachment
                </div>
                {availableAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => handleSelectAsset(asset)}
                    className="w-full text-left px-3 py-2 hover:bg-secondary/50 flex items-center gap-2 text-sm"
                  >
                    <span className="text-primary"></span>
                    <span className="truncate">{asset.filename}</span>
                  </button>
                ))}
              </>
            ) : (
              <div className="p-3 text-sm text-muted-foreground">
                No files uploaded. Go to Settings to add files.
              </div>
            )}
          </div>
        )}

        <div
          className={cn(
            "relative flex flex-col gap-2 rounded-2xl border-2 bg-card/90 p-2 backdrop-blur-xl transition-all duration-300 md:flex-row md:items-center md:justify-between",
            isFocused
              ? "border-primary/50 shadow-xl shadow-primary/10"
              : "border-border/50 shadow-lg",
            isListening && "border-red-500/50 shadow-red-500/20"
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleListening}
              className={cn(
                "h-10 w-10 shrink-0 rounded-lg transition-all",
                isListening
                  ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse"
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            
            <div className="flex flex-col min-w-0 flex-1 md:flex-row gap-2">
              <input
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                onKeyDown={(e) => e.key === "Enter" && !showAssetPicker && handleSubmit(e)}
                placeholder={
                  isListening 
                    ? "Listening..." 
                    : "Describe your task... (type # for assets)"
                }
                className={cn(
                  "min-w-0 flex-1 bg-transparent py-2.5 pr-1 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none md:text-base",
                  isListening && "placeholder:text-red-400"
                )}
              />
              <div className="flex items-center gap-1 border-l border-border/50 pl-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location (Optional)"
                  className="w-full md:w-32 bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && !showAssetPicker && handleSubmit(e)}
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={!query.trim() || isLoading}
            className={cn(
              "h-11 w-full gap-2 rounded-lg px-5 font-semibold text-white transition-all md:ml-auto md:h-10 md:min-w-[120px] md:w-auto md:shrink-0",
              query.trim()
                ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                : "bg-secondary text-muted-foreground"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Launch</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>


      </form>

      {/* Listening indicator */}
      {isListening && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm text-red-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Listening...
        </div>
      )}
    </div>
  );
}

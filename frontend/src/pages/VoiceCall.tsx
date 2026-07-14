import { useState } from "react";
import { Phone, Loader2, CheckCircle, XCircle, PhoneCall } from "lucide-react";
import { useApi } from "@/lib/api";

interface CallResult {
  success: boolean;
  call_id?: string;
  status?: string;
  error?: string;
  details?: string;
}

export default function VoiceCall() {
  const api = useApi();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [intent, setIntent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [callResult, setCallResult] = useState<CallResult | null>(null);
  const [callStatus, setCallStatus] = useState<string | null>(null);

  const handleCall = async () => {
    if (!phoneNumber || !intent) return;

    setIsLoading(true);
    setCallResult(null);
    setCallStatus(null);

    try {
      const result = await api.initiateCall(phoneNumber, intent);
      setCallResult(result);

      if (result.success && result.call_id) {
        setCallStatus("Call initiated. Polling for updates…");
        pollCallStatus(result.call_id);
      }
    } catch (error) {
      setCallResult({
        success: false,
        error: error instanceof Error ? error.message : "Failed to initiate call",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pollCallStatus = (callId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setCallStatus("Call timed out. Check logs for results.");
        return;
      }
      try {
        const status = await api.getCallStatus(callId);
        if (status.success) {
          if (status.status === "completed" || status.status?.startsWith("ended")) {
            setCallStatus(`✅ Call completed. Summary: ${status.summary ?? "Available in logs"}`);
            return;
          } else if (status.status === "failed") {
            setCallStatus(`❌ Call failed: ${status.error ?? "Unknown error"}`);
            return;
          }
          setCallStatus(`📞 Status: ${status.status}`);
        }
      } catch {
        // Continue polling silently
      }
      attempts++;
      setTimeout(poll, 5000);
    };
    poll();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-green-500/20 rounded-xl">
            <PhoneCall className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Voice Agent</h1>
            <p className="text-gray-400">Make AI-powered outbound phone calls via Vapi</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700/50">
          <div className="space-y-6">
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number <span className="text-gray-500">(E.164 format)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="voice-phone-number"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full pl-11 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +91 for India)</p>
            </div>

            {/* Intent / Script */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Call Intent / Script
              </label>
              <textarea
                id="voice-intent"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="Ask if they are interested in a product demo. If yes, collect their email for follow-up. Keep it brief and professional."
                rows={4}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 resize-none"
              />
            </div>

            {/* CTA */}
            <button
              id="voice-call-btn"
              onClick={handleCall}
              disabled={isLoading || !phoneNumber || !intent}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Initiating Call…
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5" />
                  Start Voice Call
                </>
              )}
            </button>

            {/* Result */}
            {callResult && (
              <div
                className={`p-4 rounded-xl ${
                  callResult.success
                    ? "bg-green-500/20 border border-green-500/30"
                    : "bg-red-500/20 border border-red-500/30"
                }`}
              >
                <div className="flex items-start gap-2">
                  {callResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="text-sm">
                    <span className={callResult.success ? "text-green-300" : "text-red-300"}>
                      {callResult.success ? `Call ID: ${callResult.call_id}` : callResult.error}
                    </span>
                    {callResult.details && (
                      <pre className="text-red-400 text-xs mt-2 whitespace-pre-wrap overflow-x-auto max-w-full">
                        {callResult.details}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status Polling */}
            {callStatus && (
              <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                <p className="text-blue-300 text-sm">{callStatus}</p>
              </div>
            )}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-6 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">How it works:</h3>
          <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
            <li>Enter the target phone number in E.164 format</li>
            <li>Describe what the AI should say and achieve</li>
            <li>Click "Start Voice Call" — Vapi AI will call the number</li>
            <li>After the call ends, a summary will appear here</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

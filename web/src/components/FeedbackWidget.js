"use client";

import { useState } from "react";
import { api } from "../lib/api";

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("general");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("submitting");
    setErrorMsg("");

    try {
      await api.submitFeedback({
        message,
        type,
        pageUrl: window.location.href,
      });
      setStatus("success");
      setMessage("");
      setTimeout(() => {
        setIsOpen(false);
        setStatus("idle");
      }, 3000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Failed to submit feedback");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-signal-slate text-ink px-4 py-2 rounded-full text-sm font-medium hover:bg-signal-slate/90 transition-colors shadow-lg z-50 flex items-center gap-2"
      >
        <span className="text-lg leading-none">💬</span> Feedback
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 bg-ink border border-ink-line shadow-2xl rounded-sm z-50 overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b border-ink-line bg-[#111513]">
            <h3 className="text-bone text-sm font-medium">Send Feedback</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-bone-dim hover:text-bone text-lg leading-none"
            >
              &times;
            </button>
          </div>

          <div className="p-4">
            {status === "success" ? (
              <div className="text-center py-6">
                <span className="text-3xl block mb-2">🎉</span>
                <p className="text-bone text-sm font-medium">Thank you!</p>
                <p className="text-bone-faint text-xs mt-1">Your feedback helps us improve.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="bg-[#111513] border border-ink-line text-bone text-sm rounded-sm p-2 outline-none focus:border-signal-slate"
                >
                  <option value="general">General Feedback</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Report a Bug</option>
                </select>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={4}
                  className="bg-[#111513] border border-ink-line text-bone text-sm rounded-sm p-2 outline-none focus:border-signal-slate resize-none"
                  required
                />

                {status === "error" && (
                  <p className="text-signal-rust text-xs">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting" || !message.trim()}
                  className="bg-signal-gold text-ink text-sm font-medium py-2 rounded-sm hover:bg-signal-gold/90 transition-colors disabled:opacity-50 mt-1"
                >
                  {status === "submitting" ? "Sending..." : "Submit"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

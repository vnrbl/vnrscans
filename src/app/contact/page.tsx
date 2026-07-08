"use client";

import { useState } from "react";
import { Mail, ArrowLeft, Send, CheckCircle2, MessageSquare, ShieldCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSending(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          email, 
          subject: subject,           // the selected category value
          message,
          inquiryType: subject,       // for nicer display in email
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data?.error || "Failed to send message");
      }

      setSubmitted(true);
      toast.success("Message sent successfully! We'll get back to you soon.");
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-16 md:py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none" />

      <div className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-8">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4.5 w-4.5" /> Back to landing
        </Link>

        {/* Layout grid */}
        <div className="grid gap-12 lg:grid-cols-12 items-start">
          {/* Info Column */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-4 text-xs font-semibold text-primary">
                <MessageSquare className="h-4 w-4" /> Support & Inquiries
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-tight">
                Get in Touch
              </h1>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Whether you have partnership requests, content submissions, licensing queries, or just need general support, we are here to help.
              </p>
            </div>

            {/* Direct Cards */}
            <div className="space-y-4 pt-4">
              <div className="flex gap-4 p-4 rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-violet-600/10 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">General Email</h4>
                  <p className="text-sm mt-0.5 text-muted-foreground">creator@vnrscans.com</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Copyright / DMCA</h4>
                  <p className="text-sm mt-0.5 text-muted-foreground">dmca@vnrscans.com</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-500/10 text-cyan-500">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Creator Relations</h4>
                  <p className="text-sm mt-0.5 text-muted-foreground">partners@vnrscans.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <Card className="p-6 md:p-8 border-border/40 bg-card/45 backdrop-blur-md rounded-2xl relative">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Message Sent!</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Thank you for reaching out. A representative from the vnrscans support team will review your inquiry and reply via email within 48 hours.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 rounded-lg font-bold text-xs"
                    onClick={() => {
                      setSubmitted(false);
                      setName("");
                      setEmail("");
                      setSubject("");
                      setMessage("");
                    }}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-bold text-foreground uppercase tracking-wider">Your Name *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="rounded-lg text-xs h-10 border-border bg-card/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-bold text-foreground uppercase tracking-wider">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                        className="rounded-lg text-xs h-10 border-border bg-card/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="subject" className="text-xs font-bold text-foreground uppercase tracking-wider">Inquiry Subject *</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger id="subject" className="rounded-lg text-xs h-10 border-border bg-card/30 text-left">
                        <SelectValue placeholder="Select topic of discussion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Support">General Support & Accounts</SelectItem>
                        <SelectItem value="Partnership">Creator Partnership / Submission</SelectItem>
                        <SelectItem value="Licensing">Official Licensing Desk</SelectItem>
                        <SelectItem value="Bug">Technical Issue or Bug Report</SelectItem>
                        <SelectItem value="Other">Other Topic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-xs font-bold text-foreground uppercase tracking-wider">Detailed Message *</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your message here... Please include links or account details if relevant."
                      rows={5}
                      required
                      className="rounded-lg text-xs resize-none border-border bg-card/30"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={sending}
                    className="w-full rounded-xl font-bold text-xs h-12 bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-[0_4px_20px_rgba(174,103,250,0.25)] flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      "Sending Message..."
                    ) : (
                      <>
                        Submit Inquiry <Send className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

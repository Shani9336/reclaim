'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Mail, MapPin, Clock, Zap, Loader2, Send } from 'lucide-react';

const TOPICS = [
  'The app is great! 🎉',
  'I found a bug 🪲',
  'Feature request 💡',
  'Something is confusing ❓',
  'Other',
];

export function FeedbackSection() {
  const [activeTab, setActiveTab] = useState<'feedback' | 'contact'>('feedback');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('The app is great! 🎉');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      toast({
        title: 'Please enter a message',
        description: 'Tell us what you think or what you need help with.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          topic: selectedTopic,
          message,
          type: activeTab,
        }),
      });

      if (!res.ok) throw new Error('Failed to send feedback');

      toast({
        title: '🎉 Feedback received!',
        description: 'Thank you for helping us make ReClaim better. We read every message!',
      });

      setMessage('');
      setName('');
      setEmail('');
    } catch (err: any) {
      toast({
        title: 'Error sending feedback',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-6xl">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight">
                We&apos;d love to <br />
                <span className="text-red-500">hear from you.</span>
              </h2>
              <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed">
                Have a suggestion, found a bug, or just want to say hi? We read every message and reply within 24 hours.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">Email</p>
                  <a href="mailto:support@reclaim.app" className="text-sm font-medium hover:underline text-foreground">
                    support@reclaim.app
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">Campus & Community</p>
                  <p className="text-sm font-medium text-foreground">Devkiba College, Silvassa</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">Response Time</p>
                  <p className="text-sm font-medium text-foreground">Usually within 24 hours</p>
                </div>
              </div>
            </div>

            {/* Student highlight box */}
            <div className="rounded-2xl border border-red-200/70 bg-red-50/70 dark:bg-red-950/20 dark:border-red-900/40 p-4 text-xs leading-relaxed text-red-800 dark:text-red-300">
              <span className="font-semibold flex items-center gap-1.5 mb-1">
                <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                Built by students, for students.
              </span>
              Your feedback directly shapes what we build next for our college and community.
            </div>
          </div>

          {/* Right Column: Interactive Card */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border bg-card text-card-foreground shadow-sm overflow-hidden p-6 sm:p-8">
              {/* Tabs */}
              <div className="grid grid-cols-2 border-b pb-4 mb-6 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('feedback')}
                  className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                    activeTab === 'feedback'
                      ? 'border-red-500 text-red-600 dark:text-red-400'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  📝 Leave Feedback
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('contact')}
                  className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                    activeTab === 'contact'
                      ? 'border-red-500 text-red-600 dark:text-red-400'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  📩 Contact Us
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Your name</label>
                    <Input
                      placeholder="e.g. Shani"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Email</label>
                    <Input
                      type="email"
                      placeholder="you@campus.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Topic selection chips */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">What&apos;s this about?</label>
                  <div className="flex flex-wrap gap-2">
                    {TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => setSelectedTopic(topic)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          selectedTopic === topic
                            ? 'bg-red-50 border-red-400 text-red-700 dark:bg-red-950 dark:border-red-700 dark:text-red-300 font-medium shadow-sm'
                            : 'bg-background hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Message</label>
                  <Textarea
                    placeholder="Tell us what you think, what could be better, or what you love about ReClaim..."
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <div className="text-right text-[10px] text-muted-foreground">
                    {message.length} characters
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-xl shadow-sm gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Send Feedback
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground pt-1">
                  Goes directly to our student development team.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

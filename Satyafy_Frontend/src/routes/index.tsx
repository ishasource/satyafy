import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Moon, Sun, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  component: Index,
});

type Result = {
  percentage: number;
  label: string;
  explanations: string[];
};

type HistoryEntry = {
  id: string;
  text: string;
  result: Result;
};

const API_URL = "http://localhost:5082/api/Analyze";

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };
  return { dark, toggle };
}

function Index() {
  const { dark, toggle } = useTheme();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = (value: string): string | null => {
    const trimmed = value.trim();
    if (trimmed.length < 50) {
      return "Please enter at least 50 characters for an accurate analysis.";
    }
    if (!/[A-Za-z]{2,}/.test(trimmed)) {
      return "Please enter a valid news article or headline.";
    }
    const words = trimmed.split(/\s+/).filter((w) => /[A-Za-z]/.test(w));
    if (words.length < 5) {
      return "Please enter a complete sentence or headline.";
    }
    return null;
  };

  const isValid = validate(text) === null;

  const analyze = async () => {
    const v = validate(text);
    if (v) {
      setValidationError(v);
      return;
    }
    setValidationError(null);
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const explanations =
        typeof data.geminiExplanation === "string"
          ? data.geminiExplanation
              .split("\n")
              .map((s: string) => s.replace(/^[-*•\d.\s]+/, "").trim())
              .filter(Boolean)
          : [];
      const newResult: Result = {
        percentage: Math.round((Number(data.fakeProbability) || 0) * 100),
        label: String(data.label ?? ""),
        explanations,
      };
      setResult(newResult);
      setHistory((h) => [
        { id: `${Date.now()}-${Math.random()}`, text, result: newResult },
        ...h,
      ].slice(0, 10));
    } catch (e) {
      console.error(e);
      setError("Analysis failed — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (entry: HistoryEntry) => {
    setText(entry.text);
    setResult(entry.result);
    setError(null);
    setLoading(false);
  };

  const showResults = loading || result !== null;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside
        className={`relative shrink-0 border-r border-border bg-card/40 transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-0"
        }`}
      >
        <div className={`h-full overflow-hidden ${sidebarOpen ? "w-72" : "w-0"}`}>
          <div className="flex h-full flex-col p-4">
            <h2 className="mb-3 px-2 text-sm font-semibold tracking-tight">History</h2>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {history.length === 0 ? (
                <p className="px-2 text-xs text-muted-foreground">No history yet</p>
              ) : (
                history.map((entry) => {
                  const isFake = entry.result.percentage > 50;
                  return (
                    <button
                      key={entry.id}
                      onClick={() => loadFromHistory(entry)}
                      className="w-full rounded-md border border-border bg-background/60 p-3 text-left transition-colors hover:bg-primary/5 hover:border-primary/30"
                    >
                      <p className="line-clamp-2 text-xs text-foreground/90">
                        {entry.text.slice(0, 60)}
                        {entry.text.length > 60 ? "…" : ""}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            isFake
                              ? "bg-destructive/15 text-destructive"
                              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isFake ? "Fake" : "Real"}
                        </span>
                        <span className="text-[10px] tabular-nums text-muted-foreground">
                          {entry.result.percentage}%
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="absolute top-6 -right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-primary/10"
        >
          {sidebarOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      </aside>

      <div className="flex-1 min-w-0">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <SatyafyLogo />
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <section className="text-center">
          <h1
            className="text-4xl tracking-tight sm:text-5xl"
            style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700 }}
          >
            Fake news detector
          </h1>
          <p className="mt-4 text-muted-foreground">
            Paste an article or headline below and we'll analyze its credibility.
          </p>
        </section>

        <section className="mx-auto mt-10 max-w-3xl space-y-4">
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="Paste a news article, headline, or claim here…"
            className="min-h-48 resize-none text-base"
          />
          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}
          <div className="flex items-center justify-between">
            <span
              className={`text-xs ${
                text.trim().length < 50 ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {text.length} characters
            </span>
            <Button onClick={analyze} disabled={!isValid || loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing
                </>
              ) : (
                "Analyze"
              )}
            </Button>
          </div>
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </section>

        {showResults && (
          <section className="mt-12 grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ML Model verdict</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center gap-6 py-8">
                {loading || !result ? (
                  <>
                    <Skeleton className="h-44 w-44 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                  </>
                ) : (
                  <>
                    <ProgressRing value={result.percentage} />
                    <p
                      className={`text-lg font-semibold ${
                        result.percentage > 50 ? "text-destructive" : "text-emerald-500"
                      }`}
                    >
                      {result.label || (result.percentage > 50 ? "Likely Fake" : "Likely Real")}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {loading || !result ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="mt-2 h-2 w-2 shrink-0 rounded-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {result.explanations.map((e, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span className="text-foreground/90">{e}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {showResults && !loading && result && (
          <p className="mx-auto mt-6 max-w-3xl text-center text-xs italic text-muted-foreground">
            The ML model detects linguistic patterns from 10,000 labelled news statements. The AI analysis uses contextual reasoning. Disagreements between the two highlight the difference between pattern matching and semantic understanding.
          </p>
        )}
      </main>
      </div>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const size = 176;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const isFake = value > 50;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="fill-none stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`fill-none transition-all duration-700 ${
            isFake ? "stroke-destructive" : "stroke-emerald-500"
          }`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tabular-nums">{value}%</span>
        <span className="text-xs text-muted-foreground">fake probability</span>
      </div>
    </div>
  );
}

function SatyafyLogo() {
  return (
    <div className="flex items-center gap-3">
      <svg
        viewBox="0 0 64 64"
        className="h-11 w-11 shrink-0 sm:h-12 sm:w-12"
        aria-label="Satyafy logo"
        role="img"
      >
        <defs>
          <clipPath id="satyafy-shield">
            <path d="M32 4 L56 12 V32 C56 46 45 56 32 60 C19 56 8 46 8 32 V12 Z" />
          </clipPath>
        </defs>
        <path
          d="M32 4 L56 12 V32 C56 46 45 56 32 60 C19 56 8 46 8 32 V12 Z"
          fill="#1f7a3a"
        />
        <g clipPath="url(#satyafy-shield)">
          <path
            d="M32 4 L56 12 V32 C56 40 50 47 42 52 L32 46 Z"
            fill="#c0392b"
            opacity="0.2"
          />
          <rect x="14" y="48" width="22" height="3" rx="1.5" fill="#c0392b" />
        </g>
        <path
          d="M32 4 L56 12 V32 C56 46 45 56 32 60 C19 56 8 46 8 32 V12 Z"
          fill="none"
          stroke="#0f4a22"
          strokeWidth="1.5"
        />
        <text
          x="32"
          y="40"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontWeight="700"
          fontSize="30"
          fill="#ffffff"
        >
          S
        </text>
      </svg>
      <div className="flex flex-col leading-none">
        <span className="text-2xl font-bold tracking-tight sm:text-[1.7rem]">
          <span style={{ color: "#1f7a3a" }}>Satya</span>
          <span style={{ color: "#c0392b" }}>fy</span>
        </span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground sm:text-[11px]">
          Truth. Verified.
        </span>
      </div>
    </div>
  );
}


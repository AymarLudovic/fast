"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Globe, ArrowUp, Copy, Download, LogOut, MessageSquare } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { Bodoni_Moda } from "next/font/google"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { type auth, onAuth, logout } from "@/lib/firebase"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Client, Databases } from "appwrite"
import { Progress } from "@/components/ui/progress"

const bodoni = Bodoni_Moda({ subsets: ["latin"], display: "swap" })

type AnimationFile = {
  url: string
  content: string
  type: "css" | "js"
  isAnimation: boolean
  library?: string
  confidence: number
}

type Result = {
  title: string
  description: string
  techGuesses: string[]
  internalLinks: number
  externalLinks: number
  images: string[]
  stylesheets: number
  openGraphTags: number
  fullHTML: string
  fullCSS: string
  fullJS: string
  baseURL: string
  animationFiles: AnimationFile[]
  requiredCdnUrls: string[]
}

type ReducedResult = Omit<Result, "animationFiles" | "images">

const ResultItem = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between items-center py-4 border-b border-gray-800/50">
    <p className="text-gray-400">{label}</p>
    <p className="text-[#e4e4e4] text-right font-medium truncate pl-4">{value}</p>
  </div>
)

// Circular rotating text
function CircularText({ size = 140 }: { size?: number }) {
  const prefersReduced = useReducedMotion()
  const radius = size / 2 - 8
  const text = " STUDIO • STUDIO • STUDIO • STUDIO • STUDIO • STUDIO • STUDIO • STUDIO • STUDIO • STUDIO •"
  return (
    <div className="mx-auto mb-6 flex items-center justify-center">
      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="text-black"
        aria-hidden="true"
        animate={prefersReduced ? undefined : { rotate: 360 }}
        transition={prefersReduced ? undefined : { repeat: Number.POSITIVE_INFINITY, duration: 14, ease: "linear" }}
        style={{ willChange: "transform" }}
      >
        <defs>
          <path
            id="circlePath"
            d={`M ${size / 2},${size / 2} m -${radius},0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`}
          />
        </defs>
        <text fill="currentColor" fontSize="12" letterSpacing="2" className={`${bodoni.className} tracking-widest`}>
          <textPath href="#circlePath">{text}</textPath>
        </text>
      </motion.svg>
    </div>
  )
}

// Logo marquee
function LogoMarquee() {
  const prefersReduced = useReducedMotion()
  const logos = [
    "/images/logos/windsurf-text.svg",
    "/images/logos/v0.svg",
    "/images/logos/trae-text.svg",
    "/images/logos/replit-text.svg",
    "/images/logos/cursor-text.svg",
  ]
  const repeated = [...logos, ...logos, ...logos]
  return (
    <div className="relative my-10">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
      <div className="overflow-hidden">
        <motion.div
          className="flex gap-10 items-center"
          animate={prefersReduced ? undefined : { x: ["0%", "-50%"] }}
          transition={prefersReduced ? undefined : { duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          style={{ willChange: "transform" }}
        >
          {[...repeated, ...repeated].map((src, idx) => (
            <img
              key={`${src}-${idx}`}
              src={src || "/placeholder.svg"}
              alt="logo"
              className="h-6 sm:h-8 object-contain"
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}

type FrameworkKey = "next" | "remix" | "astro" | "vite-react" | "sveltekit" | "vue-vite" | "nuxt" | "html"

const frameworkLabel: Record<FrameworkKey, string> = {
  next: "Next.js (App Router, TSX)",
  remix: "Remix (TSX)",
  astro: "Astro (.astro)",
  "vite-react": "Vite (React, JSX)",
  sveltekit: "SvelteKit (+page.svelte)",
  "vue-vite": "Vue (Vite, SFC)",
  nuxt: "Nuxt (pages/preview.vue)",
  html: "HTML + CSS + JS (combined)",
}

const firebaseConfig = {
  apiKey: "AIzaSyDj0G6ztVSPdX2IBxSm_OTn49uOwYGoQ60",
  authDomain: "gloopin-374f1.firebaseapp.com",
  projectId: "gloopin-374f1",
  storageBucket: "gloopin-374f1.firebasestorage.app",
  messagingSenderId: "717792072207",
  appId: "1:717792072207:web:a5369e110ab3daad94497a",
  measurementId: "G-K5GHCYGF3E",
}

export default function SiteInspector() {
  const router = useRouter()

  // Firebase auth
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [user, setUser] = useState<ReturnType<(typeof auth)["currentUser"]> | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)

  useEffect(() => {
    const unsub = onAuth(async (u) => {
      setUser(u)
      setIsAuthReady(true)
      if (u) {
        loadSubscription(u.uid)
      } else {
        setSubscription(null)
      }
    })
    return () => unsub()
  }, [])

  const loadSubscription = async (userId: string) => {
    setSubscriptionLoading(true)
    try {
      const client = new Client()
      client.setEndpoint("https://fra.cloud.appwrite.io/v1")
      client.setProject("68802a5d00297352e520")
      const databases = new Databases(client)
      const response = await databases.getDocument("boodupy-3000", "subscription-300", userId)
      setSubscription(response)
    } catch (error) {
      console.error("Error loading subscription:", error)
      setSubscription(null)
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const isSubscriptionValid = () => {
    if (!subscription) return false
    const now = new Date()
    const expiration = new Date(subscription.expirationDate)
    return now < expiration
  }

  const getSubscriptionProgress = () => {
    if (!subscription) return 0
    const now = new Date()
    const expiration = new Date(subscription.expirationDate)
    const created = new Date(subscription.$createdAt)
    const total = expiration.getTime() - created.getTime()
    const elapsed = now.getTime() - created.getTime()
    return Math.max(0, Math.min(100, (elapsed / total) * 100))
  }

  const getTimeRemaining = () => {
    if (!subscription) return ""
    const now = new Date()
    const expiration = new Date(subscription.expirationDate)
    const diff = expiration.getTime() - now.getTime()

    if (diff <= 0) return "Expired"
    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return minutes > 0 ? `${minutes}m ${seconds}s remaining` : `${seconds}s remaining`
  }

  // UI and analyzer state
  const [url, setUrl] = useState("")
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState<{ id: string; message: string } | null>(null)

  // State for Prompt Reducer
  const [isReducerActive, setIsReducerActive] = useState(false)
  const [reducedResult, setReducedResult] = useState<ReducedResult | null>(null)
  const [showReducedPreviewFrame, setShowReducedPreviewFrame] = useState(false)

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedFramework, setSelectedFramework] = useState<FrameworkKey>("next")
  const [generatedFilename, setGeneratedFilename] = useState<string>("")
  const [generatedCode, setGeneratedCode] = useState<string>("")
  const [showCodePreview, setShowCodePreview] = useState<boolean>(false)

  const proposalUrls = ["cosmos.so", "stripe.com", "linear.app"]
  const proposalUrlImages: Record<string, string> = {
    "cosmos.so":
      "https://fra.cloud.appwrite.io/v1/storage/buckets/68968fe8001266b9f411/files/68969cd6000b7adb25e0/view?project=68802a5d00297352e520&mode=admin",
    "stripe.com":
      "https://fra.cloud.appwrite.io/v1/storage/buckets/68968fe8001266b9f411/files/68969d45000bcf13ad68/view?project=68802a5d00297352e520&mode=admin",
    "linear.app":
      "https://fra.cloud.appwrite.io/v1/storage/buckets/68968fe8001266b9f411/files/68969d55000989225796/view?project=68802a5d00297352e520&mode=admin",
  }

  const createDownloadLink = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus({ id, message: "Copié ! ✅" })
      setTimeout(() => setCopyStatus(null), 2000)
    } catch {
      setCopyStatus({ id, message: "Échec de la copie ⌐" })
      setTimeout(() => setCopyStatus(null), 2000)
    }
  }

  const fetchWithRetry = async (
    url: string,
    maxAttempts = 15,
    delay = 1000,
  ): Promise<{ success: boolean; content: string; error?: string }> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
        const response = await fetch(proxyUrl)
        if (!response.ok) throw new Error(`Network response was not ok (status: ${response.status})`)
        const data = await response.json()
        if (!data.contents) throw new Error(`No content received from proxy`)
        return { success: true, content: data.contents }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        } else {
          return { success: false, content: "", error: errorMsg }
        }
      }
    }
    return { success: false, content: "", error: "Should not reach here" }
  }

  const getLibraryCDN = (library: string): string[] => {
    const cdnMap: { [key: string]: string[] } = {
      GSAP: ["https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"],
      "Three.js": ["https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"],
      Lottie: ["https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"],
      AOS: ["https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js", "https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css"],
      //... more libraries
    }
    return cdnMap[library] || []
  }

  const detectAnimationLibrary = (
    url: string,
    content: string,
  ): { isAnimation: boolean; library?: string; confidence: number } => {
    const urlLower = url.toLowerCase()
    const contentLower = content.toLowerCase()
    const blacklist = ["googletagmanager", "google-analytics", "gtag", "facebook.net", "doubleclick"]
    if (blacklist.some((item) => urlLower.includes(item))) return { isAnimation: false, confidence: 0 }
    const libraries = [
      { name: "GSAP", patterns: [{ pattern: /gsap|tweenmax|tweenlite/gi, weight: 90 }] },
      { name: "Three.js", patterns: [{ pattern: /new THREE\.|THREE\.Scene/gi, weight: 95 }] },
      { name: "Lottie", patterns: [{ pattern: /lottie\.loadAnimation|bodymovin/gi, weight: 95 }] },
      { name: "AOS", patterns: [{ pattern: /AOS\.init|data-aos/gi, weight: 95 }] },
      { name: "Framer Motion", patterns: [{ pattern: /framer-motion|motion\./gi, weight: 95 }] },
    ]
    let bestMatch = { library: "", confidence: 0 }
    for (const lib of libraries) {
      let totalScore = 0
      for (const { pattern, weight } of lib.patterns) {
        const matches = (urlLower + " " + contentLower).match(pattern)
        if (matches) totalScore += weight * matches.length
      }
      if (totalScore > 0) {
        const confidence = Math.min(100, totalScore)
        if (confidence > bestMatch.confidence) bestMatch = { library: lib.name, confidence }
      }
    }
    if (bestMatch.confidence > 60) return { isAnimation: true, ...bestMatch }
    return { isAnimation: false, confidence: 0 }
  }

  const analyzeSite = async (urlToAnalyze = url) => {
    if (!urlToAnalyze) return
    setLoading(true)
    setError(null)
    setResult(null)
    setReducedResult(null)
    setShowReducedPreviewFrame(false)
    setCopyStatus(null)
    try {
      let fullUrl = urlToAnalyze;
      if (!/^https?:\/\//i.test(fullUrl)) fullUrl = "https://" + fullUrl;
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(fullUrl)}`);
      if (!response.ok) throw new Error(`Network error: ${response.status}`);
      const data = await response.json();
      const html = data.contents;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const baseURL = new URL(fullUrl).origin;

      const title = doc.querySelector("title")?.textContent || "No title";
      const description = doc.querySelector('meta[name="description"]')?.getAttribute("content") || "Not found";
      
      const stylesheets = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).map(l => l.getAttribute("href")).filter(Boolean) as string[];
      
      const animationFiles: AnimationFile[] = [];
      const cssContents: string[] = [];
      for (const href of stylesheets) {
          const fullHref = new URL(href, baseURL).href;
          const res = await fetchWithRetry(fullHref);
          if (res.success) {
              const animInfo = detectAnimationLibrary(fullHref, res.content);
              if (animInfo.isAnimation) animationFiles.push({ url: fullHref, content: res.content, type: "css", ...animInfo });
              cssContents.push(res.content);
          }
      }
      Array.from(doc.querySelectorAll("style")).forEach(s => cssContents.push(s.textContent || ""));
      const fullCSS = cssContents.join("\n\n");

      const scripts = Array.from(doc.querySelectorAll("script"));
      const jsContents: string[] = [];
      for (const script of scripts) {
          const src = script.getAttribute("src");
          if (src) {
              const fullSrc = new URL(src, baseURL).href;
              const res = await fetchWithRetry(fullSrc);
              if (res.success) {
                  const animInfo = detectAnimationLibrary(fullSrc, res.content);
                  if (animInfo.isAnimation) animationFiles.push({ url: fullSrc, content: res.content, type: "js", ...animInfo });
                  jsContents.push(res.content);
              }
          } else {
              jsContents.push(script.textContent || "");
          }
      }
      const fullJS = jsContents.join("\n\n");

      const bodyClone = doc.body.cloneNode(true) as HTMLElement;
      const fullHTML = bodyClone.innerHTML;

      setResult({
          title, description, techGuesses: [], internalLinks: 0, externalLinks: 0,
          images: [], stylesheets: stylesheets.length, openGraphTags: 0, fullHTML, fullCSS, fullJS,
          baseURL, animationFiles, requiredCdnUrls: [...new Set(animationFiles.map(f => getLibraryCDN(f.library!)).flat())]
      });

    } catch (err) {
      setError(`Analysis failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyzeClick = () => {
    if (!user) return router.push("/signup")
    if (!isSubscriptionValid()) return router.push("/subscription")
    analyzeSite()
  }

  const handleProposalClick = (proposalUrl: string) => {
    if (!user) return router.push("/signup")
    if (!isSubscriptionValid()) return router.push("/subscription")
    setUrl(proposalUrl)
    analyzeSite(proposalUrl)
  }

  const escTpl = (s: string) => s.replace(/`/g, "\\`").replace(/\$\{/g, "\\${")
  const gen = (fw: FrameworkKey) => {
    if (!result) return { filename: "", code: "" }
    const HTML = escTpl(result.fullHTML)
    const CSS = escTpl(result.fullCSS)
    const JS = escTpl(result.fullJS)
    switch(fw) {
      case "next": return { filename: "app/preview/page.tsx", code: `"use client"\nimport {useEffect} from "react";\nexport default function Page(){\nuseEffect(()=>{\nconst s=document.createElement("style");s.textContent=\`${CSS}\`;document.head.append(s);\nconst sc=document.createElement("script");sc.innerHTML=\`${JS}\`;document.body.append(sc);\nreturn ()=>{s.remove();sc.remove();}\n},[]);\nreturn <main dangerouslySetInnerHTML={{__html: \`${HTML}\`}}/>\n}`};
      case "html": return { filename: "index.html", code: `<!DOCTYPE html><html><head><style>${result.fullCSS}</style></head><body>${result.fullHTML}<script>${result.fullJS}</script></body></html>` };
      // ... autres frameworks
      default: return {filename: "", code: ""}
    }
  }

  useEffect(() => {
    if (!result) return
    const { filename, code } = gen(selectedFramework)
    setGeneratedFilename(filename)
    setGeneratedCode(code)
  }, [selectedFramework, result])

  const buildSeparateFilesPrompt = (): string => {
    const source = isReducerActive && reducedResult ? reducedResult : result
    if (!source) return ""
    const libs = result?.requiredCdnUrls.length ? `Detected libraries:\n${result.requiredCdnUrls.join("\n")}\n` : ""
    return `HTML:\n\`\`\`html\n${source.fullHTML}\n\`\`\`\n\nCSS:\n\`\`\`css\n${source.fullCSS}\n\`\`\`\n\nJS:\n\`\`\`javascript\n${source.fullJS}\n\`\`\``
  }
  
  const buildReducedPromptString = (): string => {
    if (!reducedResult) return ""
    const libs = result?.requiredCdnUrls.length ? `Detected libraries:\n${result.requiredCdnUrls.join("\n")}\n` : ""
    return `HTML (Reduced):\n\`\`\`html\n${reducedResult.fullHTML}\n\`\`\`\n\nCSS (Reduced):\n\`\`\`css\n${reducedResult.fullCSS}\n\`\`\`\n\nJS (Animations Only):\n\`\`\`javascript\n${reducedResult.fullJS}\n\`\`\``
  }

  const handleCopyPrompt = () => {
    if (!result) return
    const prompt = buildSeparateFilesPrompt()
    if (!prompt) return
    copyToClipboard(prompt, "prompt")
  }

  const handleDownloadReducedPrompt = () => {
    if (!reducedResult) return;
    const prompt = buildReducedPromptString();
    if (!prompt) return;
    createDownloadLink(prompt, "prompt-reducer.txt", "text/plain");
  }

  const createOptimizedPreview = () => {
    if (!result) return ""
    const { fullHTML, fullCSS, fullJS, baseURL, requiredCdnUrls } = result
    const cdnTags = requiredCdnUrls.map(url => url.endsWith(".css") ? `<link rel="stylesheet" href="${url}">` : `<script src="${url}"></script>`).join("\n")
    return `<!DOCTYPE html><html><head><base href="${baseURL}"><style>${fullCSS}</style>${cdnTags}</head><body>${fullHTML}<script>${fullJS}</script></body></html>`
  }

  const createReducedPreview = () => {
    if (!reducedResult) return ""
    const { fullHTML, fullCSS, fullJS, baseURL, requiredCdnUrls } = reducedResult
    const cdnTags = requiredCdnUrls.map(url => url.endsWith(".css") ? `<link rel="stylesheet" href="${url}">` : `<script src="${url}"></script>`).join("\n")
    return `<!DOCTYPE html><html><head><base href="${baseURL}"><style>${fullCSS}</style>${cdnTags}</head><body>${fullHTML}<script>${fullJS}</script></body></html>`
  }

  useEffect(() => {
    if (!result) return
    const reduceCode = () => {
      const animationJs = result.animationFiles
        .filter((file) => file.type === "js")
        .map((file) => `// Animation script from: ${file.url}\n${file.content}`)
        .join("\n\n")
      const { reducedHtml, reducedCss } = reduceHtmlAndCss(result.fullHTML, result.fullCSS)
      setReducedResult({ ...result, fullHTML: reducedHtml, fullCSS: reducedCss, fullJS: animationJs })
    }
    reduceCode()
  }, [result])

  const reduceHtmlAndCss = (html: string, css: string): { reducedHtml: string; reducedCss: string } => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    doc.querySelectorAll("svg").forEach((svg) => {
      const emojiSpan = doc.createElement("span")
      emojiSpan.textContent = "🎨"
      emojiSpan.setAttribute("role", "img")
      svg.parentNode?.replaceChild(emojiSpan, svg)
    })
    const reducedHtml = doc.body.innerHTML
    const usedClasses = new Set<string>()
    doc.querySelectorAll("[class]").forEach((el) => el.classList.forEach((cls) => usedClasses.add(cls)))
    const cssRules = css.split("}")
    const a_garder_css = cssRules.filter((rule) => {
      const selectorPart = rule.split("{")[0].trim()
      if (!selectorPart || /^(html|body|\*|:root)/i.test(selectorPart)) return false
      return Array.from(usedClasses).some((cls) => new RegExp(`\\.${cls}(\\s|:|,)`).test(selectorPart + " "))
    })
    const reducedCss = a_garder_css.join("}")
    return { reducedHtml, reducedCss }
  }

  const HeaderAction = () => {
    if (!isAuthReady) return null;
    if (user) {
        const email = user.email || "user";
        const fallback = email.slice(0, 2).toUpperCase();
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-[32px] rounded-[13px] bg-transparent">
                        <Avatar className="h-6 w-6 mr-2"><AvatarFallback>{fallback}</AvatarFallback></Avatar>
                        {email}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    {subscription && (
                        <div className="p-3 border-b">
                            <div className="text-sm font-medium mb-2">{subscription.subscriptionType === "trial" ? "Free Trial" : "$2.99/month"}</div>
                            <div className="text-xs text-gray-600 mb-2">{getTimeRemaining()}</div>
                            <Progress value={getSubscriptionProgress()} className="h-2" />
                        </div>
                    )}
                    <DropdownMenuItem onClick={async () => { await logout(); router.replace("/"); }}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }
    return <a href="/signup" className="h-[32px] px-5 text-sm flex items-center justify-center rounded-[13px] bg-black text-white font-semibold">Sign up</a>;
  }

  const inputPlaceholder = !user ? "Sign up to analyze (you'll be redirected)" : "https://example.com"
  const onInputFocus = () => { if (!user) router.push("/signup") }

  return (
    <div className="min-h-screen bg-white overflow-hidden p-4 sm:p-8">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-12">
        <svg className="h-[20px] w-[20px]" width="36" height="36" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="#111"><rect x="0" y="0" width="32" height="32" rx="10" /></svg>
        <HeaderAction />
      </header>

      <div className="max-w-4xl mx-auto p-6 sm:p-10 pb-60"> {/* Espace ajouté pour la barre de menu flottante */}
        <div className="text-center mb-10">
          <CircularText size={140} />
          <h1 className={`${bodoni.className} text-5xl sm:text-7xl md:text-8xl leading-[1.05] text-black mb-4`}>
            Clone your favorite website design.
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Paste a URL, launch the process, and instantly get a pixel-perfect replica of any website&apos;s design.
          </p>
        </div>

        <div className="h-[45px] w-[90%] sm:w-[400px] ring-5 ring-[#eee] rounded-[12px] flex items-center p-1 mx-auto mb-4">
          <div className="h-full w-full bg-[#fff] ring-4 ring-[#FAFAFA] rounded-[12px] flex items-center p-1 ">
            <div className="p-2"><Globe size={20} className="text-black" /></div>
            <input
              type="text"
              placeholder={inputPlaceholder}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={onInputFocus}
              className={`flex-grow h-full bg-transparent text-black focus:outline-none placeholder-[#888] text-sm`}
            />
            <button
              onClick={handleAnalyzeClick}
              disabled={loading}
              className="h-[35px] w-[35px] bg-[#111] rounded-[8px] flex items-center justify-center flex-shrink-0"
            >
              {loading ? <div className="bg-white rounded-[6px] w-4 h-4 animate-pulse" /> : <ArrowUp size={20} className="text-white" />}
            </button>
          </div>
        </div>

        {!loading && !result && (
          <>
            <div className="flex justify-center items-center gap-3 flex-wrap mb-6">
              <span className="text-sm text-gray-500">Try:</span>
              {proposalUrls.map((pUrl) => (
                <button key={pUrl} onClick={() => handleProposalClick(pUrl)} className="h-[30px] bg-[#FAFAFA] rounded-[12px] flex items-center px-2 hover:scale-105">
                  <img src={proposalUrlImages[pUrl]} alt={`${pUrl} preview`} className="h-4 w-4 rounded-[4px] mr-2 object-cover" />
                  <p className="text-sm text-gray-700">{pUrl}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-12">
                {proposalUrls.map((pUrl) => (
                  <div key={pUrl} onClick={() => handleProposalClick(pUrl)} className="h-[300px] w-[300px] border border-[#eee] rounded-[10px] relative cursor-pointer overflow-hidden">
                    <img className="h-full w-full object-contain" src={proposalUrlImages[pUrl]} alt={`${pUrl} site image`} />
                  </div>
                ))}
              </div>
            </div>
            <LogoMarquee />
          </>
        )}

        {error && <p className="text-red-600 bg-red-50 p-3 rounded-lg text-center mb-6">{error}</p>}

        {result && (
          <div className="space-y-12">
            <div>
              <h3 className="text-2xl font-bold text-black mb-4">Aperçu de l'interface (Complet)</h3>
              <iframe title="UI preview" className="w-full h-96 border rounded-xl bg-white" srcDoc={createOptimizedPreview()} sandbox="allow-scripts allow-same-origin" />
            </div>
            {reducedResult && (
              <div>
                <h3 className="text-2xl font-bold text-black mb-4">Aperçu avec "Prompt Reducer"</h3>
                <iframe title="Aperçu Réduit" className="w-full h-96 border rounded-xl bg-white" srcDoc={createReducedPreview()} sandbox="allow-scripts allow-same-origin" />
              </div>
            )}
            {showReducedPreviewFrame && reducedResult && (
              <div>
                <h3 className="text-2xl font-bold text-green-600 mb-4">Test du code réduit (injecté)</h3>
                <iframe
                  title="Aperçu du Prompt Réduit Injecté"
                  className="w-full h-96 border-2 border-green-400 rounded-xl bg-white"
                  srcDoc={createReducedPreview()}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {result && (
        <div className="fixed bottom-0 left-0 right-0 p-4 flex flex-col items-center z-50 gap-3">
          {/* Barre d'actions principale */}
          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-lg p-2 rounded-2xl shadow-2xl border">
            <div className="flex items-center space-x-2 pl-2">
              <Switch id="prompt-reducer" checked={isReducerActive} onCheckedChange={setIsReducerActive} />
              <Label htmlFor="prompt-reducer" className="text-sm font-medium">Prompt Reducer</Label>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleCopyPrompt} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Copy className="w-4 h-4 mr-2" />
                Copier Prompt
              </Button>
              <Button onClick={() => setShowReducedPreviewFrame(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
                <MessageSquare className="w-4 h-4 mr-2" />
                Tester
              </Button>
              <Button onClick={handleDownloadReducedPrompt} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 bg-white">
                <Download className="w-4 h-4 mr-2" />
                Prompt Réduit
              </Button>
            </div>
            <Button onClick={() => setShowExportModal(true)} variant="outline" className="h-[40px] rounded-[12px] font-medium px-4 bg-white">
              <Download className="mr-2 h-4 w-4" />
              Code Complet
            </Button>
          </div>

          {/* NOUVELLE BARRE POUR LES TÉLÉCHARGEMENTS INDIVIDUELS */}
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-lg p-2 rounded-2xl shadow-lg border">
            <span className="text-sm font-medium pl-2">Télécharger Fichiers Réduits :</span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => {
                    if (!reducedResult) return;
                    createDownloadLink(reducedResult.fullHTML, 'index_reduced.html', 'text/html');
                }}
                disabled={!reducedResult}
                className="border-gray-400 text-gray-600 hover:bg-gray-100"
            >
                <Download className="w-4 h-4 mr-2" />
                HTML
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => {
                    if (!reducedResult) return;
                    createDownloadLink(reducedResult.fullCSS, 'styles_reduced.css', 'text/css');
                }}
                disabled={!reducedResult}
                className="border-gray-400 text-gray-600 hover:bg-gray-100"
            >
                <Download className="w-4 h-4 mr-2" />
                CSS
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => {
                    if (!reducedResult) return;
                    createDownloadLink(reducedResult.fullJS, 'script_reduced.js', 'application/javascript');
                }}
                disabled={!reducedResult}
                className="border-gray-400 text-gray-600 hover:bg-gray-100"
            >
                <Download className="w-4 h-4 mr-2" />
                JS
            </Button>
          </div>

          {copyStatus?.id === "prompt" && (
            <div className="mt-2">
              <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-md">{copyStatus.message}</span>
            </div>
          )}
        </div>
      )}

      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
          <DialogContent className="sm:max-w-3xl">
          <DialogHeader><DialogTitle>Export code</DialogTitle><DialogDescription>Select a framework and preview the single-file export.</DialogDescription></DialogHeader>
          <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="framework">Framework</Label>
                      <select id="framework" className="w-full h-10 rounded-md border bg-white px-3 text-sm" value={selectedFramework} onChange={(e) => setSelectedFramework(e.target.value as FrameworkKey)}>
                          {Object.entries(frameworkLabel).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                      </select>
                  </div>
                  <div className="space-y-2">
                      <Label className="inline-flex items-center justify-between w-full"><span>View code</span><Switch checked={showCodePreview} onCheckedChange={setShowCodePreview} /></Label>
                      <input readOnly value={generatedFilename} className="w-full h-10 rounded-md border bg-gray-50 px-3 text-xs"/>
                  </div>
              </div>
              {showCodePreview && (
                  <div className="rounded-lg border bg-[#0b0c10] overflow-hidden">
                      <div className="px-3 py-2 text-xs text-gray-300 bg-[#0f1117] flex justify-between">
                          <span>{generatedFilename}</span><span className="text-gray-500">readonly preview</span>
                      </div>
                      <pre className="max-h-[420px] overflow-auto p-4 text-gray-100"><code>{generatedCode}</code></pre>
                  </div>
              )}
          </div>
          <DialogFooter className="gap-2">
              <Button variant="secondary" onClick={() => copyToClipboard(generatedCode, "export-code")} disabled={!generatedCode}><Copy className="mr-2 h-4 w-4" />Copy code</Button>
              <Button onClick={() => {if (!generatedCode || !generatedFilename) return; createDownloadLink(generatedCode, generatedFilename.replaceAll("/", "_"), "text/plain"); }} disabled={!generatedCode}>
                  <Download className="mr-2 h-4 w-4" />Download file
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

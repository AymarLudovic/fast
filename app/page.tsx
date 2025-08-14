"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Globe, Copy, Download, LogOut } from "lucide-react"
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

      // Use getDocument with userId as document ID, same as subscription page
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

    if (minutes > 0) {
      return `${minutes}m ${seconds}s remaining`
    }
    return `${seconds}s remaining`
  }

  // UI and analyzer state
  const [url, setUrl] = useState("")
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState<{ id: string; message: string } | null>(null)

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedFramework, setSelectedFramework] = useState<FrameworkKey>("next")
  const [generatedFilename, setGeneratedFilename] = useState<string>("")
  const [generatedCode, setGeneratedCode] = useState<{ HTML: string; CSS: string; JS: string } | null>(null)
  const [showCodePreview, setShowCodePreview] = useState<boolean>(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [showFrameworkDialog, setShowFrameworkDialog] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState("")

  // Demo urls and cards
  const proposalUrls = ["cursor.com", "framer.com", "lovable.dev", "linear.app", "notion.com"]
  const proposalUrlsWithImages = ["playerzero.ai", "apresentforce.com", "portfolite.framer.website"]
  const proposalUrlImages: Record<string, string> = {
    "playerzero.ai":
      "https://fra.cloud.appwrite.io/v1/storage/buckets/68968fe8001266b9f411/files/68969cd6000b7adb25e0/view?project=68802a5d00297352e520&mode=admin",
    "apresentforce.com":
      "https://fra.cloud.appwrite.io/v1/storage/buckets/68968fe8001266b9f411/files/68969d45000bcf13ad68/view?project=68802a5d00297352e520&mode=admin",
    "portfolite.framer.website":
      "https://fra.cloud.appwrite.io/v1/storage/buckets/68968fe8001266b9f411/files/689e40cd000ed8efd26d/view?project=68802a5d00297352e520&mode=admin",
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
      setCopyStatus({ id, message: "Copied! ✅" })
      setTimeout(() => setCopyStatus(null), 2000)
    } catch {
      setCopyStatus({ id, message: "Copy Failed ⌐" })
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
      GSAP: [
        "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/TextPlugin.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/MotionPathPlugin.min.js",
      ],
      "Three.js": [
        "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.7.9/dat.gui.min.js",
      ],
      Lottie: ["https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"],
      AOS: [
        "https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js",
        "https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css",
      ],
      "Anime.js": ["https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"],
      "Locomotive Scroll": [
        "https://cdn.jsdelivr.net/npm/locomotive-scroll@4.1.4/dist/locomotive-scroll.min.js",
        "https://cdn.jsdelivr.net/npm/locomotive-scroll@4.1.4/dist/locomotive-scroll.min.css",
      ],
      "Barba.js": ["https://cdnjs.cloudflare.com/ajax/libs/barba.js/1.0.0/barba.min.js"],
      ScrollMagic: [
        "https://cdnjs.cloudflare.com/ajax/libs/ScrollMagic/2.0.8/ScrollMagic.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/ScrollMagic/2.0.8/plugins/animation.gsap.min.js",
      ],
      "Velocity.js": ["https://cdnjs.cloudflare.com/ajax/libs/velocity/2.0.6/velocity.min.js"],
      Swiper: [
        "https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.js",
        "https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.css",
      ],
      Particles: ["https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js"],
    }
    return cdnMap[library] || []
  }

  const detectAnimationLibrary = (
    url: string,
    content: string,
  ): { isAnimation: boolean; library?: string; confidence: number } => {
    const urlLower = url.toLowerCase()
    const contentLower = content.toLowerCase()

    const blacklist = [
      "googletagmanager",
      "google-analytics",
      "gtag",
      "facebook.net",
      "doubleclick",
      "adsystem",
      "googlesyndication",
      "hotjar",
      "intercom",
      "zendesk",
      "crisp.chat",
      "tawk.to",
    ]
    if (blacklist.some((item) => urlLower.includes(item))) {
      return { isAnimation: false, confidence: 0 }
    }

    const libraries = [
      {
        name: "GSAP",
        patterns: [
          { pattern: /gsap\.registerPlugin|gsap\.timeline|gsap\.to|gsap\.from/gi, weight: 95 },
          { pattern: /greensock|tweenmax|tweenlite|timelinemax/gi, weight: 90 },
          { pattern: /scrolltrigger|motionpath|drawsvg/gi, weight: 85 },
          { pattern: /gsap/gi, weight: 70 },
        ],
      },
      {
        name: "Three.js",
        patterns: [
          { pattern: /new THREE\.|THREE\.Scene|THREE\.WebGLRenderer/gi, weight: 95 },
          { pattern: /PerspectiveCamera|BufferGeometry|MeshBasicMaterial/gi, weight: 90 },
          { pattern: /three\.js|three\.min\.js/gi, weight: 85 },
          { pattern: /webgl|canvas.*3d/gi, weight: 60 },
        ],
      },
      {
        name: "Lottie",
        patterns: [
          { pattern: /lottie\.loadAnimation|bodymovin/gi, weight: 95 },
          { pattern: /lottie-web|lottie\.js/gi, weight: 85 },
          { pattern: /lottie/gi, weight: 70 },
        ],
      },
      {
        name: "AOS",
        patterns: [
          { pattern: /AOS\.init|data-aos/gi, weight: 95 },
          { pattern: /aos\.js/gi, weight: 85 },
        ],
      },
      {
        name: "Anime.js",
        patterns: [
          { pattern: /anime\(\{|anime\.timeline/gi, weight: 95 },
          { pattern: /anime\.js/gi, weight: 85 },
        ],
      },
      {
        name: "Locomotive Scroll",
        patterns: [
          { pattern: /new LocomotiveScroll|data-scroll/gi, weight: 95 },
          { pattern: /locomotive-scroll/gi, weight: 85 },
        ],
      },
      {
        name: "Framer Motion",
        patterns: [{ pattern: /framer-motion|motion\.|useAnimation|AnimatePresence/gi, weight: 95 }],
      },
    ]

    let bestMatch = { library: "", confidence: 0 }
    for (const lib of libraries) {
      let totalScore = 0
      let matchCount = 0
      for (const { pattern, weight } of lib.patterns) {
        const matches = (urlLower + " " + contentLower).match(pattern)
        if (matches) {
          totalScore += weight * matches.length
          matchCount++
        }
      }
      if (matchCount > 0) {
        const confidence = Math.min(100, totalScore / matchCount)
        if (confidence > bestMatch.confidence) bestMatch = { library: lib.name, confidence }
      }
    }

    if (bestMatch.confidence === 0) {
      const genericPatterns = [
        /@keyframes|animation:|transform:|transition:/gi,
        /requestAnimationFrame|setInterval.*animation/gi,
        /\.animate\(|\.transition\(/gi,
        /transform.*translate|rotate|scale/gi,
        /opacity.*transition|visibility.*transition/gi,
        /cubic-bezier|ease-in|ease-out/gi,
      ]
      let genericScore = 0
      for (const pattern of genericPatterns) {
        const matches = contentLower.match(pattern)
        if (matches) genericScore += matches.length * 10
      }
      if (genericScore > 20) return { isAnimation: true, confidence: Math.min(50, genericScore) }
    }

    return {
      isAnimation: bestMatch.confidence > 60,
      library: bestMatch.library || undefined,
      confidence: bestMatch.confidence,
    }
  }

  // Analysis status messages
  const [analysisStatus, setAnalysisStatus] = useState<string>("")

  const analysisMessages = [
    "Starting analysis...",
    "Extracting design elements...",
    "Capturing animations...",
    "Processing styles...",
    "All set! View your extracted design",
  ]

  const showAnalysisProgress = () => {
    let messageIndex = 0
    const interval = setInterval(() => {
      if (messageIndex < analysisMessages.length - 1) {
        setAnalysisStatus(analysisMessages[messageIndex])
        messageIndex++
      } else {
        setAnalysisStatus(analysisMessages[analysisMessages.length - 1])
        clearInterval(interval)
      }
    }, 1500)
  }

  const analyzeSite = async (urlToAnalyze: string) => {
    setLoading(true)
    setResult(null)
    setError("")
    setCopyStatus(null)
    setAnalysisStatus("")
    setIsAnalyzing(true)
    setAnalysisStep(analysisMessages[0])

    // Start progress messages
    showAnalysisProgress()

    try {
      const MAX_SITE_FETCH_ATTEMPTS = 10
      for (let attempt = 1; attempt <= MAX_SITE_FETCH_ATTEMPTS; attempt++) {
        try {
          let fullUrl = urlToAnalyze
          if (!/^https?:\/\//i.test(fullUrl)) fullUrl = "https://" + fullUrl
          const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(fullUrl)}`)
          if (!response.ok) throw new Error(`Network response was not ok (status: ${response.status})`)
          const data = await response.json()
          const html = data.contents
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, "text/html")
          const baseURL = new URL(fullUrl).origin

          const title = doc.querySelector("title")?.textContent || "No title found"
          const description = doc.querySelector('meta[name="description"]')?.getAttribute("content") || "Not found"

          const links = Array.from(doc.querySelectorAll("a[href]")).map((el) => el.getAttribute("href") || "")
          const internalLinks = links.filter((href) => {
            try {
              return new URL(href, baseURL).hostname === new URL(fullUrl).hostname
            } catch {
              return false
            }
          }).length
          const externalLinks = links.length - internalLinks

          const imageEls = Array.from(doc.querySelectorAll("img"))
          const imageSrcs: string[] = imageEls
            .map((img) => {
              const rawSrc = img.getAttribute("src")
              if (!rawSrc) return null
              try {
                return new URL(rawSrc, baseURL).href
              } catch {
                return null
              }
            })
            .filter((src): src is string => !!src)

          const ogTags = doc.querySelectorAll('meta[property^="og:"]').length

          const stylesheetLinks = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
            .map((link) => link.getAttribute("href"))
            .filter(Boolean) as string[]

          const animationFiles: AnimationFile[] = []
          const cssFiles: string[] = []

          for (const href of stylesheetLinks) {
            const fullHref = new URL(href!, baseURL).href
            const fetchResult = await fetchWithRetry(fullHref)
            if (fetchResult.success) {
              const animationInfo = detectAnimationLibrary(fullHref, fetchResult.content)
              if (animationInfo.isAnimation && animationInfo.confidence > 60) {
                animationFiles.push({
                  url: fullHref,
                  content: fetchResult.content,
                  type: "css",
                  isAnimation: true,
                  library: animationInfo.library,
                  confidence: animationInfo.confidence,
                })
              }
              cssFiles.push(
                `/* Fetched from: ${fullHref} ${animationInfo.isAnimation ? `(ANIMATION FILE - ${animationInfo.confidence}%)` : ""} */\n${fetchResult.content}`,
              )
            } else {
              cssFiles.push(`/* FETCH FAILED after 15 attempts: ${href} - Error: ${fetchResult.error} */`)
            }
          }

          const inlineCSS = Array.from(doc.querySelectorAll("style")).map((el, index) => {
            const content = el.textContent || ""
            const animationInfo = detectAnimationLibrary(`inline-style-${index}`, content)
            if (animationInfo.isAnimation && animationInfo.confidence > 60) {
              animationFiles.push({
                url: `inline-style-${index}`,
                content,
                type: "css",
                isAnimation: true,
                library: animationInfo.library,
                confidence: animationInfo.confidence,
              })
            }
            return `/* Inline style ${index} ${animationInfo.isAnimation ? `(ANIMATION - ${animationInfo.confidence}%)` : ""} */\n${content}`
          })
          const fullCSS = [...cssFiles, ...inlineCSS].join("\n\n")

          const scriptEls = Array.from(doc.querySelectorAll("script")).map((el) => ({
            src: el.getAttribute("src"),
            content: el.textContent,
            type: el.getAttribute("type") || "text/javascript",
          }))

          const jsFiles: string[] = []
          const externalScripts = scriptEls.filter((s) => !!s.src)

          for (const script of externalScripts) {
            const fullSrc = new URL(script.src!, baseURL).href
            const fetchResult = await fetchWithRetry(fullSrc)
            if (fetchResult.success) {
              const animationInfo = detectAnimationLibrary(fullSrc, fetchResult.content)
              if (animationInfo.isAnimation && animationInfo.confidence > 60) {
                animationFiles.push({
                  url: fullSrc,
                  content: fetchResult.content,
                  type: "js",
                  isAnimation: true,
                  library: animationInfo.library,
                  confidence: animationInfo.confidence,
                })
              }
              jsFiles.push(
                `// Fetched from: ${fullSrc} ${animationInfo.isAnimation ? `(ANIMATION FILE - ${animationInfo.confidence}%)` : ""}\n// Library: ${animationInfo.library || "None"}\n${fetchResult.content}`,
              )
            } else {
              jsFiles.push(`// FETCH FAILED after 15 attempts: ${script.src} - Error: ${fetchResult.error}`)
            }
          }

          const inlineScripts = scriptEls.filter((s) => !s.src && s.content)
          const inlineJS = inlineScripts.map((script, index) => {
            const content = script.content || ""
            const animationInfo = detectAnimationLibrary(`inline-script-${index}`, content)
            if (animationInfo.isAnimation && animationInfo.confidence > 60) {
              animationFiles.push({
                url: `inline-script-${index}`,
                content,
                type: "js",
                isAnimation: true,
                library: animationInfo.library,
                confidence: animationInfo.confidence,
              })
            }
            return `// Inline script ${index} ${animationInfo.isAnimation ? `(ANIMATION CODE - ${animationInfo.confidence}%)` : ""}\n// Library: ${animationInfo.library || "None"}\n${content}`
          })

          const fullJS = [...jsFiles, ...inlineJS].join("\n\n// ===== NEXT SCRIPT =====\n\n")

          // CDN collection for iframe
          const detectedLibraries = [...new Set(animationFiles.map((f) => f.library).filter(Boolean))]
          const allCdnUrls: string[] = []
          detectedLibraries.forEach((library) => {
            const cdnUrls = getLibraryCDN(library!)
            allCdnUrls.push(...cdnUrls)
          })

          // Body reconstruction
          const docClone = parser.parseFromString(html, "text/html")
          const bodyHTML = docClone.body.innerHTML
          const bodyAttributes = Array.from(docClone.body.attributes)
            .map((attr) => `${attr.name}="${attr.value}"`)
            .join(" ")
          const cleanedHTML = bodyAttributes ? `<body ${bodyAttributes}>${bodyHTML}</body>` : bodyHTML

          // Tech guesses
          const allCode = [fullJS, fullCSS, html].join(" ")
          const techGuesses: string[] = []
          const techPatterns = {
            React: /react|jsx|createelement/gi,
            Vue: /vue\.js|v-if|v-for|\{\{.*\}\}/gi,
            Angular: /angular|ng-|@component/gi,
            jQuery: /jquery|\$\(/gi,
            GSAP: /gsap|greensock|tweenmax|tweenlite/gi,
            "Framer Motion": /framer-motion|motion\./gi,
            Lottie: /lottie|bodymovin/gi,
            "Three.js": /three\.js|webgl/gi,
            Bootstrap: /bootstrap/gi,
            Tailwind: /tailwind/gi,
            AOS: /aos\.js|data-aos/gi,
            "Locomotive Scroll": /locomotive-scroll/gi,
            "Barba.js": /barba\.js/gi,
            Swiper: /swiper/gi,
            Particles: /particles/gi,
          }
          Object.entries(techPatterns).forEach(([tech, pattern]) => {
            // @ts-expect-error dynamic regex
            if (pattern.test(allCode)) techGuesses.push(tech)
          })
          animationFiles.forEach((file) => {
            if (file.library && !techGuesses.includes(file.library)) techGuesses.push(file.library)
          })

          setResult({
            title,
            description,
            techGuesses,
            internalLinks,
            externalLinks,
            images: imageSrcs,
            stylesheets: stylesheetLinks.length,
            openGraphTags: ogTags,
            fullHTML: cleanedHTML,
            fullCSS,
            fullJS,
            baseURL,
            animationFiles,
            requiredCdnUrls: allCdnUrls,
          })

          const extractedHTML = cleanedHTML
          const extractedCSS = fullCSS
          const extractedJS = fullJS

          setGeneratedCode({
            HTML: extractedHTML,
            CSS: extractedCSS,
            JS: extractedJS,
          })
          setLoading(false)
          setIsAnalyzing(false)
          return
        } catch (err: any) {
          if (attempt === MAX_SITE_FETCH_ATTEMPTS) {
            setError("⌐ Analysis failed after multiple attempts.")
            setLoading(false)
            setIsAnalyzing(false)
          } else {
            await new Promise((res) => setTimeout(res, 2000))
          }
        }
      }
    } catch (err: any) {
      setError(`Analysis failed: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
      setIsAnalyzing(false)
    }
  }

  const redirectToAuthFn = () => router.push("/signup")

  const handleAnalyzeClickFn = () => {
    if (!user) {
      redirectToAuthFn()
      return
    }
    if (!isSubscriptionValid()) {
      router.push("/subscription")
      return
    }
    // Continue with analysis...
    analyzeSite(url)
  }

  const handleProposalClickFn = (proposalUrl: string) => {
    if (!user) {
      router.push("/signup")
      return
    }
    if (!isSubscriptionValid()) {
      router.push("/subscription")
      return
    }
    // Continue with proposal analysis...
    setUrl(proposalUrl)
    analyzeSite(proposalUrl)
  }

  const escTpl = (s: string) => s.replace(/`/g, "\\`").replace(/\$\{/g, "\\${")
  const gen = (fw: FrameworkKey) => {
    if (!result) return { filename: "", code: "" }
    const HTML = escTpl(result.fullHTML)
    const CSS = escTpl(result.fullCSS)
    const JS = escTpl(result.fullJS)
    switch (fw) {
      case "next":
        return {
          filename: "app/preview/page.tsx",
          code: `"use client"
import { useEffect } from "react"

export default function Page() {
  useEffect(() => {
    const style = document.createElement("style")
    style.id = "extracted-styles"
    style.textContent = \`${CSS}\`
    document.head.appendChild(style)

    const script = document.createElement("script")
    script.id = "extracted-scripts"
    script.innerHTML = \`${JS}\`
    document.body.appendChild(script)

    return () => { try { style.remove(); script.remove(); } catch {} }
  }, [])

  return <main dangerouslySetInnerHTML={{ __html: \`${HTML}\` }} />
}
`,
        }
      case "remix":
        return {
          filename: "app/routes/preview.tsx",
          code: `import { useEffect } from "react"
export default function Preview() {
  useEffect(() => {
    const style = document.createElement("style"); style.id="extracted-styles"; style.textContent=\`${CSS}\`; document.head.appendChild(style);
    const script = document.createElement("script"); script.id="extracted-scripts"; script.innerHTML=\`${JS}\`; document.body.appendChild(script);
    return () => { try { style.remove(); script.remove(); } catch {} }
  }, [])
  return <div dangerouslySetInnerHTML={{ __html: \`${HTML}\` }} />
}
`,
        }
      case "astro":
        return {
          filename: "src/pages/preview.astro",
          code: `---
---
<style is:global>
${result.fullCSS}
</style>
${result.fullHTML}
<script is:inline>
${result.fullJS}
</script>
`,
        }
      case "vite-react":
        return {
          filename: "src/App.jsx",
          code: `import { useEffect } from "react"
export default function App() {
  useEffect(() => {
    const style = document.createElement("style"); style.id="extracted-styles"; style.textContent=\`${CSS}\`; document.head.appendChild(style)
    const script = document.createElement("script"); script.id="extracted-scripts"; script.innerHTML=\`${JS}\`; document.body.appendChild(script)
    return () => { try { style.remove(); script.remove(); } catch {} }
  }, [])
  return <div dangerouslySetInnerHTML={{ __html: \`${HTML}\` }} />
}
`,
        }
      case "sveltekit":
        return {
          filename: "src/routes/preview/+page.svelte",
          code: `<script>
  import { onMount } from 'svelte'
  onMount(() => {
    const style = document.createElement('style'); style.id='extracted-styles'; style.textContent=\`${CSS}\`; document.head.appendChild(style)
    const script = document.createElement('script'); script.id='extracted-scripts'; script.innerHTML=\`${JS}\`; document.body.appendChild(script)
    return () => { try { style.remove(); script.remove(); } catch {} }
  })
</script>
{@html \`${HTML}\`}
`,
        }
      case "vue-vite":
        return {
          filename: "src/components/Preview.vue",
          code: `<template>
  <div v-html="htmlContent"></div>
</template>
<script setup>
import { onMounted, onUnmounted } from 'vue'
const htmlContent = \`${HTML}\`
onMounted(() => {
  const style = document.createElement('style'); style.id='extracted-styles'; style.textContent=\`${CSS}\`; document.head.appendChild(style)
  const script = document.createElement('script'); script.id='extracted-scripts'; script.innerHTML=\`${JS}\`; document.body.appendChild(script)
})
onUnmounted(() => { try { document.getElementById('extracted-styles')?.remove(); document.getElementById('extracted-scripts')?.remove(); } catch {} })
</script>
`,
        }
      case "nuxt":
        return {
          filename: "pages/preview.vue",
          code: `<template>
  <div v-html="htmlContent"></div>
</template>
<script setup>
const htmlContent = \`${HTML}\`
onMounted(() => {
  const style = document.createElement('style'); style.id='extracted-styles'; style.textContent=\`${CSS}\`; document.head.appendChild(style)
  const script = document.createElement('script'); script.id='extracted-scripts'; script.innerHTML=\`${JS}\`; document.body.appendChild(script)
})
onUnmounted(() => { try { document.getElementById('extracted-styles')?.remove(); document.getElementById('extracted-scripts')?.remove(); } catch {} })
</script>
`,
        }
      case "html":
      default:
        return {
          filename: "index.html",
          code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Extracted Design</title>
    <style>
${CSS}
    </style>
</head>
<body>
${HTML}
    <script>
${JS}
    </script>
</body>
</html>`,
        }
    }
  }

  const buildSeparateFilesPrompt = () => {
    if (!generatedCode) return ""

    const { HTML, CSS, JS } = generatedCode

    return `# Extracted Website Design - Copy & Paste Integration

## IMPORTANT INSTRUCTIONS FOR AI ASSISTANTS:
Your task is to COPY, PASTE, and ADAPT the provided code - NOT to recreate or approximate the design.

### STRICT REQUIREMENTS:
1. **PRESERVE ALL CSS CLASSES** - Do not modify, rename, or remove any CSS class names
2. **MAINTAIN HTML STRUCTURE** - Keep all div elements, nesting, and hierarchy exactly as provided
3. **COPY-PASTE APPROACH** - Simply integrate the provided code into your chosen framework
4. **NO DESIGN CHANGES** - Do not attempt to "improve" or modify the visual design
5. **FRAMEWORK ADAPTATION ONLY** - Only adapt syntax for your framework (React JSX, Vue template, etc.)

## HTML STRUCTURE (Copy this exactly):
\`\`\`html
${HTML}
\`\`\`

## CSS STYLES (Copy this exactly):
\`\`\`css
${CSS}
\`\`\`

## JAVASCRIPT FUNCTIONALITY (Copy this exactly):
\`\`\`javascript
${JS}
\`\`\`

## INTEGRATION STEPS:
1. Copy the HTML structure and adapt syntax for your framework (className for React, etc.)
2. Copy the CSS into a separate stylesheet or style block
3. Copy the JavaScript and integrate into your framework's script handling
4. Ensure the CSS file is properly linked to your HTML/component
5. Test that all animations and interactions work as expected

## FRAMEWORK-SPECIFIC NOTES:
- **React/Next.js**: Use className instead of class, integrate JS in useEffect
- **Vue**: Use template syntax, integrate JS in mounted() or onMounted()
- **Svelte**: Use Svelte syntax, integrate JS in onMount()
- **Angular**: Use Angular template syntax, integrate JS in ngOnInit()

Remember: Your goal is pixel-perfect reproduction, not interpretation or improvement.`
  }

  const downloadPrompt = () => {
    const prompt = buildSeparateFilesPrompt()
    const blob = new Blob([prompt], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "design-extraction-prompt.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyPrompt = async () => {
    const prompt = buildSeparateFilesPrompt()
    try {
      await navigator.clipboard.writeText(prompt)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error("Failed to copy prompt:", err)
    }
  }

  const downloadCode = () => {
    if (!generatedCode) return

    const selectedFile = gen(selectedFramework)
    const blob = new Blob([selectedFile.code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = selectedFile.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const frameworkOptions: Record<FrameworkKey, string> = {
    next: "Next.js (App Router, TSX)",
    remix: "Remix (TSX)",
    astro: "Astro (.astro)",
    "vite-react": "Vite (React, JSX)",
    sveltekit: "SvelteKit (+page.svelte)",
    "vue-vite": "Vue (Vite, SFC)",
    nuxt: "Nuxt (pages/preview.vue)",
    html: "HTML + CSS + JS (combined)",
  }

  const isSubscriptionValidFn = () => {
    if (!subscription) return false
    const now = new Date()
    const expirationDate = new Date(subscription.expirationDate)
    return now < expirationDate
  }

  const getTimeRemainingFn = () => {
    if (!subscription) return "No subscription"
    const now = new Date()
    const expirationDate = new Date(subscription.expirationDate)
    const diff = expirationDate.getTime() - now.getTime()

    if (diff <= 0) return "Expired"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h remaining`
    if (hours > 0) return `${hours}h ${minutes}m remaining`
    return `${minutes}m remaining`
  }

  const getSubscriptionProgressFn = () => {
    if (!subscription) return 0
    const now = new Date()
    const createdDate = new Date(subscription.createdAt || subscription.$createdAt)
    const expirationDate = new Date(subscription.expirationDate)
    const totalDuration = expirationDate.getTime() - createdDate.getTime()
    const elapsed = now.getTime() - createdDate.getTime()
    const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))
    return progress
  }

  const onInputFocus = () => {
    if (!user) {
      router.push("/signup")
    }
  }

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Globe className="h-6 w-6" />
              <span className={`text-xl font-bold ${bodoni.className}`}>Floptas</span>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-black text-white text-sm">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-4">
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="font-medium text-sm">
                          {subscription?.subscriptionType === "paid" ? "$2.99/month" : "Free Trial"}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{getTimeRemainingFn()}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Usage</span>
                          <span>{Math.round(getSubscriptionProgressFn())}%</span>
                        </div>
                        <Progress value={getSubscriptionProgressFn()} className="h-2" />
                      </div>

                      <DropdownMenuItem
                        onClick={() => {
                          logout()
                          router.push("/signup")
                        }}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => router.push("/signup")} className="bg-black text-white hover:bg-gray-800">
                  Sign up
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${bodoni.className}`}>Extract Any Website Design</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Copy pixel-perfect designs from any website. Get clean HTML, CSS, and JavaScript ready for your AI assistant
            to integrate.
          </p>

          {/* URL Input */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={onInputFocus}
                placeholder="Enter website URL to extract design..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                disabled={isAnalyzing}
              />
              <Button
                onClick={handleAnalyzeClickFn}
                disabled={!url || isAnalyzing}
                className="px-6 py-3 bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {isAnalyzing ? "Analyzing..." : "Extract"}
              </Button>
            </div>

            {/* Analysis Progress */}
            {isAnalyzing && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-center">
                <motion.p
                  key={analysisStep}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-gray-600"
                >
                  {analysisStep}
                </motion.p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Proposal URLs Section 1 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Popular Design Inspirations</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {[
              { name: "cursor.com", url: "https://cursor.com" },
              { name: "framer.com", url: "https://framer.com" },
              { name: "lovable.dev", url: "https://lovable.dev" },
              { name: "linear.app", url: "https://linear.app" },
              { name: "notion.com", url: "https://notion.com" },
            ].map((site) => (
              <button
                key={site.name}
                onClick={() => handleProposalClickFn(site.url)}
                className="p-4 border border-gray-200 rounded-lg hover:border-black transition-colors text-center"
                disabled={isAnalyzing}
              >
                <div className="font-medium text-sm">{site.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Infinite Logo Slider */}
        <div className="mb-16 overflow-hidden">
          <div className="flex animate-scroll">
            <div className="flex space-x-8 animate-scroll">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex space-x-8 shrink-0">
                  <img src="/images/logos/cursor-text.svg" alt="Cursor" className="h-8 opacity-60" />
                  <img src="/images/logos/v0.svg" alt="v0" className="h-8 opacity-60" />
                  <img src="/images/logos/replit-text.svg" alt="Replit" className="h-8 opacity-60" />
                  <img src="/images/logos/windsurf-text.svg" alt="Windsurf" className="h-8 opacity-60" />
                  <img src="/images/logos/trae-text.svg" alt="Trae" className="h-8 opacity-60" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Proposal URLs Section 2 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Featured Websites</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: "playerzero.ai",
                url: "https://playerzero.ai",
                image: "/placeholder.svg?height=200&width=300",
              },
              {
                name: "apresentforce.com",
                url: "https://apresentforce.com",
                image: "/placeholder.svg?height=200&width=300",
              },
              {
                name: "portfolite.framer.website",
                url: "https://portfolite.framer.website/",
                image:
                  "https://fra.cloud.appwrite.io/v1/storage/buckets/68968fe8001266b9f411/files/689e40cd000ed8efd26d/view?project=68802a5d00297352e520&mode=admin",
              },
            ].map((site) => (
              <button
                key={site.name}
                onClick={() => handleProposalClickFn(site.url)}
                className="group border border-gray-200 rounded-lg overflow-hidden hover:border-black transition-colors"
                disabled={isAnalyzing}
              >
                <div className="aspect-video bg-gray-100">
                  <img
                    src={site.image || "/placeholder.svg"}
                    alt={site.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <div className="font-medium text-sm">{site.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Results Section */}
        {generatedCode && (
          <div className="mt-16 border-t border-gray-200 pt-16">
            <h2 className="text-2xl font-bold text-center mb-8">Extracted Design Preview</h2>

            {/* Preview */}
            <div className="mb-8">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-gray-600 ml-4">{url}</span>
                  </div>
                </div>
                <div className="bg-white">
                  <iframe
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <style>${generatedCode.CSS}</style>
                        </head>
                        <body>
                          ${generatedCode.HTML}
                          <script>${generatedCode.JS}</script>
                        </body>
                      </html>
                    `}
                    className="w-full h-96 border-0"
                    title="Preview"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={copyPrompt} className="bg-black text-white hover:bg-gray-800">
                <Copy className="mr-2 h-4 w-4" />
                {copySuccess ? "Copied!" : "Copy Prompt"}
              </Button>
              <Button
                onClick={downloadPrompt}
                variant="outline"
                className="border-black text-black hover:bg-gray-100 bg-transparent"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Prompt
              </Button>
              <Button
                onClick={() => setShowFrameworkDialog(true)}
                variant="outline"
                className="border-black text-black hover:bg-gray-100"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Code
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Framework Selection Dialog */}
      <Dialog open={showFrameworkDialog} onOpenChange={setShowFrameworkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Framework</DialogTitle>
            <DialogDescription>Select the framework format for your downloaded code.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {Object.entries(frameworkOptions).map(([key, label]) => (
              <Button
                key={key}
                variant={selectedFramework === key ? "default" : "outline"}
                onClick={() => setSelectedFramework(key as FrameworkKey)}
                className="text-left justify-start"
              >
                {label}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                downloadCode()
                setShowFrameworkDialog(false)
              }}
              disabled={!generatedCode}
            >
              <Download className="mr-2 h-4 w-4" />
              Download file
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

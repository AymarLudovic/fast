"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Globe, ArrowUp, Copy, Download, LogOut } from "lucide-react"
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
  const [generatedCode, setGeneratedCode] = useState<string>("")
  const [showCodePreview, setShowCodePreview] = useState<boolean>(false)
  const [analysisMessage, setAnalysisMessage] = useState("")

  // Demo urls and cards

  // Demo urls and cards
  const proposalUrlsSection1 = ["cursor.com", "framer.com", "lovable.dev", "linear.app", "notion.com"]
  const proposalUrlsSection2 = ["playerzero.ai", "apresentforce.com", "portfolite.framer.website"]
  const proposalUrlImages: Record<string, string> = {
    "playerzero.ai": "https://fra.cloud.appwrite.io/v1/storage/buckets/68968fe8001266b9f411/files/68969cd6000b7adb25e0/view?project=68802a5d00297352e520&mode=admin",
    "apresentforce.com": "https://fra.cloud.appwrite.io/v1/storage/buckets/68968fe8001266b9f411/files/68969d45000bcf13ad68/view?project=68802a5d00297352e520&mode=admin",
    "portfolite.framer.website": "https://fra.cloud.appwrite.io/v1/storage/buckets/68968fe8001266b9f411/files/689e40cd000ed8efd26d/view?project=68802a5d00297352e520&mode=admin",
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

  const analyzeSite = async (urlToAnalyze = url) => {
    if (!urlToAnalyze) return
    setLoading(true)
    setError(null)
    setResult(null)
    setCopyStatus(null)
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
          setLoading(false)
          return
        } catch (err) {
          if (attempt === MAX_SITE_FETCH_ATTEMPTS) {
            setError("⌐ Analysis failed after multiple attempts.")
            setLoading(false)
          } else {
            await new Promise((res) => setTimeout(res, 2000))
          }
        }
      }
    } catch (err) {
      setError(`Analysis failed: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }

  const redirectToAuth = () => router.push("/signup")

  const handleAnalyzeClick = () => {
    if (!user) {
      router.push("/signup")
      return
    }
    if (!isSubscriptionValid()) {
      router.push("/subscription")
      return
    }
    // Continue with analysis...
    analyzeSite()
  }

  const handleProposalClick = (proposalUrl: string) => {
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
  import { onMount } from "svelte";
  onMount(() => {
    const style = document.createElement("style"); style.id="extracted-styles"; style.textContent=\`${CSS}\`; document.head.appendChild(style);
    const script = document.createElement("script"); script.id="extracted-scripts"; script.innerHTML=\`${JS}\`; document.body.appendChild(script);
    return () => { try { style.remove(); script.remove(); } catch {} };
  });
</script>
<div>{@html \`${HTML}\`}</div>
`,
        }
      case "vue-vite":
        return {
          filename: "src/App.vue",
          code: `<script setup>
import { onMounted } from "vue";
onMounted(() => {
  const style = document.createElement("style"); style.id="extracted-styles"; style.textContent=\`${CSS}\`; document.head.appendChild(style);
  const script = document.createElement("script"); script.id="extracted-scripts"; script.innerHTML=\`${JS}\`; document.body.appendChild(script);
  return () => { try { style.remove(); script.remove(); } catch {} };
});
</script>
<template><div v-html="\`${HTML}\`"></div></template>
`,
        }
      case "nuxt":
        return {
          filename: "pages/preview.vue",
          code: `<script setup>
import { onMounted } from "vue";
onMounted(() => {
  const style = document.createElement("style"); style.id="extracted-styles"; style.textContent=\`${CSS}\`; document.head.appendChild(style);
  const script = document.createElement("script"); script.id="extracted-scripts"; script.innerHTML=\`${JS}\`; document.body.appendChild(script);
  return () => { try { style.remove(); script.remove(); } catch {} };
});
</script>
<template><div v-html="\`${HTML}\`"></div></template>
`,
        }
      case "html":
        return {
          filename: "index.html",
          code: `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Combined Export</title><style>
${result.fullCSS}
</style></head><body>
${result.fullHTML}
<script>
${result.fullJS}
</script></body></html>`,
        }
      default:
        return { filename: "", code: "" }
    }
  }

  useEffect(() => {
    if (!result) return
    const { filename, code } = gen(selectedFramework)
    setGeneratedFilename(filename)
    setGeneratedCode(code)
  }, [selectedFramework, result])

const buildPrompt = (): string => {
    if (!result) return ""

    const libs = result.requiredCdnUrls && result.requiredCdnUrls.length
      ? `\nDetected external libraries (CDN):\n${result.requiredCdnUrls.join("\n")}\n\n`
      : "";

    return `
You are an expert AI developer specialized in integrating designs into web projects.
Your task is to take the provided HTML, CSS, and JS code blocks and integrate them into a new project based on a user-chosen framework.
You MUST follow these instructions precisely:

1.  **Do NOT create a replica.** Your role is not to recreate the design from scratch. Your role is to perform a direct "copy-paste and adapt" operation.
2.  **HTML:** Take the provided HTML code. Adapt it to the syntax of the chosen framework (e.g., JSX for React, template for Vue) while keeping its structure and all CSS class names absolutely intact. Do not change any class names, div structure, or element hierarchy.
3.  **CSS:** Take the provided CSS code and place it in a dedicated CSS file. Ensure this CSS file is properly linked and accessible by the HTML component to load the design perfectly.
4.  **JS:** Take the provided JavaScript code. For frameworks like React, encapsulate this JS code within a <script> tag or adapt it to JSX/TSX as needed to ensure all animations and dynamic functionalities are preserved.
5.  **Libraries:** If external libraries (CDNs) are listed, ensure they are properly included in the project's head or body as required to support the design's animations and features.

Here are the code blocks you need to integrate:
${libs}

**HTML Code:**
\`\`\`html
${result.fullHTML}
\`\`\`

**CSS Code:**
\`\`\`css
${result.fullCSS}
\`\`\`

**JS Code:**
\`\`\`javascript
${result.fullJS}
\`\`\`

IMPORTANT: Your only job is to integrate this code. Do NOT make any design or structural changes. Do NOT try to 'improve' or 're-factor' the code. Just copy, paste, and adapt it to the target framework, preserving the original design pixel-perfectly.
`;
  };
  


  const handleCopyPrompt = () => {
    if (!result) return
    const prompt = buildPrompt()
    if (!prompt) return
    copyToClipboard(prompt, "prompt")
  }

  const handleDownloadPrompt = () => {
    if (!result) return
    const prompt = buildPrompt()
    if (!prompt) return
    createDownloadLink(prompt, "prompt.txt", "text/plain")
  }

const createOptimizedPreview = () => {
    if (!result) return ""
    const escapeForScript = (s: string) => s.replace(/<\/script>/gi, "<\\/script>")
    const escapeForStyle = (s: string) => s.replace(/<\/style>/gi, "<\\/style>")
    const cdnTags = result.requiredCdnUrls
      .map((url) =>
        url.endsWith(".css") ? ` <link rel="stylesheet" href="${url}" crossorigin="anonymous">` : ` <script src="${url}" crossorigin="anonymous"></script>`,
      )
      .join("\n")
    const animationCSSRaw = result.animationFiles
      .filter((f) => f.type === "css")
      .map((f) => f.content)
      .join("\n\n")
    const animationJSRaw = result.animationFiles
      .filter((f) => f.type === "js")
      .map((f) => f.content)
      .join("\n\n")
    const animationInitScriptRaw = `async function initializeAnimations(){await new Promise(r=>setTimeout(r,2000));if(typeof gsap!=='undefined'){try{gsap.set("*",{clearProps:"all"});const E=document.querySelectorAll('h1,h2,h3,.hero,.title,[class*="fade"],[class*="slide"],[class*="animate"]');if(E.length>0){gsap.from(E,{opacity:0,y:50,duration:1,stagger:0.1,ease:"power2.out"})}if(typeof ScrollTrigger!=='undefined'){gsap.registerPlugin(ScrollTrigger);gsap.utils.toArray('[data-scroll], .scroll-trigger').forEach(el=>{gsap.from(el,{opacity:0,y:100,duration:1,scrollTrigger:{trigger:el,start:"top 80%",end:"bottom 20%",toggleActions:"play none none reverse"}})})}}catch(e){}}if(typeof THREE!=='undefined'){const canvas=document.querySelector('canvas')||document.querySelector('#three-canvas');if(canvas){try{const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(75,canvas.clientWidth/canvas.clientHeight,0.1,1000);const renderer=new THREE.WebGLRenderer({canvas:canvas,alpha:true});renderer.setSize(canvas.clientWidth,canvas.clientHeight);const geometry=new THREE.BufferGeometry();const vertices=[];for(let i=0;i<1000;i++){vertices.push((Math.random()-0.5)*2000,(Math.random()-0.5)*2000,(Math.random()-0.5)*2000)}geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));const material=new THREE.PointsMaterial({color:0xffffff,size:2});const particles=new THREE.Points(geometry,material);scene.add(particles);camera.position.z=1000;function animate(){requestAnimationFrame(animate);particles.rotation.x+=0.001;particles.rotation.y+=0.001;renderer.render(scene,camera)}animate()}catch(e){}}}if(typeof AOS!=='undefined'){try{AOS.init({duration:1000,once:false,mirror:true,offset:100})}catch(e){}}if(typeof lottie!=='undefined'){try{document.querySelectorAll('[data-lottie], .lottie, [data-animation-path]').forEach(el=>{const path=el.dataset.lottie||el.dataset.animation-path;if(path){lottie.loadAnimation({container:el,renderer:'svg',loop:true,autoplay:true,path})}})}catch(e){}}}if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',initializeAnimations)}else{initializeAnimations()}`
    const safeAnimationCSS = escapeForStyle(animationCSSRaw)
    const safeFullCSS = escapeForStyle(result.fullCSS)
    const safeAnimationJS = escapeForScript(animationJSRaw)
    const safeInitScript = escapeForScript(animationInitScriptRaw)
    const safeFullJS = escapeForScript(result.fullJS)
    const previewHtml = `<!DOCTYPE html> <html lang="en"> <head> <base href="${result.baseURL}"> <title>Extracted design preview</title> <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"> ${cdnTags} <style id="animation-styles"> ${safeAnimationCSS} </style> <style id="regular-styles"> ${safeFullCSS} </style> </head> <body> ${result.fullHTML} <script>${safeInitScript}</script> <script>${safeAnimationJS}</script> <script>${safeFullJS}</script> </body></html>`
    return previewHtml
      }

  const HeaderAction = () => {
    if (!isAuthReady) return null
    if (user) {
      const email = user.email || "user"
      const fallback = email.slice(0, 2).toUpperCase()
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-[32px] rounded-[13px] bg-transparent">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarFallback>{fallback}</AvatarFallback>
              </Avatar>
              {email}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {subscription && (
              <div className="p-3 border-b">
                <div className="text-sm font-medium mb-2">
                  {subscription.subscriptionType === "trial" ? "Free Trial" : "$2.99/month"}
                </div>
                <div className="text-xs text-gray-600 mb-2">{getTimeRemaining()}</div>
                <Progress value={getSubscriptionProgress()} className="h-2" />
              </div>
            )}
            <DropdownMenuItem
              onClick={async () => {
                await logout()
                router.replace("/")
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
    return (
      <a
        href="/signup"
        className="h-[32px] w-auto px-5 text-sm flex items-center justify-center rounded-[13px] bg-black text-white font-semibold transition-opacity hover:opacity-90"
      >
        Sign up
      </a>
    )
  }

  const inputPlaceholder = !user ? "Sign up to analyze (you'll be redirected)" : "https://example.com"

  const onInputFocus = () => {
    if (!user) {
      router.push("/signup")
    }
    // Removed subscription check from input focus - only check when analyzing
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden p-4 sm:p-8">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-12">
        <svg
          className="h-[20px] w-[20px]"
          width="36"
          height="36"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
          fill="#111"
        >
          <rect x="0" y="0" width="32" height="32" rx="10" />
        </svg>
        <HeaderAction />
      </header>

      <div className="max-w-4xl mx-auto p-6 sm:p-10 pb-20">
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
            <div className="p-2">
              <Globe size={20} className="text-black" />
            </div>
            <input
              type="text"
              placeholder={inputPlaceholder}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={onInputFocus}
              className={`flex-grow h-full bg-transparent text-black focus:outline-none focus:ring-0 placeholder-[#888] text-sm`}
            />
            <button
              onClick={handleAnalyzeClick}
              disabled={loading}
              className="h-[35px] w-[35px] bg-[#111] rounded-[8px] flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed mr-1"
            >
              {loading ? (
                <div className="bg-white rounded-[6px] w-4 h-4 animate-pulse" />
              ) : (
                <ArrowUp size={20} className="text-white" />
              )}
            </button>
          </div>
        </div>
{loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center text-sm text-gray-500"
          >
            <motion.p
              key={analysisMessage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {analysisMessage}
            </motion.p>
          </motion.div>
        )}

        {error && (
          <div className="mt-4 text-center text-sm text-red-500">
            <p>{error}</p>
          </div>
        )}
        {/* Try chips */}
        {!loading && !result && (
          <div className="flex justify-center items-center gap-3 flex-wrap mb-6">
            <span className="text-sm text-gray-500">Try:</span>
            {proposalUrlsSection1.map((pUrl) => (
              <Button
                key={pUrl}
                variant="outline"
                className="h-[30px] rounded-[25px] w-auto  p-1 px-2 flex gap-1 justify-center items-center text-black bg-[#fafafa] transition-colors duration-200"
                onClick={() => handleProposalClick(pUrl)}
              >
                <Globe size={16} color="#000" />
                <p className="text-sm sm:text-base font-medium truncate">{pUrl}</p>
                <ArrowUp size={16} color="#000" />
              </Button>
            ))}
          </div>
        )}

        {/* RESTORED: Proposal cards grid */}
        {!loading && !result && (
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-12">
              {proposalUrlsSection2.map((pUrl) => (
              <Button
                key={pUrl}
                variant="outline"
                className="h-[300px] w-[300px] relative flex flex-col justify-center items-center text-black bg-white rounded-xl  transition-colors duration-200"
                onClick={() => handleProposalClick(pUrl)}
              >
                {proposalUrlImages[pUrl] && (
                  <img src={proposalUrlImages[pUrl]} alt={pUrl} className="w-[90%] h-full object-contain" />
                )}
                <p className="text-sm absolute bottom-2 left-2 bg-transparent p-1 px-2 backdrop-blur-3xl sm:text-base font-medium truncate">{pUrl}</p>
              </Button>
            ))}
            </div>
          </div>
        )}

        {!loading && !result && <LogoMarquee />}

        {error && <p className="text-red-600 bg-red-50 p-3 rounded-lg text-center mb-6">{error}</p>}

        {result && (
          <div className="space-y-12">
            <div>
              <h3 className="text-2xl font-bold text-black mb-4">UI preview</h3>
              <iframe
                title="UI preview"
                className="w-full h-96 border border-gray-200 rounded-xl bg-white"
                srcDoc={createOptimizedPreview()}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="h-[40px] w-auto flex items-center rounded-[14px] bg-white shadow-md border border-[#e5e5e5]">
              <Button
                onClick={handleCopyPrompt}
                variant="ghost"
                className="h-[38px] rounded-[12px] text-sm font-medium px-4"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy prompt
              </Button>
            </div>
            <div className="h-[40px] w-auto flex items-center rounded-[14px] bg-white shadow-md border border-[#e5e5e5]">
              <Button
                onClick={handleDownloadPrompt}
                variant="ghost"
                className="h-[38px] rounded-[12px] text-sm font-medium px-4"
              >
                <Download className="mr-2 h-4 w-4" />
                Download prompt
              </Button>
            </div>
            <div className="h-[40px] w-auto flex items-center rounded-[14px] bg-white shadow-md border border-[#e5e5e5]">
              <Button
                onClick={() => setShowExportModal(true)}
                variant="ghost"
                className="h-[38px] rounded-[12px] text-sm font-medium px-4"
              >
                <Download className="mr-2 h-4 w-4" />
                Download code
              </Button>
            </div>
            {copyStatus?.id === "prompt" && (
              <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-md">{copyStatus.message}</span>
            )}
          </div>
        </div>
      )}

      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Export code</DialogTitle>
            <DialogDescription>
              Select a framework and preview the single-file export. Then download or copy it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="framework">Framework</Label>
                <select
                  id="framework"
                  className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                  value={selectedFramework}
                  onChange={(e) => setSelectedFramework(e.target.value as FrameworkKey)}
                >
                  {Object.entries(frameworkLabel).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="inline-flex items-center justify-between w-full">
                  <span>View code</span>
                  <Switch checked={showCodePreview} onCheckedChange={setShowCodePreview} />
                </Label>
                <input
                  readOnly
                  value={generatedFilename}
                  className="w-full h-10 rounded-md border border-gray-200 bg-gray-50 px-3 text-xs"
                />
              </div>
            </div>
            {showCodePreview && (
              <div className="rounded-lg border bg-[#0b0c10] border-gray-800 overflow-hidden">
                <div className="px-3 py-2 text-xs text-gray-300 bg-[#0f1117] border-b border-gray-800 flex justify-between">
                  <span>{generatedFilename}</span>
                  <span className="text-gray-500">readonly preview</span>
                </div>
                <pre className="max-h-[420px] overflow-auto text-xs leading-5 p-4 text-gray-100">
                  <code>{generatedCode}</code>
                </pre>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="secondary"
              onClick={() => copyToClipboard(generatedCode, "export-code")}
              disabled={!generatedCode}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy code
            </Button>
            <Button
              onClick={() => {
                if (!generatedCode || !generatedFilename) return
                const mime = generatedFilename.endsWith(".html")
                  ? "text/html"
                  : generatedFilename.endsWith(".astro")
                    ? "text/plain"
                    : "text/plain"
                const flat = generatedFilename.replaceAll("/", "_")
                createDownloadLink(generatedCode, flat, mime)
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

"use client"

import { useEffect, useState } from "react"
import { Globe, Sparkles } from "lucide-react"
import { Client, Databases } from "appwrite"
import { formatDistanceToNow } from "date-fns"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase-client"

const client = new Client().setEndpoint("https://fra.cloud.appwrite.io/v1").setProject("68802a5d00297352e520")

const databases = new Databases(client)

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<any | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isSubscriptionValid, setIsSubscriptionValid] = useState<boolean>(false)
  const [discountCode, setDiscountCode] = useState("")
  const ORIGINAL_PRICE = 10.0
  const [discountedPrice, setDiscountedPrice] = useState<number>(ORIGINAL_PRICE)
  const [appliedDiscountInfo, setAppliedDiscountInfo] = useState<any | null>(null)
  const [discountMessage, setDiscountMessage] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [currentUid, setCurrentUid] = useState<string | null>(null)

  const router = useRouter()

  const checkSubscriptionValidity = (subscriptionData: any) => {
    if (subscriptionData && subscriptionData.expirationDate) {
      const expirationDate = new Date(subscriptionData.expirationDate)
      const now = new Date()
      if (expirationDate > now) {
        setIsSubscriptionValid(true)
        const timeLeft = expirationDate.getTime() - now.getTime()
        setTimeRemaining(timeLeft)
      } else {
        setIsSubscriptionValid(false)
        setTimeRemaining(0)
      }
    } else {
      setIsSubscriptionValid(false)
      setTimeRemaining(0)
    }
  }

  const refresh = async () => {
    try {
      const u = auth.currentUser
      if (!u) return

      const promise = databases.getDocument("boodupy-3000", "subscription-300", u.uid)

      promise.then(
        (response) => {
          setSubscription(response)
          checkSubscriptionValidity(response)
        },
        (error) => {
          console.error("Error fetching subscription:", error)
          setSubscription(null)
          setIsSubscriptionValid(false)
          setTimeRemaining(0)
        },
      )
    } catch (e) {
      console.error("Error fetching subscription:", e)
      setSubscription(null)
      setIsSubscriptionValid(false)
      setTimeRemaining(0)
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user?.uid) {
        setCurrentUid(user.uid)
        await refresh()
      } else {
        router.push("/signup")
      }
    })
    return () => unsub()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountMessage("Veuillez entrer un code de réduction.")
      if (appliedDiscountInfo) {
        setDiscountedPrice(ORIGINAL_PRICE)
        setAppliedDiscountInfo(null)
      }
      return
    }
    setDiscountMessage("Checking discount validity...")
    try {
      const promise = databases.listDocuments("boodupy-3000", "discount-codes", [])

      promise.then(
        (response) => {
          const discountDocs = response.documents.filter((doc) => doc.code === discountCode.trim().toUpperCase())

          if (discountDocs.length > 0) {
            const promo = discountDocs[0]
            const expirationDate = new Date(promo.expiresAt)
            const now = new Date()
            if (expirationDate < now) {
              setDiscountMessage("Ce code de réduction a expiré.")
              setDiscountedPrice(ORIGINAL_PRICE)
              setAppliedDiscountInfo(null)
            } else {
              const reductionPercentage = Number.parseFloat(promo.percent)
              if (isNaN(reductionPercentage) || reductionPercentage <= 0 || reductionPercentage > 100) {
                setDiscountMessage("Code de réduction invalide (valeur de réduction incorrecte).")
                setDiscountedPrice(ORIGINAL_PRICE)
                setAppliedDiscountInfo(null)
                return
              }
              const newPrice = ORIGINAL_PRICE - ORIGINAL_PRICE * (reductionPercentage / 100)
              setDiscountedPrice(Math.max(0.01, newPrice))
              setAppliedDiscountInfo(promo)
              setDiscountMessage(
                `Discount "${promo.code}" applied ! Reduction of ${reductionPercentage}%. New price : $${newPrice.toFixed(
                  2,
                )}`,
              )
            }
          } else {
            setDiscountMessage("Discount code not found or available")
            setDiscountedPrice(ORIGINAL_PRICE)
            setAppliedDiscountInfo(null)
          }
        },
        (error) => {
          console.error("Erreur lors de la vérification du code de réduction :", error)
          setDiscountMessage("Erreur serveur lors de l'application du code.")
          setDiscountedPrice(ORIGINAL_PRICE)
          setAppliedDiscountInfo(null)
        },
      )
    } catch (error) {
      console.error("Erreur lors de la vérification du code de réduction :", error)
      setDiscountMessage("Erreur serveur lors de l'application du code.")
      setDiscountedPrice(ORIGINAL_PRICE)
      setAppliedDiscountInfo(null)
    }
  }

  const activatePaid = async () => {
    try {
      const u = auth.currentUser
      if (!u) return

      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + 30) // 30 days from now

      const promise = databases.updateDocument("boodupy-3000", "subscription-300", u.uid, {
        subscriptionType: "paid",
        expirationDate: expirationDate.toISOString(),
      })

      promise.then(
        (response) => {
          console.log("Subscription activated:", response)
          refresh()
        },
        (error) => {
          console.error("Erreur lors de l'activation de l'abonnement:", error)
          setError("Erreur lors de l'activation de l'abonnement.")
        },
      )
    } catch (err) {
      console.error("Erreur lors de l'activation de l'abonnement:", err)
      setError("Erreur lors de l'activation de l'abonnement.")
    }
  }

  const timeLeftString =
    timeRemaining !== null ? formatDistanceToNow(new Date(Date.now() + timeRemaining), { addSuffix: true }) : ""

  return (
    <div className="h-screen w-full text-black overflow-y-auto">
      <div className="fixed top-12 left-[12%] lg:left-[48%]">
        <div className="flex items-center gap-1">
          <Sparkles size={18} />
          <span className="font-semibold text-3xl">Studio</span>
        </div>
      </div>

      <div className="absolute flex-col overflow-y-auto md:flex-row lg:flex-row bottom-0 bg-white h-[80%] md:h-[60%] lg:h-[60%] rounded-t-[15px] p-2 w-full lg:border-t flex items-center justify-center gap-3 border-[#EEE]">
        {/* Plan */}
        <div className="h-[90%] flex flex-col gap-2 p-3 w-[90%] lg:w-[40%] md:w-[40%] border border-[#EEE] rounded-[20px]">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl md:text-3xl">Pro</h2>
            <div className="py-1 px-2 rounded-[12px] select-none text-white bg-blue-600 text-xs md:text-sm h-[26px] md:h-[30px] flex items-center justify-center">
              upgrade
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl md:text-5xl font-semibold">${discountedPrice.toFixed(2)}</h2>
            {discountedPrice < ORIGINAL_PRICE && (
              <span className="text-lg md:text-xl line-through text-gray-500">${ORIGINAL_PRICE.toFixed(2)}</span>
            )}
            <p className="font-medium text-sm md:text-base">/month</p>
          </div>
          <ul className="flex flex-col gap-1 text-sm md:text-base">
            <li className="flex items-center gap-x-2 py-1">
              <span className="inline-block w-5 h-5 rounded-full bg-black/90" />
              <p className="font-medium">Build unlimited apps and websites</p>
            </li>
            <li className="flex items-center gap-x-2 py-1">
              <span className="inline-block w-5 h-5 rounded-full bg-black/80" />
              <p className="font-medium">No messages or tokens limits</p>
            </li>
            <li className="flex items-center gap-x-2 py-1">
              <Globe size={20} className="shrink-0" />
              <p className="font-medium">Fast deploy online.</p>
            </li>
          </ul>

          <div className="mt-auto">
            {isSubscriptionValid ? (
              <button
                style={{ border: "1px solid #eee" }}
                className="w-full h-[40px] md:h-[48px] max-w-[300px] opacity-[0.6] pointer-events-none rounded-[15px] bg-white flex items-center justify-center text-sm md:text-base"
              >
                Subscribed {timeLeftString}
              </button>
            ) : (
              currentUid && (
                <PayPalScriptProvider
                  options={{
                    clientId: "AVrI1_PndcFEeGuj8PH9qyOQofIy0_MaSNaOZwstDJQZWW6bhc-CRnEcpAqi6fzonlA2pjo-9W-bBG5H",
                    currency: "USD",
                    intent: "capture",
                  }}
                >
                  <PayPalButtons
                    style={{ layout: "vertical", height: 48 }}
                    createOrder={(data, actions) =>
                      actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [{ amount: { currency_code: "USD", value: discountedPrice.toFixed(2) } }],
                      })
                    }
                    onApprove={async (data, actions) => {
                      const details = await actions.order?.capture()
                      if (details && currentUid) {
                        alert("Transaction completed by " + (details.payer?.name?.given_name || "user"))
                        await activatePaid()
                      } else {
                        setError("La transaction PayPal a échoué.")
                      }
                    }}
                    onError={(err) => {
                      console.error("PayPal Error:", err)
                      setError("Une erreur est survenue avec PayPal. Veuillez réessayer.")
                    }}
                  />
                </PayPalScriptProvider>
              )
            )}
          </div>
        </div>

        {/* Discount column */}
        <div className="h-[90%] flex flex-col gap-2 p-3 w-[90%] lg:w-[40%] md:w-[40%] border border-[#EEE] rounded-[20px]">
          <h1 className="text-2xl md:text-3xl font-semibold">Apply Discount.</h1>
          <p className="text-sm md:text-base text-[#888]">
            Apply a discount code to reduce the amount for your next billing cycle.
          </p>
          <div>
            <input
              type="text"
              placeholder="Discount Code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              className="w-full px-3 py-3 bg-white border-2 border-[#EEE] placeholder:text-gray-500 focus-visible:border-blue-500 rounded-[12px] text-sm md:text-base mb-2"
              disabled={isSubscriptionValid}
            />
          </div>
          {discountMessage && (
            <p className={`text-xs md:text-sm mb-2 ${appliedDiscountInfo ? "text-green-600" : "text-[#888]"}`}>
              {discountMessage}
            </p>
          )}
          <button
            onClick={handleApplyDiscount}
            className={`w-full h-[40px] md:h-[48px] max-w-[300px] text-white rounded-[12px] bg-black flex items-center justify-center text-sm md:text-base ${
              isSubscriptionValid ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
            }`}
            disabled={isSubscriptionValid}
          >
            Apply Code
          </button>
        </div>
      </div>

      {/* Trial timer */}
      {isSubscriptionValid && timeRemaining && timeRemaining > 0 && (
        <div className="fixed bottom-5 right-4 p-4 h-auto flex flex-col gap-2 w-[260px] border border-[#EEE] rounded-[15px] bg-white shadow-md">
          <div>
            <p className="font-semibold text-sm">
              <span className="text-sm">🚀</span> Your trial ends{" "}
              {formatDistanceToNow(new Date(Date.now() + timeRemaining), { addSuffix: true })}
            </p>
          </div>
          <div className="flex gap-1 justify-center w-full items-center">
            {[...Array(4)].map((_, index) => {
              const totalTime = 30 * 24 * 60 * 60 * 1000
              const timeElapsed = totalTime - timeRemaining
              const progress = Math.min(1, timeElapsed / totalTime)
              const barProgress = Math.min(1, Math.max(0, progress * 4 - index))
              return (
                <div key={index} className="h-[5px] flex-1 rounded-[8px] bg-[#EEE] overflow-hidden">
                  <div
                    className="h-full bg-black transition-all duration-300 ease-out"
                    style={{ width: `${barProgress * 100}%` }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Error bubble */}
      {error && (
        <div className="fixed bottom-5 left-4 p-3 text-sm border border-red-200 bg-red-50 text-red-700 rounded-md shadow">
          {error}
        </div>
      )}
    </div>
  )
}

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
  const ORIGINAL_PRICE = 2.99 // Updated price from $10 to $2.99
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
    <div className="min-h-screen bg-white text-black">
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-black" />
              <span className="font-semibold text-xl">Studio</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-16 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Upgrade to Pro</h1>
            <p className="text-gray-600">Unlock unlimited design extraction and advanced features</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold">Pro Plan</h2>
                <div className="bg-black text-white px-3 py-1 rounded-full text-sm font-medium">Upgrade</div>
              </div>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold">${discountedPrice.toFixed(2)}</span>
                {discountedPrice < ORIGINAL_PRICE && (
                  <span className="text-xl line-through text-gray-400">${ORIGINAL_PRICE.toFixed(2)}</span>
                )}
                <span className="text-gray-600">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                  <span>Build unlimited apps and websites</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                  <span>No messages or tokens limits</span>
                </li>
                <li className="flex items-center gap-3">
                  <Globe size={16} />
                  <span>Fast deploy online</span>
                </li>
              </ul>

              <div className="mt-auto">
                {isSubscriptionValid ? (
                  <button className="w-full h-12 bg-gray-100 text-gray-500 rounded-xl font-medium cursor-not-allowed">
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

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-2">Apply Discount</h2>
              <p className="text-gray-600 mb-6">
                Apply a discount code to reduce the amount for your next billing cycle.
              </p>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  disabled={isSubscriptionValid}
                />

                {discountMessage && (
                  <p className={`text-sm ${appliedDiscountInfo ? "text-green-600" : "text-gray-600"}`}>
                    {discountMessage}
                  </p>
                )}

                <button
                  onClick={handleApplyDiscount}
                  className={`w-full h-12 bg-black text-white rounded-xl font-medium transition-colors ${
                    isSubscriptionValid ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
                  }`}
                  disabled={isSubscriptionValid}
                >
                  Apply Code
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isSubscriptionValid && timeRemaining && timeRemaining > 0 && (
        <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-xl p-4 shadow-lg max-w-xs">
          <p className="font-medium text-sm mb-3">
            Trial ends {formatDistanceToNow(new Date(Date.now() + timeRemaining), { addSuffix: true })}
          </p>
          <div className="flex gap-1">
            {[...Array(4)].map((_, index) => {
              const totalTime = 3 * 24 * 60 * 60 * 1000 // 3 days
              const timeElapsed = totalTime - timeRemaining
              const progress = Math.min(1, timeElapsed / totalTime)
              const barProgress = Math.min(1, Math.max(0, progress * 4 - index))
              return (
                <div key={index} className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-black transition-all duration-300"
                    style={{ width: `${barProgress * 100}%` }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-6 left-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-lg max-w-sm">
          {error}
        </div>
      )}
    </div>
  )
}

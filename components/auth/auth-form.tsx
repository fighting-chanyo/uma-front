"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false) // この行を追加
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)

  useEffect(() => {
    // アニメーション完了後にフォームを表示
    const timer = setTimeout(() => {
      setShowForm(true)
    }, 2000)

    const completeTimer = setTimeout(() => {
      setAnimationComplete(true)
    }, 2500)

    return () => {
      clearTimeout(timer)
      clearTimeout(completeTimer)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        // 1. まずメールアドレスの存在チェックを行う
        const { data: emailExists, error: rpcError } = await supabase.rpc("check_email_exists", {
          email_to_check: email,
        })

        if (rpcError) {
          console.error("メールアドレスのチェック中にエラーが発生しました:", rpcError)
          setError("エラーが発生しました。時間をおいて再度お試しください。")
          return // finallyブロックでloadingはfalseになります
        }

        // 2. 既に存在する場合、エラーを表示して処理を中断
        if (emailExists) {
          setError("このメールアドレスは既に登録されています。ログインしてください。")
          return // finallyブロックでloadingはfalseになります
        }

        // 3. 存在しない場合のみ、新規登録を実行
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (signUpError) {
          setError(signUpError.message)
        } else if (data.user) {
          setError("確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。")
        }
      } else {
        // ログイン処理は変更なし
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setError(error.message)
        } else {
          // 認証成功後、ダッシュボードなどにリダイレクト
          router.push("/")
        }
      }
    } catch (err) {
      setError("予期せぬエラーが発生しました。")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError("予期せぬエラーが発生しました。")
    } finally {
      setLoading(false)
    }
  }

  const router = useRouter()

  return (
    <div className="relative w-full max-w-md">
      <div className={`fixed inset-0 pointer-events-none z-50 ${animationComplete ? "hidden" : ""}`}>
        {/* 斜めの帯 - テキストのマスクとして機能 */}
        <div className="diagonal-slash-container">
          <div className="diagonal-slash">
            {/* 帯の中を流れるREMOTE KEIBAテキスト */}
            <div className="text-flow">
              <span className="text-flow-remote">REMOTE</span>
              <span className="text-flow-keiba">KEIBA</span>
            </div>
          </div>
        </div>
      </div>

      {/* 認証フォーム */}
      <div className={`relative transition-opacity duration-500 ${showForm ? "opacity-100" : "opacity-0"}`}>
        {/* ネオンボーダーコンテナ */}
        <div className="relative border border-cyan-500/30 bg-black/90 p-8 backdrop-blur-sm">
          {/* 角のアクセント */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500" />

          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-red-500">REMOTE</span> <span className="text-white">KEIBA</span>
            </h1>
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
            <p className="text-cyan-400 text-sm mt-4 font-mono">{isSignUp ? "アカウント登録" : "ログイン"}</p>
          </div>

          {error && <p className="text-red-500 text-center text-sm font-mono mb-4">{error}</p>}

          {/* フォーム */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-black border-cyan-500/50 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:ring-cyan-500/50 font-mono"
                placeholder="your@email.com"
              />
            </div>

            {/* ここから下の password のブロックを置き換えます */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-black border-cyan-500/50 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:ring-cyan-500/50 font-mono pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-cyan-300 transition-colors"
                  aria-label={showPassword ? "パスワードを非表示" : "パスワードを表示"}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-mono uppercase tracking-wider relative overflow-hidden group"
            >
              <span className="relative z-10">{loading ? "処理中..." : isSignUp ? "サインアップ" : "ログイン"}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-cyan-500/30" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black/90 px-2 text-cyan-400 font-mono">または</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-mono uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Googleでログイン
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
              >
                {isSignUp ? "すでにアカウントをお持ちですか？" : "アカウントを作成"}
              </button>
            </div>
          </form>

          {/* グロー効果 */}
          <div className="absolute inset-0 -z-10 blur-xl opacity-20">
            <div className="absolute top-0 left-0 w-32 h-32 bg-red-500 rounded-full" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-500 rounded-full" />
          </div>
        </div>

        {/* ステータスバー */}
        <div className="mt-4 flex items-center justify-between text-xs font-mono text-gray-500">
          <span>STATUS: READY</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            ONLINE
          </span>
        </div>
      </div>

      <style jsx>{`
        .diagonal-slash-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: black;
        }

        .diagonal-slash {
          position: absolute;
          top: 50%;
          left: -100%;
          width: 200%;
          height: 180px;
          background: linear-gradient(
            90deg,
            rgba(20, 0, 0, 0.9) 0%,
            rgba(80, 0, 0, 0.95) 15%,
            rgba(255, 0, 0, 0.9) 25%,
            rgba(0, 150, 150, 0.9) 50%,
            rgba(0, 255, 255, 0.9) 60%,
            rgba(255, 0, 0, 0.9) 75%,
            rgba(80, 0, 0, 0.95) 85%,
            rgba(20, 0, 0, 0.9) 100%
          );
          transform: translateY(-50%) rotate(-15deg);
          animation: slashIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
            slashExpand 0.8s 0.6s ease-out forwards;
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.8),
            0 0 60px rgba(255, 0, 0, 0.6),
            inset 0 0 40px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }

        @keyframes slashIn {
          from {
            left: -100%;
            height: 180px;
          }
          to {
            left: -10%;
            height: 180px;
          }
        }

        @keyframes slashExpand {
          from {
            left: -10%;
            height: 180px;
          }
          to {
            left: -50%;
            height: 300vh;
            opacity: 0;
          }
        }

        .text-flow {
          display: flex;
          gap: 3rem;
          font-size: 6rem;
          font-weight: 900;
          font-family: monospace;
          white-space: nowrap;
          position: absolute;
          left: 0;
          animation: textFlow 2.5s 0.2s ease-in-out forwards;
        }

        .text-flow-remote {
          color: #ff0000;
          text-shadow: 0 0 20px rgba(255, 0, 0, 1),
            0 0 40px rgba(255, 0, 0, 0.8),
            0 0 60px rgba(255, 0, 0, 0.6);
        }

        .text-flow {
          display: flex;
          gap: 3rem;
          font-size: 6rem;
          font-weight: 900;
          font-family: monospace;
          white-space: nowrap;
          position: absolute;
          /* 変更点: left:0 ではなく transformで制御し、画面左外から開始 */
          left: 0;
          transform: translateX(-100%);
          /* 変更点: 2.5s→1.2sに短縮し、linearで等速（または加速）させて疾走感を出す */
          animation: textFlow 1.2s 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        /* 変更点: 左の外側(-100%)から、右の外側まで一気に突き抜ける動きに変更 */
        @keyframes textFlow {
          0% {
            transform: translateX(-100%);
          }
          100% {
            /* 画面幅以上に大きく移動させる（px指定で確実に画面外へ飛ばす） */
            transform: translateX(120vw);
          }
        }

        @media (max-width: 640px) {
          .text-flow {
            font-size: 4rem;
            gap: 2rem;
          }
          
          .diagonal-slash {
            height: 120px;
          }
          
          @keyframes slashIn {
            from {
              left: -100%;
              height: 120px;
            }
            to {
              left: -10%;
              height: 120px;
            }
          }

          @keyframes slashExpand {
            from {
              left: -10%;
              height: 120px;
            }
            to {
              left: -50%;
              height: 300vh;
              opacity: 0;
            }
          }
        }
      `}</style>
    </div>
  )
}

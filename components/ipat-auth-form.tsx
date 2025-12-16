"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { saveIpatAuth } from "@/app/actions/ipat-sync"

// フォームで利用するデータ型
export interface IpatAuthData {
  inet_id: string;
  subscriber_number: string;
  pars_number: string;
  password: string;
}

const ipatSchema = z.object({
  inet_id: z.string().min(1, "INET-IDを入力してください"),
  subscriber_number: z.string().min(1, "加入者番号を入力してください"),
  pars_number: z.string().min(4, "暗証番号は4桁です").max(4, "暗証番号は4桁です"),
  password: z.string().min(1, "P-ARS番号を入力してください"),
})

type IpatFormValues = z.infer<typeof ipatSchema>

interface IpatAuthFormProps {
  onSuccess: () => void
  initialData?: IpatAuthData;
}

export function IpatAuthForm({ onSuccess, initialData }: IpatAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPars, setShowPars] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<IpatFormValues>({
    resolver: zodResolver(ipatSchema),
    defaultValues: initialData || {
      inet_id: '',
      subscriber_number: '',
      pars_number: '',
      password: '',
    }
  })
  
  // initialData が渡された場合、フォームの内容を更新する
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: IpatFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await saveIpatAuth(data)
      if (result.success) {
        onSuccess()
      } else {
        setError("保存に失敗しました")
      }
    } catch (e) {
      setError("エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="inet_id">INET-ID</Label>
        <Input
          id="inet_id"
          placeholder="INET-ID"
          {...register("inet_id")}
          className="bg-black/50 border-white/10"
        />
        {errors.inet_id && (
          <p className="text-xs text-red-500">{errors.inet_id.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="subscriber_number">加入者番号</Label>
        <Input
          id="subscriber_number"
          placeholder="加入者番号"
          {...register("subscriber_number")}
          className="bg-black/50 border-white/10"
        />
        {errors.subscriber_number && (
          <p className="text-xs text-red-500">{errors.subscriber_number.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="pars_number">暗証番号</Label>
        <div className="relative">
          <Input
            id="pars_number"
            type={showPars ? 'text' : 'password'}
            placeholder="****"
            maxLength={4}
            {...register("pars_number")}
            className="bg-black/50 border-white/10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPars(!showPars)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
            aria-label={showPars ? "暗証番号を隠す" : "暗証番号を表示"}
          >
            {showPars ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.pars_number && (
          <p className="text-xs text-red-500">{errors.pars_number.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">P-ARS番号</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="P-ARS番号"
            {...register("password")}
            className="bg-black/50 border-white/10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
            aria-label={showPassword ? "P-ARS番号を隠す" : "P-ARS番号を表示"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        type="submit"
        className="w-full bg-[#00f3ff] text-black hover:bg-[#00f3ff]/80"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            保存中...
          </>
        ) : (
          initialData ? "認証情報を更新" : "認証情報を保存"
        )}
      </Button>
      
      <p className="text-[10px] text-gray-500 mt-2">
        ※認証情報は暗号化され、ブラウザのCookie（HttpOnly）に保存されます。
        サーバー側でのみ復号され、IPATへのログインに使用されます。
      </p>
    </form>
  )
}

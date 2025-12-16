"use client";

import { supabase } from "@/lib/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const formSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: "表示名は2文字以上で入力してください。" }),
  avatar: z
    .custom<FileList>()
    .optional()
    .refine(
      (files) => !files || files.length === 0 || files[0].size <= 5 * 1024 * 1024,
      "ファイルサイズは5MBまでです。"
    )
    .refine(
      (files) => !files || files.length === 0 || files[0].type.startsWith("image/"),
      "画像ファイルを選択してください。"
    ),
});

type FormSchema = z.infer<typeof formSchema>;

export const ProfileSetupForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";
  
  const [loading, setLoading] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
    },
  });

  // 初期データのロード
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profile) {
        form.reset({
          displayName: profile.display_name || "",
        });
        setCurrentAvatarUrl(profile.avatar_url);
      }
    };

    loadProfile();
  }, [form]);

  const onSubmit = async (data: FormSchema) => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    let publicUrl = currentAvatarUrl;

    // 新しいアバター画像が選択されている場合
    if (data.avatar && data.avatar.length > 0) {
      const file = data.avatar[0];
      const filePath = `${user.id}/${Date.now()}`;

      // 古いアバター画像の削除
      if (currentAvatarUrl) {
        try {
          // user.id フォルダ内のファイルを全削除
          const { data: list } = await supabase.storage.from("avatars").list(user.id);
          if (list && list.length > 0) {
            const filesToRemove = list.map(f => `${user.id}/${f.name}`);
            await supabase.storage.from("avatars").remove(filesToRemove);
          }
        } catch (e) {
          console.error("Error removing old avatar:", e);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        alert(`アバターのアップロードに失敗しました: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      // 変数名を変更して衝突を回避
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      publicUrl = urlData.publicUrl;
    }

    // アバター画像が未設定で、かつ現在のアバターもない場合はエラー（初期設定時のみ）
    if (!publicUrl && !isEditMode) {
      alert("アバター画像を設定してください。");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: data.displayName,
        avatar_url: publicUrl,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error(updateError);
      alert("プロフィールの更新に失敗しました。");
    } else {
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>{isEditMode ? "プロフィール編集" : "プロフィール設定"}</CardTitle>
        <CardDescription>
          {isEditMode ? "プロフィールを更新してください" : "プロフィールを設定してください"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="displayName">表示名</Label>
              <Input
                id="displayName"
                placeholder="あなたの表示名"
                {...form.register("displayName")}
              />
              {form.formState.errors.displayName && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.displayName.message}
                </p>
              )}
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="avatar">アバター</Label>
              {currentAvatarUrl && (
                <div className="mb-2">
                  <img 
                    src={currentAvatarUrl} 
                    alt="Current Avatar" 
                    className="w-16 h-16 rounded-full object-cover border border-gray-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">現在のアバター</p>
                </div>
              )}
              <Input id="avatar" type="file" accept="image/*" {...form.register("avatar")} />
              {form.formState.errors.avatar && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.avatar.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {isEditMode && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              disabled={loading}
            >
              戻る
            </Button>
          )}
          <Button type="submit" disabled={loading} className={isEditMode ? "ml-auto" : "w-full"}>
            {loading ? "処理中..." : (isEditMode ? "更新" : "設定")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

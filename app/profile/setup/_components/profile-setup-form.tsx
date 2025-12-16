"use client";

import { supabase } from "@/lib/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { useState } from "react";

const formSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: "表示名は2文字以上で入力してください。" }),
  avatar: z
    .custom<FileList>()
    .refine((files) => files?.length > 0, "アバター画像が必要です。")
    .refine(
      (files) => files?.[0]?.size <= 5 * 1024 * 1024,
      "ファイルサイズは5MBまでです。"
    )
    .refine(
      (files) => files?.[0]?.type.startsWith("image/"),
      "画像ファイルを選択してください。"
    ),
});

type FormSchema = z.infer<typeof formSchema>;

export const ProfileSetupForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
    },
  });

  const onSubmit = async (data: FormSchema) => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const file = data.avatar[0];
    const filePath = `${user.id}/${Date.now()}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      alert(`アバターのアップロードに失敗しました: ${uploadError.message}`);
      setLoading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: data.displayName,
        avatar_url: publicUrl,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error(updateError);
    } else {
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>プロフィール設定</CardTitle>
        <CardDescription>
          プロフィールを設定してください
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
              <Input id="avatar" type="file" {...form.register("avatar")} />
              {form.formState.errors.avatar && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.avatar.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="submit" disabled={loading}>
            {loading ? "更新中..." : "更新"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImagePlus, Loader2, Sparkles, X, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadFormProps {
  username?: string;
  onUsernameChange?: (v: string) => void;
}

export function UploadForm({
  username: usernameProp = "",
  onUsernameChange,
}: UploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState(usernameProp);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) applyFile(selected);
  };

  const applyFile = (selected: File) => {
    if (!selected.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    setFile(selected);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) applyFile(dropped);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !username.trim()) {
      toast.error("Please provide both an image and a trainer tag.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("username", username.trim());

      const res = await fetch("/api/cards", { method: "POST", body: formData });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      setDone(true);
      toast.success("Bulk shared successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="py-12 flex flex-col items-center text-center space-y-6 animate-scale-in">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center relative">
          <CheckCircle2 className="w-10 h-10 text-primary stroke-[3]" />
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter">SHARED!</h2>
          <p className="text-sm text-muted-foreground font-medium">Your bulk is now live in the gallery.</p>
        </div>
        <div className="flex flex-col w-full gap-3 pt-4">
          <Button 
            onClick={() => router.push("/")}
            className="w-full h-12 font-black uppercase tracking-widest"
          >
            View Gallery
            <ArrowRight className="w-4 h-4 ml-2 stroke-[3]" />
          </Button>
          <Button 
            variant="ghost"
            onClick={() => {
              setDone(false);
              clearFile();
            }}
            className="w-full h-12 font-black uppercase tracking-widest text-[10px] text-muted-foreground"
          >
            Share Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Trainer tag */}
      <div className="space-y-2">
        <Label htmlFor="upload-username" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Trainer tag
        </Label>
        <Input
          id="upload-username"
          placeholder="e.g. AshKetchum"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            onUsernameChange?.(e.target.value);
          }}
          maxLength={32}
          className="h-12 text-sm font-bold bg-muted/30 border-border/40 focus:bg-background transition-all"
          autoComplete="off"
        />
      </div>

      {/* Image picker */}
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Card image
        </Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="file-input"
        />

        {preview ? (
          <div className="relative rounded-lg overflow-hidden border border-border/60 shadow-xl group animate-scale-in">
            <Image
              src={preview}
              alt="Preview"
              width={600}
              height={450}
              className="w-full object-contain max-h-80"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <button
              type="button"
              onClick={clearFile}
              className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white backdrop-blur-md rounded-full p-2 transition-all active:scale-95"
              aria-label="Remove image"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        ) : (
          <div
            className={cn(
              "relative border border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300",
              dragOver
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border/60 hover:border-border hover:bg-muted/30"
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div
              className={cn(
                "w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center transition-all duration-300",
                dragOver ? "bg-primary/20 scale-110" : "bg-muted/50"
              )}
            >
              <ImagePlus
                className={cn(
                  "w-6 h-6 transition-colors duration-300",
                  dragOver ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
            <p className="font-black text-xs uppercase tracking-widest">
              {dragOver ? "Drop image" : "Upload photo"}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">
              PNG, JPG, WEBP — Max 10MB
            </p>
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading || done || !file || !username.trim()}
        className="w-full h-12 font-black uppercase tracking-widest shadow-xl shadow-primary/10 transition-all active:scale-[0.98]"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin stroke-[3]" />
            Sharing
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2 stroke-[3]" />
            Share bulk
          </>
        )}
      </Button>
    </form>
  );
}

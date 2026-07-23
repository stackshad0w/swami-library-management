"use client";

import { useRef, useState } from "react";
import { Camera, X, User } from "lucide-react";
import { toast } from "sonner";

interface PhotoUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  onFileChange?: (file: File | null) => void;
}

const MAX_SIZE = 250 * 1024; // 250 KB

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_DIM = 800;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.8
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function PhotoUpload({ value, onChange, onFileChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [lightbox, setLightbox] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      toast.error("Only JPEG, PNG, or WEBP images allowed.");
      return;
    }
    let processed = file;
    if (file.size > MAX_SIZE) {
      try {
        processed = await compressImage(file);
      } catch {
        toast.error("Image compression failed. Try a smaller image.");
        return;
      }
    }
    if (processed.size > MAX_SIZE) {
      toast.error("Image is too large even after compression (max 250 KB).");
      return;
    }
    const previewUrl = URL.createObjectURL(processed);
    setPreview(previewUrl);
    onChange(previewUrl);
    onFileChange?.(processed);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    onFileChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <div
        className="relative flex h-32 w-32 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-all overflow-hidden"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        title="Click or drop to upload photo"
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Student photo"
              className="object-cover cursor-zoom-in w-full h-full"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(true);
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <User className="h-8 w-8" />
            <span className="text-xs text-center px-2">Click or drop photo</span>
          </div>
        )}
        <div className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Camera className="h-3.5 w-3.5" />
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <p className="text-xs text-muted-foreground mt-1">Max 250 KB · JPEG/PNG/WEBP</p>

      {/* Lightbox */}
      {lightbox && preview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <div className="relative max-w-2xl max-h-[90vh] w-full mx-4">
            <img
              src={preview}
              alt="Full photo"
              className="rounded-xl object-contain w-full h-auto max-h-[80vh]"
            />
            <button
              onClick={() => setLightbox(false)}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

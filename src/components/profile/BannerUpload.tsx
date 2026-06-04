import { useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Upload, X, Check, ImageIcon } from "lucide-react";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";

type Props = {
  currentBannerUrl: string;
  accentColor?: string;
  onBannerUpdated: (url: string) => void;
};

export function BannerUpload({ currentBannerUrl, accentColor = "#8B5CF6", onBannerUpdated }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setDialogOpen(true);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    event.target.value = "";
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    // Output at a max width of 1400px for quality/performance balance
    const maxWidth = 1400;
    const aspectRatio = pixelCrop.width / pixelCrop.height;
    canvas.width = Math.min(pixelCrop.width, maxWidth);
    canvas.height = canvas.width / aspectRatio;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas is empty"));
        },
        "image/jpeg",
        0.9
      );
    });
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setUploading(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const filename = `banner-${userData.user.id}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filename, croppedBlob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filename);

      const publicUrl = urlData.publicUrl;

      onBannerUpdated(publicUrl);
      toast.success("Banner updated!");
      setDialogOpen(false);
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (error: any) {
      console.error("Banner upload error:", error);
      toast.error(error.message || "Failed to upload banner");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    onBannerUpdated("");
    toast.success("Banner removed");
  };

  return (
    <>
      {/* Banner display area */}
      <div className="group relative h-48 w-full overflow-hidden rounded-2xl sm:h-56 md:h-64">
        {currentBannerUrl ? (
          <img
            src={currentBannerUrl}
            alt="Profile banner"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10, transparent)`,
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, oklch(0.21 0.006 286 / 0.8), transparent 60%)",
          }}
        />

        {/* Edit overlay */}
        <label
          htmlFor="banner-upload"
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur">
            <Camera className="h-4 w-4" />
            {currentBannerUrl ? "Change banner" : "Add banner"}
          </div>
          <input
            id="banner-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileSelect}
          />
        </label>

        {/* Remove button */}
        {currentBannerUrl && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
            title="Remove banner"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Crop Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crop Your Banner</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {imageSrc && (
              <div className="relative h-[300px] w-full overflow-hidden rounded-lg bg-black/5">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 5}
                  showGrid={true}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
            )}

            {/* Zoom */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setImageSrc(null);
                }}
                className="flex-1"
                disabled={uploading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                className="flex-1"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save Banner
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

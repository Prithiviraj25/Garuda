"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "usehooks-ts"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import Image from "next/image"
import type { User } from "better-auth"
import { useMutation } from "@tanstack/react-query"
import { changeIProfilePicture } from "@/actions/settings/change-image"
import toast from "react-hot-toast"
import { Input } from "../ui/input"
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { centerCrop, makeAspectCrop } from "react-image-crop"

export function ImageChangeButton({ user }: { user: User | null }) {
  const [open, setOpen] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const { mutate: changeImage, isPending } = useMutation({
    mutationKey: ["change-image"],
    mutationFn: changeIProfilePicture,
    onMutate: () => {
      toast.loading("Changing profile picture", { id: "change-image" })
    },
    onSuccess: () => {
      toast.success("Profile picture changed", { id: "change-image" })
      setOpen(false)
    },
    onError: () => {
      toast.error("Failed to change profile picture", { id: "change-image" })
    },
  })

  // Show loading state until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="relative h-[100px] w-[100px] overflow-hidden rounded-full bg-gray-200 animate-pulse">
        <div className="w-full h-full bg-gray-300"></div>
      </div>
    )
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div
            className="relative h-[100px] w-[100px] cursor-pointer overflow-hidden rounded-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Image className="object-cover" src={user?.image ?? "/default-avatar.png"} alt="User avatar" fill />
            {isHovered && (
              <div className="absolute bottom-0 left-0 w-full bg-black/50 py-2 text-center text-sm text-white">
                Change
              </div>
            )}
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change profile picture</DialogTitle>
            <DialogDescription>Select a new image to use as your profile picture.</DialogDescription>
          </DialogHeader>
          <ProfileForm changeImage={changeImage} isPending={isPending} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Image
          src={user?.image ?? "/default-avatar.png"}
          alt="User avatar"
          width={100}
          height={100}
          className="rounded-full"
        />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Change profile picture</DrawerTitle>
          <DrawerDescription>Select a new image to use as your profile picture.</DrawerDescription>
        </DrawerHeader>
        <ProfileForm className="px-4" changeImage={changeImage} isPending={isPending} />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function ProfileForm({
  className,
  changeImage,
  isPending,
}: {
  className?: string
  changeImage: (file: File) => void
  isPending: boolean
}) {
  const [file, setFile] = React.useState<File | null>(null)
  const [crop, setCrop] = React.useState<Crop>()
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop>()
  const [imgSrc, setImgSrc] = React.useState("")
  const imgRef = React.useRef<HTMLImageElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setCrop(undefined)
      setCompletedCrop(undefined)
      const reader = new FileReader()
      reader.addEventListener("load", () => setImgSrc(reader.result?.toString() || ""))
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!imgRef.current || !completedCrop || !file) {
      return
    }

    const croppedImage = await getCroppedImg(imgRef.current, completedCrop, file.name)
    if (croppedImage) {
      changeImage(croppedImage)
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget

    // Create a square crop that's 80% of the smaller dimension
    const cropSize = Math.min(width, height) * 0.8
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: "px",
          width: cropSize,
          height: cropSize,
        },
        1, // 1:1 aspect ratio
        width,
        height,
      ),
      width,
      height,
    )
    setCrop(crop)
  }

  return (
    <form className={cn("grid items-start gap-4", className)} onSubmit={handleSubmit}>
      <div className="flex flex-col items-center gap-4">
        <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} />
        {imgSrc && (
          <div className="max-w-full">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
              minWidth={50}
              minHeight={50}
            >
              <Image
                ref={imgRef}
                src={imgSrc || "/placeholder.svg"}
                alt="Crop me"
                width={400}
                height={400}
                onLoad={onImageLoad}
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </ReactCrop>
          </div>
        )}
      </div>
      <Button type="submit" disabled={!file || isPending || !completedCrop} className="w-full">
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  )
}

function getCroppedImg(image: HTMLImageElement, crop: PixelCrop, fileName: string): Promise<File | null> {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    return Promise.resolve(null)
  }

  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  // Calculate the actual crop dimensions in the original image
  const cropX = crop.x * scaleX
  const cropY = crop.y * scaleY
  const cropWidth = crop.width * scaleX
  const cropHeight = crop.height * scaleY

  // Ensure the canvas is square for 1:1 aspect ratio
  const size = Math.min(cropWidth, cropHeight)
  canvas.width = size
  canvas.height = size

  // Set up high-quality rendering
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"

  // Draw the cropped image, centered if it's not perfectly square
  const offsetX = (size - cropWidth) / 2
  const offsetY = (size - cropHeight) / 2

  ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, offsetX, offsetY, cropWidth, cropHeight)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"))
          return
        }
        const file = new File([blob], fileName, { type: "image/png" })
        resolve(file)
      },
      "image/png",
      1,
    )
  })
}

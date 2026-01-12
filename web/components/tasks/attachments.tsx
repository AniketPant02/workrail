"use client"

import { useState, useCallback, useEffect } from "react"
import Image from "next/image"
import { X, Download, Trash2, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type TaskImage = {
    id: string
    url: string
    name: string
    size: number
    mimeType: string
    createdAt: string
}

interface AttachmentsProps {
    images: TaskImage[]
    onDelete: (id: string) => Promise<void>
}

export function Attachments({ images, onDelete }: AttachmentsProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (selectedIndex === null) return

        if (e.key === "Escape") {
            setSelectedIndex(null)
        } else if (e.key === "ArrowLeft") {
            setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))
        } else if (e.key === "ArrowRight") {
            setSelectedIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : prev))
        }
    }, [selectedIndex, images.length])

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [handleKeyDown])

    if (images.length === 0) return null

    const selectedImage = selectedIndex !== null ? images[selectedIndex] : null

    return (
        <div className="space-y-3 pt-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Attachments</label>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
                {images.map((image, index) => (
                    <div
                        key={image.id}
                        className="group relative aspect-video rounded-md border bg-muted/20 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                        onClick={() => setSelectedIndex(index)}
                    >
                        <Image
                            src={image.url}
                            alt={image.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, 33vw"
                            unoptimized
                        />
                        {/* Hover Overlay with Actions */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-6 w-6 rounded-full bg-white/90 hover:bg-white text-black shadow-sm"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(image.url, "_blank")
                                }}
                                title="Download"
                            >
                                <Download className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-6 w-6 rounded-full shadow-sm"
                                onClick={async (e) => {
                                    e.stopPropagation()
                                    if (confirm("Are you sure you want to delete this image?")) {
                                        await onDelete(image.id)
                                    }
                                }}
                                title="Delete"
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setSelectedIndex(null)
                    }}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10"
                        onClick={() => setSelectedIndex(null)}
                    >
                        <X className="h-6 w-6" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 hidden sm:flex"
                        disabled={selectedIndex === 0}
                        onClick={(e) => {
                            e.stopPropagation()
                            setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))
                        }}
                    >
                        <ChevronLeft className="h-8 w-8" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 hidden sm:flex"
                        disabled={selectedIndex === images.length - 1}
                        onClick={(e) => {
                            e.stopPropagation()
                            setSelectedIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : prev))
                        }}
                    >
                        <ChevronRight className="h-8 w-8" />
                    </Button>

                    <div className="relative max-w-5xl max-h-[85vh] w-full mx-4 flex flex-col items-center">
                        <div className="relative w-full h-[70vh] sm:h-[80vh]">
                            <Image
                                src={selectedImage.url}
                                alt={selectedImage.name}
                                fill
                                className="object-contain"
                                priority
                                unoptimized
                            />
                        </div>
                        <div className="mt-4 flex items-center gap-4">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="gap-2"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(selectedImage.url, "_blank")
                                }}
                            >
                                <Download className="h-4 w-4" />
                                Download
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="gap-2"
                                onClick={async (e) => {
                                    e.stopPropagation()
                                    if (confirm("Are you sure you want to delete this image?")) {
                                        await onDelete(selectedImage.id)
                                        setSelectedIndex(null)
                                    }
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

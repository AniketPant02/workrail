"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface NewFeaturesModalProps {
  /**
   * Unique identifier for this feature set.
   * Changing this ID will cause the modal to reappear for the user.
   */
  featureId: string
  title?: string
  description?: string
  features: string[]
  /**
   * Optional image or GIF to show off the features.
   * Recommended aspect ratio: 16:9
   */
  image?: string
}

export function NewFeaturesModal({
  featureId,
  title = "What's New",
  description = "We've just released some new updates to make your experience even better.",
  features,
  image,
}: NewFeaturesModalProps) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const lastSeen = localStorage.getItem("workrail_last_seen_feature")
    if (lastSeen !== featureId) {
      // Small delay to ensure smooth entry after page load
      const timer = setTimeout(() => {
        setOpen(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [featureId])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      localStorage.setItem("workrail_last_seen_feature", featureId)
    }
    setOpen(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px] overflow-hidden p-0 gap-0 border-none shadow-xl">
        {image && (
          <div className="w-full aspect-[2/1] relative overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt="New features preview"
              className="w-full h-full object-contain p-8"
            />
          </div>
        )}
        <div className="p-5 flex flex-col gap-5">
          <DialogHeader className="gap-1">
            <div className="flex items-center gap-1.5 text-primary mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">New Update</span>
            </div>
            <DialogTitle className="text-lg font-semibold tracking-tight">{title}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-normal">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="mt-0.5 min-w-4 flex justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/60 mt-1.5" />
                </div>
                <span className="text-sm text-muted-foreground/90 leading-relaxed">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-1">
            <Button
              className="w-full"
              size="default"
              onClick={() => handleOpenChange(false)}
            >
              Got it
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

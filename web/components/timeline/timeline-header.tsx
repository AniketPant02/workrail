"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TimelineHeaderProps {
    date: Date
    onPrevDay: () => void
    onNextDay: () => void
    onToday: () => void
}

const formatDate = (d: Date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

export function TimelineHeader({ date, onPrevDay, onNextDay, onToday }: TimelineHeaderProps) {
    const isToday = date.toDateString() === new Date().toDateString()

    return (
        <div className="border-b border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text font-semibold text-foreground">{formatDate(date)}</h1>
                <div className="flex gap-2 items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onToday}
                        disabled={isToday}
                        className="text-xs bg-transparent"
                    >
                        Today
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onPrevDay} className="h-8 w-8">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onNextDay} className="h-8 w-8">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

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
        <div className="border-b border-border bg-card px-4 py-2.5">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-medium text-foreground">{formatDate(date)}</h2>
                <div className="flex gap-1 items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onToday}
                        disabled={isToday}
                        className="h-7 px-2.5 text-xs bg-transparent"
                    >
                        Today
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onPrevDay} className="h-7 w-7">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onNextDay} className="h-7 w-7">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

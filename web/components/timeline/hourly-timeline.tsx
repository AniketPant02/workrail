"use client"

import { useEffect, useRef, useState } from "react"
import { EventCard } from "@/components/timeline/event-card"
import { TimelineHeader } from "@/components/timeline/timeline-header"

interface TimelineEvent {
    id: string
    title: string
    startHour: number
    startMinute: number
    endHour: number
    endMinute: number
    description?: string
    color?: "blue" | "purple" | "default"
}

interface HourlyTimelineProps {
    events?: TimelineEvent[]
}

export function HourlyTimeline({ events = [] }: HourlyTimelineProps) {
    const timelineRef = useRef<HTMLDivElement>(null)
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    })

    const isToday = selectedDate.toDateString() === new Date().toDateString()
    const currentTime = new Date()
    const currentProgress = isToday ? (currentTime.getHours() * 60 + currentTime.getMinutes()) / (24 * 60) : null

    useEffect(() => {
        if (!timelineRef.current || currentProgress === null) return

        const scrollableHeight = timelineRef.current.scrollHeight - timelineRef.current.clientHeight
        const scrollPosition = currentProgress * scrollableHeight
        timelineRef.current.scrollTop = Math.max(0, scrollPosition - 200)
    }, [currentProgress])

    const handlePrevDay = () => {
        setSelectedDate((prev) => {
            const newDate = new Date(prev)
            newDate.setDate(prev.getDate() - 1)
            return newDate
        })
    }

    const handleNextDay = () => {
        setSelectedDate((prev) => {
            const newDate = new Date(prev)
            newDate.setDate(prev.getDate() + 1)
            return newDate
        })
    }

    const handleToday = () => {
        const now = new Date()
        setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    }

    return (
        <div className="flex h-full min-h-0 max-h-full flex-col overflow-hidden border bg-card">
            <TimelineHeader date={selectedDate} onPrevDay={handlePrevDay} onNextDay={handleNextDay} onToday={handleToday} />

            <div className="relative flex-1 min-h-0 overflow-hidden">
                <div ref={timelineRef} className="relative h-full overflow-y-auto">
                    {currentProgress !== null && (
                        <div
                            className="absolute left-0 right-0 h-1 bg-orange-500 z-10 transition-all"
                            style={{
                                top: `${currentProgress * 100}%`,
                            }}
                        />
                    )}

                    <div className="relative pt-8 pb-8 px-4 max-w-md mx-auto">
                        {Array.from({ length: 24 }).map((_, index) => {
                            const hour = index
                            const isPM = hour >= 12
                            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                            const ampm = isPM ? "pm" : "am"

                            return (
                                <div key={hour} className="relative mb-24">
                                    <div className="flex items-baseline gap-3 mb-4">
                                        <div className="text-sm font-medium text-muted-foreground w-12 text-right">
                                            {displayHour} {ampm}
                                        </div>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>

                                    <div className="ml-16">
                                        {events.filter((event) => event.startHour === hour).map((event) => (
                                            <EventCard key={event.id} event={event} />
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

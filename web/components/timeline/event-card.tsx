"use client"

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

interface EventCardProps {
    event: TimelineEvent
}

export function EventCard({ event }: EventCardProps) {
    const formatTime = (hour: number, minute: number) => {
        const isPM = hour >= 12
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        const ampm = isPM ? "PM" : "AM"
        return `${displayHour}:${minute.toString().padStart(2, "0")} ${ampm}`
    }

    const getColorClasses = () => {
        switch (event.color) {
            case "blue":
                return "bg-blue-50 border-blue-200"
            case "purple":
                return "bg-purple-50 border-purple-200"
            default:
                return "bg-muted border-border"
        }
    }

    const getIconColor = () => {
        switch (event.color) {
            case "blue":
                return "text-blue-600"
            default:
                return "text-muted-foreground"
        }
    }

    return (
        <div className={`rounded-lg border p-3 mb-3 space-y-1 ${getColorClasses()}`}>
            <div className="flex items-start gap-2">
                {event.color === "blue" && (
                    <div className={`h-6 w-6 rounded-full bg-blue-600 flex-shrink-0 mt-0.5 ${getIconColor()}`} />
                )}
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatTime(event.startHour, event.startMinute)} – {formatTime(event.endHour, event.endMinute)}
                    </p>
                </div>
            </div>
        </div>
    )
}
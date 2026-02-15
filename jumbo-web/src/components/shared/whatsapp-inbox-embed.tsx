"use client"

import { useState } from "react"
import {
  Message01Icon,
  Expand01Icon,
  Collapse01Icon,
} from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface WhatsAppInboxEmbedProps {
  inboxUrl?: string
  className?: string
}

const DEFAULT_INBOX_URL = "https://inbox.kapso.ai/embed/SzaGruLn0IOgxv9FaVAhQEwPUWCRDZOM5JkJSpTGTA4"

export function WhatsAppInboxEmbed({
  inboxUrl = DEFAULT_INBOX_URL,
  className,
}: WhatsAppInboxEmbedProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  if (isMinimized) {
    return (
      <div className={cn("fixed bottom-4 right-4 z-50", className)}>
        <Button
          onClick={() => setIsMinimized(false)}
          className="h-12 w-12 rounded-xl bg-green-600 hover:bg-green-700 shadow-lg p-0"
        >
          <Message01Icon variant="filled" className="size-5 text-white" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "fixed right-4 bottom-4 z-50 bg-white rounded-xl border border-neutral-200 shadow-xl flex flex-col overflow-hidden transition-all duration-300",
        isExpanded ? "w-[480px] h-[700px]" : "w-[380px] h-[500px]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-green-600">
            <Message01Icon variant="filled" className="size-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-neutral-900">WhatsApp Inbox</h3>
            <p className="text-xs font-normal text-neutral-500">
              Kapso Integration
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-700"
          >
            {isExpanded ? (
              <Collapse01Icon variant="stroke" className="size-4" />
            ) : (
              <Expand01Icon variant="stroke" className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
            className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-700"
          >
            <span className="text-lg leading-none">−</span>
          </Button>
        </div>
      </div>

      {/* Iframe */}
      <div className="flex-1 relative">
        <iframe
          src={inboxUrl}
          className="w-full h-full border-0"
          allow="clipboard-read; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          title="WhatsApp Inbox"
        />
      </div>
    </div>
  )
}

// Alternative: Sidebar tab version
interface WhatsAppInboxTabProps {
  inboxUrl?: string
  className?: string
}

export function WhatsAppInboxTab({
  inboxUrl = DEFAULT_INBOX_URL,
  className,
}: WhatsAppInboxTabProps) {
  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200">
        <div className="flex items-center justify-center size-8 rounded-lg bg-green-600">
          <Message01Icon variant="filled" className="size-4 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-neutral-900">WhatsApp Inbox</h3>
          <p className="text-xs font-normal text-neutral-500">
            Kapso Integration
          </p>
        </div>
      </div>

      {/* Iframe */}
      <div className="flex-1 relative">
        <iframe
          src={inboxUrl}
          className="w-full h-full border-0"
          allow="clipboard-read; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          title="WhatsApp Inbox"
        />
      </div>
    </div>
  )
}

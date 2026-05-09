import { BotIcon, ChevronDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

export function ButtonGroupPopover() {
  return (
    <ButtonGroup>
      <Button size="sm" variant="outline">
        <BotIcon /> Copilot
      </Button>
      <Popover>
        <PopoverTrigger
          render={
            <Button aria-label="Open Popover" size="icon-sm" variant="outline">
              <ChevronDownIcon />
            </Button>
          }
        />
        <PopoverContent align="end" className="gap-0 rounded-xl p-0 text-sm">
          <div className="px-4 py-3">
            <div className="font-medium text-sm">Agent Tasks</div>
          </div>
          <Separator />
          <div className="p-4 text-sm *:[p:not(:last-child)]:mb-2">
            <Textarea
              className="mb-4 resize-none"
              placeholder="Describe your task in natural language."
            />
            <p className="font-medium">Start a new task with Copilot</p>
            <p className="text-muted-foreground">
              Describe your task in natural language. Copilot will work in the background and open a
              pull request for your review.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </ButtonGroup>
  )
}

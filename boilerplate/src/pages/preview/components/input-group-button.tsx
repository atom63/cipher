import { Info, Star } from 'lucide-react'
import { useState } from 'react'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function InputGroupButtonExample() {
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <div className="grid w-full max-w-sm gap-6">
      <Label className="sr-only" htmlFor="input-secure-19">
        Input Secure
      </Label>
      <InputGroup className="[--radius:9999px]">
        <InputGroupInput className="pl-0.5!" id="input-secure-19" />
        <Popover>
          <PopoverTrigger
            render={
              <InputGroupAddon>
                <InputGroupButton aria-label="Info" size="icon-xs" variant="secondary">
                  <Info />
                </InputGroupButton>
              </InputGroupAddon>
            }
          />
          <PopoverContent
            align="start"
            alignOffset={10}
            className="flex flex-col gap-1 rounded-xl text-sm"
          >
            <p className="font-medium">Your connection is not secure.</p>
            <p>You should not enter any sensitive information on this site.</p>
          </PopoverContent>
        </Popover>
        <InputGroupAddon className="pl-1! text-muted-foreground">https://</InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label="Favorite"
            onClick={() => setIsFavorite(!isFavorite)}
            size="icon-xs"
          >
            <Star
              className="data-[favorite=true]:fill-primary data-[favorite=true]:stroke-primary"
              data-favorite={isFavorite}
            />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

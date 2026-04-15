import { PlusIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export function EmptyAvatarGroup() {
  return (
    <Empty className="flex-none border py-10">
      <EmptyHeader>
        <EmptyMedia>
          <AvatarGroup className="grayscale">
            <Avatar>
              <AvatarImage alt="@shadcn" src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage alt="@maxleiter" src="https://github.com/maxleiter.png" />
              <AvatarFallback>LR</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage alt="@evilrabbit" src="https://github.com/evilrabbit.png" />
              <AvatarFallback>ER</AvatarFallback>
            </Avatar>
          </AvatarGroup>
        </EmptyMedia>
        <EmptyTitle>No Team Members</EmptyTitle>
        <EmptyDescription>Invite your team to collaborate on this project.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">
          <PlusIcon />
          Invite Members
        </Button>
      </EmptyContent>
    </Empty>
  )
}

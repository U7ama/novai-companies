'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { navGroups } from '@/config/nav-config';
import { useFilteredNavGroups } from '@/hooks/use-nav';
import type { NavItem } from '@/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { clearAuthToken } from '@/features/auth/auth-store';

function handleSignOut() {
  clearAuthToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/sign-in';
  }
}

export default function AppSidebar() {
  const pathname = usePathname();
  const filteredGroups = useFilteredNavGroups(navGroups);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size='lg'
              render={<Link href='/companies' aria-label='Novai CRM Companies' />}
              className='hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            >
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
                <Icons.logo className='size-4' />
              </div>
              <div className='grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden'>
                <span className='truncate font-semibold'>Novai</span>
                <span className='truncate text-xs text-muted-foreground'>CRM Companies</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.label || 'ungrouped'} className='py-0'>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => (
                <NavMainItem key={item.title} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size='lg'
                    className='data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground'
                  />
                }
              >
                <div className='flex aspect-square size-7 items-center justify-center rounded-full bg-muted'>
                  <Icons.user className='size-4' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden'>
                  <span className='truncate font-medium'>Novai User</span>
                  <span className='truncate text-xs text-muted-foreground'>Authenticated</span>
                </div>
                <Icons.chevronsDown className='ml-auto size-4 group-data-[collapsible=icon]:hidden' />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--anchor-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className='p-0 font-normal'>
                    <div className='px-2 py-1.5 text-sm'>
                      <p className='font-medium'>Novai CRM Session</p>
                      <p className='text-xs text-muted-foreground'>Bearer Token Active</p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <Icons.logout className='mr-2 h-4 w-4' />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function NavMainItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon ? Icons[item.icon] : Icons.logo;
  const isActive = pathname === item.url || (item.url !== '/' && pathname.startsWith(`${item.url}/`));

  if (item.disabled) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.title}
          disabled
          className='opacity-50 cursor-not-allowed select-none'
        >
          <Icon />
          <span>{item.title}</span>
          {item.label && (
            <span className='ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground group-data-[collapsible=icon]:hidden'>
              {item.label}
            </span>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={item.url} aria-label={item.title} />}
        tooltip={item.title}
        isActive={isActive}
      >
        <Icon />
        <span>{item.title}</span>
        {item.label && (
          <span className='ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground group-data-[collapsible=icon]:hidden'>
            {item.label}
          </span>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

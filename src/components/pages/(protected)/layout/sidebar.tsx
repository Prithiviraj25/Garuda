"use client"
import { cn, truncateFollowedByDots } from "@/lib/utils";
import { UserButton } from "@/components/auth/user-button";
import Logo from "@/components/global/logo"
import { ThemeToggle } from "@/components/global/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { User } from "better-auth";
import { BookIcon, HomeIcon, LayoutDashboardIcon, PlusIcon, SettingsIcon, ShieldIcon, Brain, Target, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const AppSidebar = ({ user }: { user: User | null }) => {
    const {
        open,

    } = useSidebar();

    const sidebarItems = [
        {
            label: "Home",
            href: "/",
            icon: <HomeIcon />,
        },
        {
            label: "Threat Intelligence",
            href: "/threat-intelligence",
            icon: <ShieldIcon />,
        },
        {
            label: "BCM Impact Analysis",
            href: "/bcm-analysis",
            icon: <Target />,
        },
        {
            label: "AI Assistant",
            href: "/ai-assistant",
            icon: <Brain />,
        },
        {
            label: "Reports",
            href: "/reports",
            icon: <FileText />,
        },
        {
            label: "Settings",
            href: "/settings",
            icon: <SettingsIcon />,
        },
    ]

    const pathname = usePathname()
    const isActive = (href: string) => pathname === href

    return (
        <Sidebar variant="floating" collapsible="icon">
            <SidebarHeader className="flex flex-row items-center justify-between">
                <Logo className={!open ? "hidden" : ""} image={true} />
                <SidebarTrigger />
            </SidebarHeader>
            <Separator />
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {sidebarItems.map((item) => (
                                <SidebarMenuItem key={item.label}>
                                    <SidebarMenuButton asChild className={isActive(item.href) ? "bg-accent" : ""}>
                                        <Link href={item.href}>
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <Separator />
            <SidebarFooter className="flex flex-row items-center justify-between">
                <UserButton variant={open ? "large" : "small"} user={user} />
                <div className={`${!open ? "hidden" : "mr-1"}`}>
                    <ThemeToggle />
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
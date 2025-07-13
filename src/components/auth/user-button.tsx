"use client"

import { User } from "better-auth"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User as UserIcon } from "lucide-react"
import Image from "next/image"
import { truncateFollowedByDots } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { DEFAULT_LOGIN_REDIRECT } from "@/routes"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

export const UserButton = ({ user, variant = "small" }: { user: User | null, variant : "small" | "large" }) => {
    const router = useRouter()
    const googleLogin = async () => {
        await authClient.signIn.social({
            provider: "google",
            callbackURL: DEFAULT_LOGIN_REDIRECT,
            errorCallbackURL: "/error",
            newUserCallbackURL: "/onboarding",
            fetchOptions: {
                onRequest: () => {
                    toast.loading("Signing in", { id: "sign-in" })
                },
                onSuccess: () => {
                    router.push("/")
                    toast.success("Signed in", { id: "sign-in" })
                },
                onError: () => {
                    toast.error("Failed to sign in", { id: "sign-in" })
                }
              } 
        })
    }

    const signOut = async () => {
        await authClient.signOut({
          fetchOptions: {
            onRequest: () => {
                toast.loading("Signing out", { id: "sign-out" })
            },
            onSuccess: () => {
                router.push("/")
                toast.success("Signed out", { id: "sign-out" })
            },
            onError: () => {
                toast.error("Failed to sign out", { id: "sign-out" })
            }
          }  
        })
    }

    if (!user) {
        return (
            <Button 
                variant={variant === "large" ? "default" : "secondary"} 
                onClick={googleLogin}
                className={variant === "large" ? "w-full justify-start" : "rounded-full cursor-pointer"}
            >
                Sign In
            </Button>
        )
    }

    if (variant === "large") {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent hover:cursor-pointer w-full">
                        <Avatar>
                            <AvatarImage src={user.image ?? "/default-avatar.png"} alt={user.name || user.email || ""} />
                            <AvatarFallback>
                                {user.name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <p className="text-xs font-medium truncate max-w-[160px]">{truncateFollowedByDots(user.name, 16)}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                                {truncateFollowedByDots(user.email, 16)}
                            </p>
                        </div>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52 mx-4" align="end" forceMount>
                    <DropdownMenuGroup>
                        <DropdownMenuItem>
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Image 
                    src={user.image ?? "/default-avatar.png"} 
                    alt={user.name || user.email || ""} 
                    width={32} 
                    height={32} 
                    className="hover:cursor-pointer shadow-md rounded-full"
                />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 ml-4" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/settings")}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
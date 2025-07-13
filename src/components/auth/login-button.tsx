"use client";

import { authClient } from "@/lib/auth-client";
import { Button, buttonVariants } from "@/components/ui/button";
import { FaGoogle } from "react-icons/fa";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

interface LoginButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const LoginButton = ({
  className,
  variant,
  size,
  ...props
}: LoginButtonProps) => {
  const router = useRouter();
  const googleLogin = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: DEFAULT_LOGIN_REDIRECT,
      errorCallbackURL: "/error",
      newUserCallbackURL: "/welcome",
      fetchOptions: {
        onRequest: () => {
          toast.loading("Signing in", { id: "sign-in" });
        },
        onSuccess: () => {
          router.push("/");
          toast.success("Signed in", { id: "sign-in" });
        },
        onError: () => {
          toast.error("Failed to sign in", { id: "sign-in" });
        },
      },
    });
  };
  return (
    <Button
      variant="outline"
      onClick={googleLogin}
      className={cn(buttonVariants({ variant, size, className }), "text-white")}
      {...props}
    >
      <FaGoogle className="mr-2 h-4 w-4" />
      Sign in with Google
    </Button>
  );
}; 
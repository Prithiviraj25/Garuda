"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

export async function changeName(name: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if(!session?.user.id){
        throw new Error("Unauthorized")
    }
    await auth.api.updateUser({
        body: {
            name: name,
        },
        headers: await headers(),
    })
    revalidatePath("/settings")
}
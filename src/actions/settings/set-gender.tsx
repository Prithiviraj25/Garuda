"use server"

import { db } from "@/db"
import { user } from "@/db/schema/auth-schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

export const setGenderAction = async (gender: "male" | "female" | "other") => {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if(!session?.user.id){
        throw new Error("Unauthorized")
    }

    await db
        .update(user)
        .set({
            gender
        })
        .where(eq(user.id, session.user.id))

    revalidatePath("/settings")
}
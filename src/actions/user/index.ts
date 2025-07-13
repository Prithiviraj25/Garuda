"use server"

import { db } from "@/db"
import { user } from "@/db/schema/auth-schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

export const getUser = async () => {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })
    
        if(!session?.user.id){
            throw new Error("Unauthorized")
        }
         
        const currentUser = await db
            .select()
            .from(user)
            .where(eq(user.id, session?.user.id ?? ""))
            .limit(1);
    
        return currentUser
    } catch (error) {
        console.error(error)
        throw new Error("Failed to get user")
    }
}
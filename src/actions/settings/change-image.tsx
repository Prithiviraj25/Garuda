"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { uploadFile } from "@/lib/cdn"

export const changeIProfilePicture = async (image: File) => {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if(!session){
        throw new Error("Unauthorized")
    }

    const { message, key, url } = await uploadFile(image)
    console.log(message, key, url)
    await auth.api.updateUser({
        body: {
            image: url,
        },
        headers: await headers(),
    });

    revalidatePath("/settings")
}
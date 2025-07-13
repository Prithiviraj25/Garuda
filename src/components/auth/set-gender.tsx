"use client"
import React, { useState } from 'react'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useMutation } from '@tanstack/react-query'
import { setGenderAction } from '@/actions/settings/set-gender'
import toast from 'react-hot-toast'

type Props = {
    defaultValue: string | null
}

const SetGender = (props: Props) => {
    const [gender, setGender] = useState<string | null>(props.defaultValue);
    const { mutate: changeGender, isPending } = useMutation({
        mutationKey: ["set-gender"],
        mutationFn: setGenderAction,
        onMutate: () => {
            toast.loading("Updating gender", { id: "set-gender" })
        },
        onSuccess: () => {
            toast.success("Gender updated successfully", { id: "set-gender" })
        },
        onError: () => {
            toast.error("Failed to update gender", { id: "set-gender" })
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(gender){
            changeGender(gender as "male" | "female" | "other")
        }
    }

    return (
        <form className="flex items-center justify-center gap-3" onSubmit={handleSubmit}>
             <Select value={gender || ""} onValueChange={(value) => setGender(value)}>
                <SelectTrigger className="min-w-[300px]">
                    <SelectValue placeholder="Select a Gender" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Gender</SelectLabel>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
            <Button type="submit" variant="default" disabled={isPending}>
                Save
            </Button>
        </form>
    )
}

export default SetGender
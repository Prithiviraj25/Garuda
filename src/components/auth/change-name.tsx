"use client"
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { useMutation } from '@tanstack/react-query'
import { changeName } from '@/actions/settings/change-name'
import toast from 'react-hot-toast'

type Props = {
    defaultValue: string
}

const ChangeName = ({ defaultValue }: Props) => {
    const [value, setValue] = useState<string | undefined>(defaultValue)

    const { 
        mutate: change,
        isPending
    } = useMutation({
        mutationKey: ['change-name'],
        mutationFn: changeName,
        onMutate: () => {
            toast.loading("Changing Name", { id: "change-name" })
        },
        onSuccess: () => {
            toast.success("Changed Name", { id: "change-name" })
        },
        onError: () => {
            toast.error("Failed to Change Name", { id: "change-name" })
        }
    })

    const handleBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        change(e.target.value)
    }

    return (
        <div>
            <Input
                onBlur={handleBlur}
                value={value}
                onChange={(e) => {
                    setValue(e.target.value)
                }}
                disabled={isPending}
            />
        </div>
    )
}

export default ChangeName
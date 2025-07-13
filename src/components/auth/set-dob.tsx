"use client"
import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import toast from "react-hot-toast"
import { useMutation } from "@tanstack/react-query"
import { setDateOfBirth } from "@/actions/settings/set-date"

type Props = {
    defaultValue: Date | null
}

const calculateAge = (date: Date | undefined) => {
    if (!date) return null
    const today = new Date()
    const birthDate = new Date(date)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }
    return age
}

const SetDob = ({ defaultValue }: Props) => {
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(defaultValue ?? undefined)

    const checkAge = (selectedDate: Date | undefined) => {
        const age = calculateAge(selectedDate)
        console.log(age)
        if(age && age < 14){
            toast.error("You must be at least 14 years old")
            return false
        }
        return true
    }

    const {
        mutate  :changeDob,
        isPending
    } = useMutation({
        mutationKey: ["set-dob"],
        mutationFn: setDateOfBirth,
        onMutate: () => {
            toast.loading("Updating date of birth", { id: "set-dob" })
        },
        onSuccess: () => {
            toast.success("Date of birth updated successfully", { id: "set-dob" })
        },
        onError: () => {
            toast.error("Failed to update date of birth", { id: "set-dob" })
        }
    })

    const handleSubmit = () => {
        const age = checkAge(date)
        if(!age){
            setDate(undefined)
            return
        }
        if(date){
            changeDob(date)
        }
    }

    return (
        <div className="flex items-center justify-center gap-3">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="date"
                        className="justify-between font-normal min-w-[300px]"
                    >
                        {date ? date.toLocaleDateString() : "Select date"}
                        <ChevronDownIcon />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        onSelect={(selectedDate) => {
                            if (!selectedDate) return
                            const validAge = checkAge(selectedDate)
                            if (validAge) {
                                setDate(selectedDate)
                                setOpen(false)
                            }
                        }}
                    />
                </PopoverContent>
            </Popover>
            <Button
                variant="default"
                onClick={handleSubmit}
                disabled={isPending}
            >
                Save
            </Button>
        </div>
    )
}

export default SetDob;
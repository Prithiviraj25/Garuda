"use client"
import { getUser } from '@/actions/user'
import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

const ContactInformation = () => {
    const { data: currentUser, isLoading } = useQuery({
        queryKey: ["current-user"],
        queryFn: getUser,
    })
    return (
        <>
            <TableRow>
                <TableCell>Backup Email</TableCell>
                <TableCell>
                    {
                        (isLoading || !currentUser) ? (
                            <Skeleton className="h-10 w-full" />
                        ) : (
                            <div>{currentUser[0].backupEmail ?? "Not Set"}</div>
                        )
                    }
                </TableCell>
                <TableCell>
                    Coming Soon
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell>Phone Number</TableCell>
                <TableCell>
                    {
                        (isLoading || !currentUser) ? (
                            <Skeleton className="h-10 w-full" />
                        ) : (
                            <div>{currentUser[0].phone ?? "Not Set"}</div>
                        )
                    }
                </TableCell>
                <TableCell>
                    Coming Soon
                </TableCell>
            </TableRow>
        </>
    )
}

export default ContactInformation
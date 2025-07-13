"use client"
import { getUser } from '@/actions/user'
import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'
import SetDob from './set-dob'
import SetGender from './set-gender'

const BasicUserInfo = () => {
    
    const { data: currentUser, isLoading } = useQuery({
        queryKey: ["current-user"],
        queryFn: getUser,
    })
    
  return (
    <>
        <TableRow>
            <TableCell className='mt-2'>D.O.B</TableCell>
            <TableCell className='mt-2'>
                {
                    (isLoading || !currentUser) ? (
                        <Skeleton className="h-10 w-full" />
                    ) : (
                        <div>{currentUser[0].dob === null ? "N.A" : currentUser[0].dob.toLocaleDateString()}</div>
                    )
                }
            </TableCell>
            <TableCell className='mt-2'>
                <SetDob defaultValue={currentUser?.[0].dob ?? null} />
            </TableCell>
        </TableRow>
        <TableRow>
            <TableCell className='mt-2'>Gender</TableCell>
            <TableCell className='mt-2'>
                {
                    (isLoading || !currentUser) ? (
                        <Skeleton className="h-10 w-full" />
                    ) : (
                        <div>{currentUser[0].gender === null ? "N.A" : currentUser[0].gender === "male" ? "Male" : currentUser[0].gender === "female" ? "Female" : "Other"}</div>
                    )
                }
            </TableCell>
            <TableCell className='mt-2'>
                <SetGender defaultValue={currentUser?.[0].gender ?? null} />
            </TableCell>
        </TableRow>
    </>
  )
}

export default BasicUserInfo
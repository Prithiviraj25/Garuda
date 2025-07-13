import { Separator } from '@/components/ui/separator'
import React from 'react'
import { logoFont } from '../../../../../config'
import { BookIcon, GithubIcon } from 'lucide-react'

const CreateBookPage = () => {
    const createBookOptions = [
        {
            title: "Manually add a new book",
            description: "Add a new book to your library",
            icon: <BookIcon />
        },
        {
            title: "Import a book from Github",
            description: "Add a new book to your library",
            icon: <GithubIcon />
        },
    ]
    return (
        <div className='max-h-screen overflow-y-auto'>
            <header>
                <h1 className={`text-lg  ${logoFont.className}`}>New book</h1>
            </header>
            <Separator className='mt-2' />
            <main className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 md:mt-6 px-4'>
                {createBookOptions.map((option, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            {option.icon}
                            <h3 className="font-semibold">{option.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                ))}
            </main>
        </div>
    )
}

export default CreateBookPage
import Navbar from "@/components/global/navbar"

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto my-10 px-4 text-justify pt-16">
      <Navbar />
      {children}
    </div>
  )
}
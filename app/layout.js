import './globals.css'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'The Final Showdown — House Green vs House Black',
  description: 'A pre-wedding turf rivalry where only one house reigns supreme. Maidhily vs Hrithwik.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-black text-white overflow-x-hidden">
        {children}
        <Toaster theme="dark" position="top-center" richColors />
      </body>
    </html>
  )
}

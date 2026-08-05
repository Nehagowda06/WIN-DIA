import './globals.css'
import Clientshell from './Clientshell'
 
export const metadata = {
  title: 'WIN-DIA — The Divine Healthy Crunch',
  description: 'Ancient wisdom meets modern wellness. Crafted with love, backed by science.',
}
 
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400;1,600&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Clientshell>{children}</Clientshell>
      </body>
    </html>
  )
}
 













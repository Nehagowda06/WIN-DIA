import Link from 'next/link';
import ProfileMenu from './ProfileMenu';
import './header.css';

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header-container">
        <Link href="/" className="site-logo">WINDIA</Link>
        <nav className="site-nav">
          <a href="/shop">Shop</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
        <ProfileMenu />
      </div>
    </header>
  );
}

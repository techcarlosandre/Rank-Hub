'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DynamicLogo from '@/components/DynamicLogo';

export default function HubNavbar() {
  const pathname = usePathname();

  const links = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Profile', href: '/profile' },
  ];

  return (
    <nav className="barra-topo">
      <div className="barra-conteudo">
        <div className="linha-centro" style={{ gap: '2rem' }}>
          <Link href="/dashboard" className="logo-link">
            <div className="logo-icone">
              <DynamicLogo />
            </div>
            <span className="texto-marca-nav">Rank&Hub</span>
          </Link>
          
          <div className="menu-desktop">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`texto-link ${isActive ? 'text-foreground' : 'text-muted'}`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="linha-centro" style={{ gap: '1rem' }}>
          <div className="avatar-mini">
            <span className="rotulo" style={{ fontSize: '0.75rem', fontWeight: 500 }}>U</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

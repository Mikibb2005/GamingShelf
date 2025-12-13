"use client";

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import styles from './Navigation.module.css';

// Simple Icons Components
const IconHome = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);
const IconGamepad = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line><rect x="2" y="6" width="20" height="12" rx="2"></rect></svg>
);
const IconHeart = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
);
const IconUser = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const IconLogout = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);
const IconSettings = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
);
const IconSearch = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

export default function Navigation() {
    const { data: session, status } = useSession();

    return (
        <nav className={styles.nav}>
            <div className={styles.logo}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <span className="title-gradient">GamingShelf</span>
                </Link>
            </div>

            <div className={styles.menu}>
                <Link href="/" className={styles.item}>
                    <IconHome />
                    <span>Inicio</span>
                </Link>
                <Link href="/catalog" className={styles.item}>
                    <IconSearch />
                    <span>Catálogo</span>
                </Link>
                <Link href="/library" className={styles.item}>
                    <IconGamepad />
                    <span>Biblioteca</span>
                </Link>
                {session?.user && (
                    <Link href="/feed" className={styles.item}>
                        <IconHeart />
                        <span>Feed</span>
                    </Link>
                )}
                <Link href="/forum" className={styles.item}>
                    <IconGamepad />
                    <span>Foro</span>
                </Link>

                {status === 'loading' ? (
                    <div className={styles.item} style={{ opacity: 0.5 }}>
                        <IconUser />
                        <span>...</span>
                    </div>
                ) : session?.user ? (
                    <>
                        <Link href={`/profile/${session.user.name}`} className={styles.item}>
                            <IconUser />
                            <span>{session.user.name}</span>
                        </Link>
                        <Link href="/settings" className={styles.item}>
                            <IconSettings />
                            <span>Ajustes</span>
                        </Link>
                        <button
                            onClick={() => signOut()}
                            className={styles.item}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <IconLogout />
                            <span>Salir</span>
                        </button>
                    </>
                ) : (
                    <Link href="/login" className={styles.item}>
                        <IconUser />
                        <span>Entrar</span>
                    </Link>
                )}
            </div>
        </nav>
    );
}

'use client';

import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '../lib/store';
import { logout, selectCurrentUser } from '../lib/features/auth/authSlice';
import { useGetMeQuery } from '../lib/services/api';
import { useEffect } from 'react';
import { setCredentials } from '../lib/features/auth/authSlice';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectCurrentUser);
    const router = useRouter();

    // Try to fetch user if we have a token but no user in state
    const { data: userData, isError } = useGetMeQuery(undefined, {
        skip: !!user, // Skip if we already have user data
    });

    useEffect(() => {
        if (userData && !user) {
            // We have a token (implied by query success) and user data, update state
            const token = localStorage.getItem('token');
            if (token) {
                dispatch(setCredentials({ user: userData, token }));
            }
        }
        if (isError) {
            // Token might be invalid
            dispatch(logout());
        }
    }, [userData, isError, user, dispatch]);

    const handleLogout = () => {
        dispatch(logout());
        router.push('/login');
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                    ECHO
                </Link>

                <div className="flex items-center gap-6">
                    {user ? (
                        <>
                            <div className="hidden md:flex items-center gap-3 text-sm text-gray-300">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                    {user.username[0].toUpperCase()}
                                </div>
                                <span className="font-medium">{user.display_name}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/register"
                                className="px-4 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
                            >
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

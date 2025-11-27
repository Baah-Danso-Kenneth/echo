'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginMutation, useRegisterMutation } from '../lib/services/api';
import { useAppDispatch } from '../lib/store';
import { setCredentials } from '../lib/features/auth/authSlice';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AuthFormProps {
    mode: 'login' | 'register';
}

export default function AuthForm({ mode }: AuthFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');

    const router = useRouter();
    const dispatch = useAppDispatch();

    const [login, { isLoading: isLoginLoading }] = useLoginMutation();
    const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();

    const isLoading = isLoginLoading || isRegisterLoading;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (mode === 'login') {
                const result = await login({ email, password }).unwrap();
                dispatch(setCredentials({ user: null, token: result.access_token }));
                // We'll fetch user details in the next step or let the app wrapper do it
                // For now just redirect
                toast.success('Logged in successfully');
                router.push('/');
            } else {
                await register({
                    email,
                    password,
                    username,
                    display_name: displayName
                }).unwrap();
                toast.success('Registration successful! Please login.');
                router.push('/login');
            }
        } catch (err: unknown) {
            const error = err as { data?: { detail?: string } };
            toast.error(error.data?.detail || 'An error occurred');
        }
    };

    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-xl">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tighter text-white">
                    {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h1>
                <p className="text-gray-400">
                    {mode === 'login'
                        ? 'Enter your credentials to access your account'
                        : 'Enter your details to get started'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-200">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                                placeholder="johndoe"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-200">Display Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                    </>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                        placeholder="john@example.com"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                        placeholder="••••••••"
                        required
                        minLength={8}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        mode === 'login' ? 'Sign In' : 'Sign Up'
                    )}
                </button>
            </form>

            <div className="text-center text-sm text-gray-400">
                {mode === 'login' ? (
                    <p>
                        Don&apos;t have an account?{' '}
                        <a href="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
                            Sign up
                        </a>
                    </p>
                ) : (
                    <p>
                        Already have an account?{' '}
                        <a href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                            Sign in
                        </a>
                    </p>
                )}
            </div>
        </div>
    );
}

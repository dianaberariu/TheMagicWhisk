import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

/**
 * @typedef {Object} AuthContextValue
 * @property {import('@supabase/supabase-js').Session | null} session
 * @property {import('@supabase/supabase-js').User | null} user
 * @property {boolean} loading
 * @property {boolean} isInitialized
 * @property {(email: string, password: string, options?: Record<string, any>) => Promise<any>} signUp
 * @property {(email: string, password: string) => Promise<any>} signIn
 * @property {() => Promise<any>} signOut
 */

const AuthContext = createContext(/** @type {AuthContextValue | null} */ (null));

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [session, setSession] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isInitialized, setIsInitialized] = useState(false);

	useEffect(() => {
		let isMounted = true;

		const initializeAuth = async () => {
			try {
				const { data, error } = await supabase.auth.getSession();

				if (error) {
					console.error('Failed to load auth session', error);
					return;
				}

				if (isMounted) {
					setSession(data?.session ?? null);
					setUser(data?.session?.user ?? null);
				}
			} finally {
				if (isMounted) {
					setLoading(false);
					setIsInitialized(true);
				}
			}
		};

		initializeAuth();

		const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
			if (!isMounted) {
				return;
			}

			setSession(session ?? null);
			if (event === 'SIGNED_OUT') {
				setUser(null);
			} else {
				setUser(session?.user ?? null);
			}
			setLoading(false);
			setIsInitialized(true);
		});

		return () => {
			isMounted = false;
			authListener.subscription.unsubscribe();
		};
	}, []);

	const signUp = useCallback(async (email, password, options = {}) => {
		return supabase.auth.signUp({ email, password, options });
	}, []);

	const signIn = useCallback(async (email, password) => {
		return supabase.auth.signInWithPassword({ email, password });
	}, []);

	const signOut = useCallback(async () => {
		return await supabase.auth.signOut();
	}, []);

	const value = useMemo(
		() => ({
			session,
			user,
			loading,
			isInitialized,
			signUp,
			signIn,
			signOut,
		}),
		[session, user, loading, isInitialized, signUp, signIn, signOut]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error('useAuth must be used within AuthProvider');
	}

	return context;
}

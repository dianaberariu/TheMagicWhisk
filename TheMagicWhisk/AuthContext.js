import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

/**
 * @typedef {Object} AuthContextValue
 * @property {import('@supabase/supabase-js').User | null} user
 * @property {boolean} loading
 * @property {(email: string, password: string, options?: Record<string, any>) => Promise<any>} signUp
 * @property {(email: string, password: string) => Promise<any>} signIn
 * @property {() => Promise<any>} signOut
 */

const AuthContext = createContext(/** @type {AuthContextValue | null} */ (null));

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

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
					setUser(data?.session?.user ?? null);
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		initializeAuth();

		const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
			if (!isMounted) {
				return;
			}

			if (event === 'SIGNED_OUT') {
				setUser(null);
			} else {
				setUser(session?.user ?? null);
			}
			setLoading(false);
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
			user,
			loading,
			signUp,
			signIn,
			signOut,
		}),
		[user, loading, signUp, signIn, signOut]
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

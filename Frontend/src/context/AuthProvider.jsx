// AuthProvider.jsx
import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { AuthContext } from './auth-context';
import {
  login as doLogin,
  register as doRegister,
  meQuiet,
  logout as doLogout,
} from '../services/auth';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // null = no logueado
  const [loading, setLoading] = useState(true);
  const abortRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const u = await meQuiet({ signal: controller.signal }); // ⬅ soporta abort
        if (!alive) return;
        setUser(u); // u puede ser objeto o null
      } catch (err) {
        if (err?.name !== 'AbortError') {
          console.error('[Auth boot] /me failed:', err);
          if (alive) setUser(null);
        }
      } finally {
        if (alive) setLoading(false); // ⬅ SIEMPRE cerramos el loader
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const u = await doLogin({ email, password });
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const u = await doRegister({ name, email, password });
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await doLogout();
    } finally {
      setUser(null);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const u = await meQuiet();
      setUser(u);
      return u;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshMe }),
    [user, loading, login, register, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

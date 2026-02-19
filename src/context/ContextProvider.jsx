import { useEffect, useState } from 'react';
import api from '../services/api';
import { auth } from '../auth/firebaseConfig';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { AuthContext } from './authConstants';

/* ===================== CONSTANTS ===================== */

const ENDPOINTS = {
  admin: '/me-admin',
  distributor: '/me-distributor',
  corporate: '/me-corporate',
};

/* ===================== HELPERS ===================== */

const extractUser = (data) => {
  if (!data) return null;
  if (Array.isArray(data)) return data[0];
  return data.data || data.user || data;
};

const normalizeUser = (d) => {
  if (!d) return null;
  return {
    id: d.ID ?? d.id,
    username: d.USERNAME ?? d.username ?? d.CUSTOMER_NAME,
    email: d.EMAIL ?? d.email,
    role: d.ROLE ?? d.role,
    customer_name: d.CUSTOMER_NAME ?? d.customer_name,
    customer_code: d.CUSTOMER_CODE ?? d.customer_code,
    state: d.STATE ?? d.state,
    firebase_uid: d.FIREBASE_UID ?? d.firebase_uid,
  };
};

const saveSession = (type, role, data) => {
  localStorage.setItem('userType', type);
  localStorage.setItem('userRole', role);
  localStorage.setItem('userData', JSON.stringify(data));
};

const clearSession = () => {
  ['userType', 'userRole', 'userData'].forEach((k) =>
    localStorage.removeItem(k)
  );
};

/* ===================== CONTEXT ===================== */

const ContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);        // ✅ LOGGED IN USER (ALL ROLES)
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState(false);

  /* ===================== AUTH RESTORE ===================== */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isSigningUp) return;

      if (!firebaseUser) {
        clearSession();
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const token = await firebaseUser.getIdToken();
        const userType = localStorage.getItem('userType');

        if (!userType || !ENDPOINTS[userType]) {
          setLoading(false);
          return;
        }

        const res = await api.get(ENDPOINTS[userType], {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userData = normalizeUser(extractUser(res.data));
        if (!userData) throw new Error('Invalid user');

        setUser({
          ...firebaseUser,
          role: userData.role,
          username: userData.username,
          id: userData.id,
          email: userData.email,
          _userData: userData, // ✅ FULL BACKEND PROFILE
        });

        setRole(userData.role);
      } catch (err) {
        clearSession();
        setUser(null);
        setRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [isSigningUp]);

  /* ===================== UNIVERSAL LOGIN ===================== */

  const loginWithRole = async (email, password, userType) => {
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const token = await firebaseUser.getIdToken();
      const res = await api.get(ENDPOINTS[userType], {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = normalizeUser(extractUser(res.data));
      if (!userData) throw new Error('User not found');

      saveSession(userType, userData.role, userData);

      setUser({
        ...firebaseUser,
        role: userData.role,
        username: userData.username,
        id: userData.id,
        email: userData.email,
        _userData: userData,
      });

      setRole(userData.role);

      return { success: true, role: userData.role, userData };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.error ||
          error.message ||
          'Login failed',
      };
    }
  };

  /* ===================== LOGIN APIS ===================== */

  const loginAdmin = (email, password) =>
    loginWithRole(email, password, 'admin');

  const loginDistributor = (email, password) =>
    loginWithRole(email, password, 'distributor');

  const loginCorporate = (email, password) =>
    loginWithRole(email, password, 'corporate');

  /* ===================== SIGNUP ===================== */

  const signup = async (username, email, password, mobileNumber) => {
    setIsSigningUp(true);
    try {
      const { user: firebaseUser } =
        await createUserWithEmailAndPassword(auth, email, password);

      const token = await firebaseUser.getIdToken();

      const res = await api.post(
        '/signup-admin',
        {
          username,
          email,
          mobile_number: mobileNumber,
          firebaseUid: firebaseUser.uid,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const userData = normalizeUser(extractUser(res.data));
      saveSession('admin', userData.role, userData);

      return { success: true, userData };
    } catch (err) {
      if (auth.currentUser) await auth.currentUser.delete();
      return {
        success: false,
        message:
          err.response?.data?.error ||
          err.message ||
          'Signup failed',
      };
    } finally {
      setIsSigningUp(false);
    }
  };

  /* ===================== LOGOUT ===================== */

  const logout = async () => {
    clearSession();
    await signOut(auth);
    setUser(null);
    setRole(null);
  };

  /* ===================== PROVIDER ===================== */

  return (
    <AuthContext.Provider
      value={{
        user,      // ✅ ALWAYS USE THIS
        role,      // ✅ ALWAYS USE THIS
        loading,
        loginAdmin,
        loginDistributor,
        loginCorporate,
        signup,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default ContextProvider;

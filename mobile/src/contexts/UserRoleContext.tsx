import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

export type UserRole = 'buyer' | 'seller' | 'affiliate';

interface UserRoleState {
  currentRole: UserRole;
  availableRoles: UserRole[];
  isSellerVerified: boolean;
  isAffiliateActive: boolean;
}

interface UserRoleContextType extends UserRoleState {
  switchRole: (role: UserRole) => Promise<void>;
  canStream: boolean;
  canManageProducts: boolean;
  canAccessSellerDashboard: boolean;
  canAccessAffiliateDashboard: boolean;
  refreshRoleStatus: () => Promise<void>;
}

const ROLE_STORAGE_KEY = '@gshop_current_role';

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

interface UserRoleProviderProps {
  children: ReactNode;
}

export function UserRoleProvider({ children }: UserRoleProviderProps) {
  const { user, isAuthenticated } = useAuth();

  const [state, setState] = useState<UserRoleState>({
    currentRole: 'buyer',
    availableRoles: ['buyer'],
    isSellerVerified: false,
    isAffiliateActive: false,
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      loadRoleState();
    } else {
      resetToDefault();
    }
  }, [isAuthenticated, user]);

  const resetToDefault = () => {
    setState({
      currentRole: 'buyer',
      availableRoles: ['buyer'],
      isSellerVerified: false,
      isAffiliateActive: false,
    });
  };

  const loadRoleState = async () => {
    try {
      if (!user) return;

      const availableRoles: UserRole[] = ['buyer'];
      let isSellerVerified = false;
      let isAffiliateActive = false;

      const userRole = user.role?.toLowerCase();

      if (userRole === 'seller' || userRole === 'admin') {
        availableRoles.push('seller');
        isSellerVerified = true;
      }

      if (userRole === 'affiliate' || userRole === 'seller' || userRole === 'admin') {
        availableRoles.push('affiliate');
        isAffiliateActive = true;
      }

      const savedRole = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
      let currentRole: UserRole = 'buyer';

      if (savedRole && availableRoles.includes(savedRole as UserRole)) {
        currentRole = savedRole as UserRole;
      } else if (userRole === 'seller') {
        currentRole = 'seller';
      } else if (userRole === 'affiliate') {
        currentRole = 'affiliate';
      }

      setState({
        currentRole,
        availableRoles,
        isSellerVerified,
        isAffiliateActive,
      });
    } catch (error) {
      console.error('Error loading role state:', error);
      resetToDefault();
    }
  };

  const switchRole = async (role: UserRole) => {
    if (!state.availableRoles.includes(role)) {
      throw new Error(`Role "${role}" is not available for this user`);
    }

    try {
      await AsyncStorage.setItem(ROLE_STORAGE_KEY, role);
      setState(prev => ({
        ...prev,
        currentRole: role,
      }));
    } catch (error) {
      console.error('Error switching role:', error);
      throw new Error('Failed to switch role');
    }
  };

  const refreshRoleStatus = async () => {
    await loadRoleState();
  };

  const canStream = state.currentRole === 'seller' || state.currentRole === 'affiliate';
  const canManageProducts = state.currentRole === 'seller';
  const canAccessSellerDashboard = state.currentRole === 'seller' && state.isSellerVerified;
  const canAccessAffiliateDashboard = state.currentRole === 'affiliate' && state.isAffiliateActive;

  return (
    <UserRoleContext.Provider
      value={{
        ...state,
        switchRole,
        canStream,
        canManageProducts,
        canAccessSellerDashboard,
        canAccessAffiliateDashboard,
        refreshRoleStatus,
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole(): UserRoleContextType {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
}

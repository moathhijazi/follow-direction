// hooks/useAuth.ts
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

// Storage keys
const SESSION_KEY = "supabase_auth_session";
const USER_KEY = "supabase_auth_user";
const PROFILE_KEY = "supabase_auth_profile";

// Types
interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  access: string | null;
  expo_push_token?: string | null;
  notification_enabled?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
    user: null,
    session: null,
    profile: null,
  });

  // Separate function to disable notifications without hook dependency
  const disableNotificationsOnLogout = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      if (!authState.user?.id) {
        return { success: true }; // No user to disable
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          notification_enabled: false,
          expo_push_token: null,
        })
        .eq("id", authState.user.id);

      if (error) {
        console.error("Error disabling notifications:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Exception disabling notifications:", error);
      return { success: false, error: error.message };
    }
  }, [authState.user?.id]);

  // hooks/useAuth.ts (Updated fetchUserProfile function)
  const fetchUserProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      try {
        // Try to get existing profile
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          // If no profile exists, create one
          if (error.code === "PGRST116" || error.message.includes("0 rows")) {
            console.log("No profile found, creating one...");

            // Create a new profile for the user
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert({
                id: userId,
                full_name: null,
                avatar_url: null,
                role: "user", // Default role
                access: "limit", // Default access
                notification_enabled: false,
              })
              .select()
              .single();

            if (createError) {
              console.error("Error creating profile:", createError);
              return null;
            }

            return newProfile;
          } else {
            console.error("Error fetching profile:", error);
            return null;
          }
        }

        return data;
      } catch (error) {
        console.error("Error in fetchUserProfile:", error);
        return null;
      }
    },
    [],
  );

  // Store all auth data
  const storeAuthData = async (
    session: Session,
    user: User,
    profile: Profile | null,
  ) => {
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      if (profile) {
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      }
    } catch (error) {
      console.error("Error storing auth data:", error);
    }
  };

  const getStoredSession = async (): Promise<Session | null> => {
    try {
      const sessionJson = await AsyncStorage.getItem(SESSION_KEY);
      return sessionJson ? JSON.parse(sessionJson) : null;
    } catch (error) {
      console.error("Error getting stored session:", error);
      return null;
    }
  };

  const getStoredProfile = async (): Promise<Profile | null> => {
    try {
      const profileJson = await AsyncStorage.getItem(PROFILE_KEY);
      return profileJson ? JSON.parse(profileJson) : null;
    } catch (error) {
      console.error("Error getting stored profile:", error);
      return null;
    }
  };

  const clearStoredSession = async () => {
    try {
      await AsyncStorage.multiRemove([SESSION_KEY, USER_KEY, PROFILE_KEY]);
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  };

  // Load stored session on mount
  useEffect(() => {
    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);

      if (session?.user) {
        // Fetch profile from database
        const profile = await fetchUserProfile(session.user.id);

        await storeAuthData(session, session.user, profile);

        setAuthState({
          isAuthenticated: true,
          loading: false,
          user: session.user,
          session,
          profile,
        });
      } else {
        await clearStoredSession();
        setAuthState({
          isAuthenticated: false,
          loading: false,
          user: null,
          session: null,
          profile: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const checkSession = async () => {
    try {
      // Check Supabase for active session first
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
        await clearStoredSession();
      }

      if (session?.user) {
        // Fetch profile from database
        const profile = await fetchUserProfile(session.user.id);

        await storeAuthData(session, session.user, profile);

        setAuthState({
          isAuthenticated: true,
          loading: false,
          user: session.user,
          session,
          profile,
        });
        return;
      }

      // Fallback to stored session
      const storedSession = await getStoredSession();
      if (storedSession?.user) {
        const {
          data: { session: refreshedSession },
          error: refreshError,
        } = await supabase.auth.setSession({
          access_token: storedSession.access_token,
          refresh_token: storedSession.refresh_token,
        });

        if (!refreshError && refreshedSession?.user) {
          // Fetch fresh profile for refreshed session
          const profile = await fetchUserProfile(refreshedSession.user.id);

          await storeAuthData(refreshedSession, refreshedSession.user, profile);

          setAuthState({
            isAuthenticated: true,
            loading: false,
            user: refreshedSession.user,
            session: refreshedSession,
            profile,
          });
          return;
        }
      }

      // No valid session
      setAuthState((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      console.error("Error checking session:", error);
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  };

  // Login with email/password
  const login = async (
    credentials: LoginCredentials,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        setAuthState((prev) => ({ ...prev, loading: false }));
        return {
          success: false,
          error: error.message,
        };
      }

      if (data.session && data.user) {
        // Fetch profile after login
        const profile = await fetchUserProfile(data.user.id);

        await storeAuthData(data.session, data.user, profile);

        setAuthState({
          isAuthenticated: true,
          loading: false,
          user: data.user,
          session: data.session,
          profile,
        });

        return { success: true };
      }

      return { success: false, error: "Login failed" };
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthState((prev) => ({ ...prev, loading: false }));
      return {
        success: false,
        error: error.message || "Login failed",
      };
    }
  };

  // Logout
  const logout = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true }));

      // Disable notifications before logout
      const disableResult = await disableNotificationsOnLogout();
      if (!disableResult.success) {
        console.warn("Failed to disable notifications:", disableResult.error);
        // Continue with logout anyway
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        setAuthState((prev) => ({ ...prev, loading: false }));
        return {
          success: false,
          error: error.message,
        };
      }

      await clearStoredSession();
      setAuthState({
        isAuthenticated: false,
        loading: false,
        user: null,
        session: null,
        profile: null,
      });

      return { success: true };
    } catch (error: any) {
      console.error("Logout error:", error);
      setAuthState((prev) => ({ ...prev, loading: false }));
      return {
        success: false,
        error: error.message || "Logout failed",
      };
    }
  };

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    await checkSession();
  }, []);

  // Refresh profile data
  const refreshProfile = async (): Promise<Profile | null> => {
    try {
      if (!authState.user) return null;

      const profile = await fetchUserProfile(authState.user.id);

      if (profile) {
        setAuthState((prev) => ({ ...prev, profile }));
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      }

      return profile;
    } catch (error) {
      console.error("Error refreshing profile:", error);
      return null;
    }
  };

  // Update profile
  const updateProfile = async (
    updates: Partial<Profile>,
  ): Promise<{ success: boolean; error?: string; profile?: Profile }> => {
    try {
      if (!authState.user) {
        return { success: false, error: "No user logged in" };
      }

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", authState.user.id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      setAuthState((prev) => ({ ...prev, profile: data }));
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(data));

      return { success: true, profile: data };
    } catch (error: any) {
      console.error("Update profile error:", error);
      return {
        success: false,
        error: error.message || "Failed to update profile",
      };
    }
  };

  // Manually disable notifications (for use in components)
  const disableNotifications = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    return disableNotificationsOnLogout();
  };

  return {
    // State
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    user: authState.user,
    session: authState.session,
    profile: authState.profile,

    // Actions
    login,
    logout,
    checkAuth,
    refreshProfile,
    updateProfile,
    disableNotifications, // Export this for components that need it

    // Helper functions
    getUserMetadata: () => authState.user?.user_metadata,
    getUserId: () => authState.user?.id,
    getUserEmail: () => authState.user?.email,

    // Profile helpers
    getUserName: () =>
      authState.profile?.full_name ||
      authState.user?.email?.split("@")[0] ||
      "مستخدم",
    getUserAvatar: () => authState.profile?.avatar_url,
  };
};

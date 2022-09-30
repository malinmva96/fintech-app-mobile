import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";

const ClientContext = createContext();

export function ClientProvider({ children }) {
  const client = createClient(
    "https://bzapzgzmkjthqldldjab.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6YXB6Z3pta2p0aHFsZGxkamFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjQxMTEzOTMsImV4cCI6MTk3OTY4NzM5M30.HGfUQKLsvRVTNXGyp5hLnVIU-T_xmkh9kq_nm20Ar5U",
    {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );

  const [currentUser, _setCurrentUser] = useState({ invalidated: true });

  // Try to save the session on persistent storage.
  const setCurrentUser = (currentUser) => {
    _setCurrentUser(currentUser);
    AsyncStorage.setItem("fintech_app_session", JSON.stringify(currentUser));
  };

  useEffect(() => {
    if (currentUser.invalidated) {
      // Try to get latest data on persistent storage if there is an network issue.
      // Since expo does not allow to work when there is a network issue, this cannot be tested.
      // AsyncStorage.getItem("fintech_app_session");
      client.auth.getSession().then(async ({ data: { session } }) => {
        let currentUser = null;
        if (session) {
          currentUser = {
            id: session.user.id,
            email: session.user.email,
            name: (
              await client
                .from("Profile")
                .select("name")
                .eq("id", session.user.id)
                .single()
            ).data.name,
            watchlist: (
              await client.rpc("get_watchlist", { user_id: session.user.id })
            ).data,
            portfolio: (
              await client.rpc("get_portfolio", { user_id: session.user.id })
            ).data.map((item) => JSON.parse(item)),
          };
        }
        setCurrentUser({ invalidated: false, value: currentUser });
      });
    }
  }, [currentUser]);

  const invalidate = () => {
    setCurrentUser({ ...currentUser, invalidated: true });
  };

  return (
    <ClientContext.Provider
      value={{
        client,
        session: { user: currentUser.value, invalidate },
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClientContext() {
  return useContext(ClientContext);
}

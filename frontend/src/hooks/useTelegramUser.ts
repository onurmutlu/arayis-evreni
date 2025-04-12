
import { useEffect, useState } from 'react';

export default function useTelegramUser() {
  const [uid, setUid] = useState("demo123");

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const user = window.Telegram.WebApp.initDataUnsafe?.user;
      if (user) {
        setUid(user.id.toString());
      }
    }
  }, []);

  return { uid };
}

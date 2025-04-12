
import { useEffect } from 'react';
import useTelegramUser from './hooks/useTelegramUser';
import './styles/global.css';

function App() {
  const { uid } = useTelegramUser();

  useEffect(() => {
    console.log("App initialized for UID:", uid);
  }, [uid]);

  return (
    <div className="app">
      <h1>Arayış Evreni</h1>
      <p>Hoş geldin, kullanıcı {uid}</p>
    </div>
  );
}

export default App;

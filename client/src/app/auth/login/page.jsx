import { useState } from 'react';
import LoginForm from "@/LoginForm";

import { login } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const setToken = useAuthStore((state) => state.setToken);
  const [logged, setLogged] = useState(false);

  const handleLogin = async (form) => {
    try {
      const data = await login(form); 
      setToken(data.token);
      alert('Zalogowano!');
      setLogged(true);

      useEffect(() => {
          if (token) router.push("/dashboard");
      }, [token]);
    } catch (err) {
      alert('Błąd logowania: ' + err.response?.data?.message || err.message);
    }
  };
  return (<div>
    <LoginForm onLogin={handleLogin} />
    </div>);
}
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

interface LoginForm {
  email: string;
  password: string;
}

const LoginPage = () => {
  const { register, handleSubmit } = useForm<LoginForm>();
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await api.post('/auth/login', data);
      setAuth({ user: response.data.user, accessToken: response.data.accessToken });
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Giriş başarısız. Bilgilerinizi kontrol edin.');
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-slate-100">
      <form
        onSubmit={onSubmit}
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-slate-800">{t('auth.login.title')}</h1>
          <p className="text-sm text-slate-500">
            Supervisor, öğretmen veya öğrenci hesabınız ile giriş yapabilirsiniz.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-600" htmlFor="email">
            {t('auth.email')}
          </label>
          <input
            id="email"
            type="email"
            {...register('email', { required: true })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-600" htmlFor="password">
            {t('auth.password')}
          </label>
          <input
            id="password"
            type="password"
            {...register('password', { required: true })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {error && <p className="text-sm text-rose-500">{error}</p>}

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 font-semibold"
        >
          {t('auth.login.button')}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;

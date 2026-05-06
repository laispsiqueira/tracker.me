import React, { useState } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { LogIn, Github, AtSign, Lock, Chrome, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Bem-vindo!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao entrar com Google');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Logado com sucesso!');
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });
        toast.success('Conta criada com sucesso!');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#F1EFE8]">
      <div className="hidden md:flex bg-[#3B6D11] p-12 text-white flex-col justify-between">
        <div>
          <h1 className="text-5xl font-serif mb-6 leading-tight">Mude sua vida um dia de cada vez.</h1>
          <p className="text-xl opacity-80 font-light">Habitly ajuda você a construir uma rotina mais saudável com flexibilidade e clareza.</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-serif text-2xl italic">h</div>
          <div>
            <p className="font-medium">Hábitos Tracker</p>
            <p className="text-sm opacity-60">Design simplificado para alta performance.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl shadow-black/5 p-8 sm:p-10"
          >
            <h2 className="text-3xl font-serif text-[#3B6D11] mb-2">{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
            <p className="text-[#888780] mb-8 font-light">
              {isLogin ? 'Entre para gerenciar seus hábitos.' : 'Comece sua jornada hoje mesmo.'}
            </p>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-[#D3D1C7] text-[#444441] py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors mb-6 font-medium"
            >
              <Chrome size={20} className="text-blue-500" />
              Entrar com Google
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#D3D1C7]"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-[#888780]">ou use e-mail</span></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B4B2A9]" size={20} />
                  <input
                    type="text"
                    placeholder="Seu nome"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#F1EFE8] border-none rounded-xl focus:ring-2 focus:ring-[#3B6D11] transition-shadow outline-none"
                  />
                </div>
              )}
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B4B2A9]" size={20} />
                <input
                  type="email"
                  placeholder="E-mail"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#F1EFE8] border-none rounded-xl focus:ring-2 focus:ring-[#3B6D11] transition-shadow outline-none"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B4B2A9]" size={20} />
                <input
                  type="password"
                  placeholder="Senha"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#F1EFE8] border-none rounded-xl focus:ring-2 focus:ring-[#3B6D11] transition-shadow outline-none"
                />
              </div>

              <button
                disabled={loading}
                className="w-full bg-[#3B6D11] text-white py-3 px-4 rounded-xl hover:bg-[#27500A] transition-colors font-medium shadow-lg shadow-[#3B6D11]/20 flex items-center justify-center gap-2"
              >
                {loading ? 'Processando...' : isLogin ? <><LogIn size={20} /> Entrar</> : <><UserPlus size={20} /> Criar conta</>}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-[#888780]">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-[#3B6D11] font-semibold hover:underline"
              >
                {isLogin ? 'Cadastre-se' : 'Entrar'}
              </button>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

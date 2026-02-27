import React, { useState } from 'react';
import type { UserProfile } from '../types';
import { validateLogin, registerUser, isCpfRegistered, updateUserPassword } from '../db';

interface LoginProps {
    onLoginSuccess: (user: UserProfile, isNewUser: boolean) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [isRecovering, setIsRecovering] = useState(false);
    const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3>(1); // 1: Send Code, 2: Verify Code, 3: Reset Password

    // States: Login / Recovery
    const [loginUsuario, setLoginUsuario] = useState('');
    const [loginSenha, setLoginSenha] = useState('');
    const [recContato, setRecContato] = useState('');
    const [recCodigo, setRecCodigo] = useState('');
    const [recNovaSenha, setRecNovaSenha] = useState('');

    // States: Registro (Obrigatórios)
    const [regNome, setRegNome] = useState('');
    const [regCpf, setRegCpf] = useState('');
    const [regContato, setRegContato] = useState('');
    const [regSenha, setRegSenha] = useState('');
    const [regSenhaGov, setRegSenhaGov] = useState('');
    // States: Registro (Opcionais)
    const [regEmail, setRegEmail] = useState('');
    const [regClube, setRegClube] = useState('');
    const [regCR, setRegCR] = useState('');
    const [regCRValidade, setRegCRValidade] = useState('');
    const [regAtivAtirador, setRegAtivAtirador] = useState(false);
    const [regAtivCacador, setRegAtivCacador] = useState(false);
    const [regAtivColecionador, setRegAtivColecionador] = useState(false);

    // UI States
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');
        setSucesso('');
        setIsLoading(true);

        const cpf = loginUsuario.replace(/\D/g, '');

        // Verifica CPF no banco de dados
        const { profile, error, code } = await validateLogin(cpf, loginSenha);

        if (profile === null) {
            if (code === 'WRONG_PASSWORD') {
                setErro('Senha incorreta. Verifique sua senha.');
            } else if (code === 'NOT_FOUND') {
                setErro('CPF NÃO CADASTRADO, CRIE SEU LOGIN ABAIXO');
            } else {
                setErro(error || 'Erro ao fazer login.');
            }
            setIsLoading(false);
            return;
        }

        onLoginSuccess(profile, false);
        setIsLoading(false);
    };

    const handleRecoverPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');
        setSucesso('');
        setIsLoading(true);

        if (recoveryStep === 1) {
            const cpf = loginUsuario.replace(/\D/g, '');
            if (!cpf || !recContato) {
                setErro('Por favor, informe seu CPF e Contato para recuperação.');
                setIsLoading(false);
                return;
            }

            const cpfExists = await isCpfRegistered(cpf);
            if (!cpfExists) {
                setErro('CPF não encontrado. Verifique o número digitado.');
                setIsLoading(false);
                return;
            }
            setSucesso(`Um código foi enviado via SMS para ${recContato}. (Para este teste, digite o código: 5678)`);
            setRecoveryStep(2);
        } else if (recoveryStep === 2) {
            if (recCodigo !== '5678') {
                setErro('Código inválido. Para fins de teste, use 5678.');
                setIsLoading(false);
                return;
            }
            setSucesso('Código validado com sucesso! Crie sua nova senha.');
            setRecoveryStep(3);
        } else if (recoveryStep === 3) {
            if (!recNovaSenha) {
                setErro('Por favor, digite a nova senha.');
                setIsLoading(false);
                return;
            }
            // Salva a nova senha no banco de dados
            const cpf = loginUsuario.replace(/\D/g, '');
            const ok = await updateUserPassword(cpf, recNovaSenha);

            if (!ok) {
                setErro('Erro ao atualizar senha.');
                setIsLoading(false);
                return;
            }

            setSucesso('Senha redefinida com sucesso! Faça login com a nova senha.');
            setTimeout(() => {
                setIsRecovering(false);
                setRecoveryStep(1);
                setSucesso('');
                setLoginUsuario('');
                setRecContato('');
                setRecCodigo('');
                setRecNovaSenha('');
            }, 3000);
        }
        setIsLoading(false);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');
        setSucesso('');
        setIsLoading(true);

        if (!regNome || !regCpf || !regContato || !regSenha || !regSenhaGov) {
            setErro('Preencha todos os campos obrigatórios (*).');
            setIsLoading(false);
            return;
        }

        if (!regAtivAtirador && !regAtivCacador && !regAtivColecionador) {
            setErro('Selecione pelo menos uma Atividade Ativa no CR (*).');
            setIsLoading(false);
            return;
        }

        const cpfClean = regCpf.replace(/\D/g, '');
        const cpfExists = await isCpfRegistered(cpfClean);
        if (cpfExists) {
            setErro('CPF já cadastrado. Redefina a sua senha se necessário.');
            setIsLoading(false);
            return;
        }

        const ativ: string[] = [];
        if (regAtivAtirador) ativ.push('Atirador Desportivo');
        if (regAtivCacador) ativ.push('Caçador');
        if (regAtivColecionador) ativ.push('Colecionador');

        const newUser: UserProfile = {
            id: `user-${Date.now()}`,
            role: 'user',
            nome: regNome,
            cpf: cpfClean,
            telefone: regContato,
            senhaGovBr: regSenhaGov,
            numeroCR: regCR,
            vencimentoCR: regCRValidade,
            atividadesCR: ativ,
            email: regEmail,
            clubeFiliado: regClube,
            observacoesGlobais: ''
        };

        // Salva o usuário no banco de dados remoto
        const ok = await registerUser(newUser, regSenha);
        if (!ok) {
            setErro('Erro ao cadastrar. Verifique a conexão ou CPF já registrado.');
            setIsLoading(false);
            return;
        }

        setSucesso('Cadastro realizado com sucesso! Faça login.');
        setTimeout(() => {
            setIsRegistering(false);
        }, 1500);
        setIsLoading(false);
    };

    return (
        <div className="login-container flex flex-col items-center justify-center min-h-screen relative p-4" style={{ padding: '2rem 1rem' }}>
            <div className="bg-watermark"></div>

            <div className="glass-panel p-8 w-full animate-fade-in relative z-10" style={{ maxWidth: isRegistering ? '40rem' : '28rem' }}>
                <div className="flex flex-col items-center mb-6">
                    <img src="/logo.png" alt="GCAC Logo" className="login-logo mb-4" />
                    <h2 className="text-2xl font-bold text-center">Gestão Pessoal CAC</h2>
                    <p className="text-muted text-center mt-2">
                        {isRegistering ? 'Cadastre sua nova conta' : isRecovering ? 'Recuperação de Senha' : ''}
                    </p>
                </div>

                {erro && (
                    <div className="p-3 mb-4 bg-danger bg-opacity-20 text-danger border border-danger rounded-md text-sm text-center animate-fade-in">
                        {erro}
                    </div>
                )}
                {sucesso && (
                    <div className="p-3 mb-4 bg-success bg-opacity-20 text-success border border-success rounded-md text-sm text-center animate-fade-in">
                        {sucesso}
                    </div>
                )}

                {isRecovering ? (
                    /* FORMULÁRIO DE RECUPERAÇÃO DE SENHA */
                    <form onSubmit={handleRecoverPassword} className="flex flex-col gap-4 animate-fade-in">
                        {recoveryStep === 1 && (
                            <>
                                <div>
                                    <label className="text-sm font-bold mb-1 block">Informe seu CPF</label>
                                    <input
                                        type="text"
                                        placeholder="Apenas números"
                                        value={loginUsuario}
                                        onChange={(e) => setLoginUsuario(e.target.value)}
                                        required
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold mb-1 block">Contato de Celular</label>
                                    <input
                                        type="text"
                                        placeholder="Número de Cadastro"
                                        value={recContato}
                                        onChange={(e) => setRecContato(e.target.value)}
                                        required
                                        className="w-full"
                                    />
                                </div>
                            </>
                        )}

                        {recoveryStep === 2 && (
                            <div>
                                <label className="text-sm font-bold mb-1 block">Código Recebido (SMS)</label>
                                <input
                                    type="text"
                                    placeholder="Ex: 5678"
                                    value={recCodigo}
                                    onChange={(e) => setRecCodigo(e.target.value)}
                                    required
                                    className="w-full text-center text-lg tracking-widest"
                                />
                            </div>
                        )}

                        {recoveryStep === 3 && (
                            <div>
                                <label className="text-sm font-bold mb-1 block">Nova Senha</label>
                                <input
                                    type="password"
                                    placeholder="Digite a nova senha"
                                    value={recNovaSenha}
                                    onChange={(e) => setRecNovaSenha(e.target.value)}
                                    required
                                    className="w-full"
                                />
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary w-full mt-2 text-lg py-3 flex justify-center items-center" disabled={isLoading}>
                            {isLoading ? <span className="loading-spinner"></span> : recoveryStep === 1 ? 'Enviar Código' : recoveryStep === 2 ? 'Verificar Código' : 'Salvar Nova Senha'}
                        </button>
                        <div className="mt-4 pt-4 border-t border-color-light text-center text-sm">
                            <button
                                type="button"
                                className="btn btn-secondary w-full"
                                onClick={() => {
                                    setErro('');
                                    setSucesso('');
                                    setIsRecovering(false);
                                    setRecoveryStep(1);
                                }}
                            >
                                Voltar ao Login
                            </button>
                        </div>
                    </form>
                ) : !isRegistering ? (
                    /* FORMULÁRIO DE LOGIN */
                    <form onSubmit={handleLogin} className="flex flex-col gap-4 animate-fade-in">
                        <div>
                            <label className="text-sm font-bold mb-1 block">CPF</label>
                            <input
                                type="text"
                                placeholder="Ex: 111.222.333-44"
                                value={loginUsuario}
                                onChange={(e) => setLoginUsuario(e.target.value)}
                                required
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold mb-1 block">Senha</label>
                            <input
                                type="password"
                                placeholder="Ex: 1234"
                                value={loginSenha}
                                onChange={(e) => setLoginSenha(e.target.value)}
                                required
                                className="w-full"
                            />
                        </div>

                        <button type="submit" className="btn btn-primary w-full text-lg py-3 flex justify-center items-center mt-4" disabled={isLoading}>
                            {isLoading ? <span className="loading-spinner"></span> : 'Entrar no Sistema'}
                        </button>

                        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-color-light text-center text-sm">
                            <p className="text-muted mb-1">Ainda não tem uma conta?</p>
                            <button
                                type="button"
                                className="btn btn-secondary w-full"
                                onClick={() => {
                                    setErro('');
                                    setSucesso('');
                                    setIsRegistering(true);
                                }}
                            >
                                Criar Login
                            </button>

                            <button
                                type="button"
                                className="text-xs text-muted hover:text-accent-primary underline bg-transparent border-none cursor-pointer mt-4 p-0 font-normal outline-none focus:outline-none focus:ring-0 shadow-none hover:bg-transparent"
                                onClick={() => {
                                    setErro('');
                                    setSucesso('');
                                    setIsRecovering(true);
                                }}
                            >
                                ESQUECI MINHA SENHA
                            </button>
                        </div>
                    </form>
                ) : (
                    /* FORMULÁRIO DE CADASTRO */
                    <form onSubmit={handleRegister} className="flex flex-col gap-4 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* OBRIGATÓRIOS */}
                            <div className="flex flex-col gap-4 bg-black bg-opacity-20 p-4 rounded-md border border-color-light">
                                <h3 className="font-bold text-accent-primary border-b border-color-light pb-2">Dados Obrigatórios</h3>

                                <div>
                                    <label className="text-sm font-bold mb-1 block">Nome Completo *</label>
                                    <input type="text" value={regNome} onChange={e => setRegNome(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="text-sm font-bold mb-1 block">CPF *</label>
                                    <input type="text" value={regCpf} onChange={e => setRegCpf(e.target.value)} required placeholder="Somente números" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold mb-1 block">Contato (WhatsApp) *</label>
                                    <input type="text" value={regContato} onChange={e => setRegContato(e.target.value)} required placeholder="DDD e número" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold mb-1 block">Senha de Acesso *</label>
                                    <input type="password" value={regSenha} onChange={e => setRegSenha(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="text-sm font-bold mb-1 block">Senha GOV.br *</label>
                                    <input type="password" value={regSenhaGov} onChange={e => setRegSenhaGov(e.target.value)} required />
                                </div>
                            </div>

                            {/* OPCIONAIS */}
                            <div className="flex flex-col gap-4 p-4 rounded-md border border-color-light">
                                <h3 className="font-bold text-muted border-b border-color-light pb-2">Informações Adicionais (CR / Clube)</h3>

                                <div>
                                    <label className="text-sm font-bold mb-1 block">E-mail</label>
                                    <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="Opcional" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold mb-1 block">Clube de Tiro Filiado</label>
                                    <input type="text" value={regClube} onChange={e => setRegClube(e.target.value)} placeholder="Opcional" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold mb-1 block">Número do CR</label>
                                    <input type="text" value={regCR} onChange={e => setRegCR(e.target.value)} placeholder="Opcional" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold mb-1 block">Validade do CR</label>
                                    <input type="date" value={regCRValidade} onChange={e => setRegCRValidade(e.target.value)} />
                                </div>

                                <div>
                                    <label className="text-sm font-bold mb-2 block">Atividades Ativas no CR *</label>
                                    <div className="flex flex-col gap-3 bg-black bg-opacity-20 p-4 rounded-md border border-color-light">
                                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                                            <input type="checkbox" checked={regAtivAtirador} onChange={e => setRegAtivAtirador(e.target.checked)} />
                                            Atirador Desportivo
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                                            <input type="checkbox" checked={regAtivCacador} onChange={e => setRegAtivCacador(e.target.checked)} />
                                            Caçador
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                                            <input type="checkbox" checked={regAtivColecionador} onChange={e => setRegAtivColecionador(e.target.checked)} />
                                            Colecionador
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-color-light">
                            <button
                                type="button"
                                className="btn btn-secondary w-full"
                                onClick={() => {
                                    setErro('');
                                    setIsRegistering(false);
                                }}
                            >
                                Voltar ao Login
                            </button>
                            <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                                {isLoading ? <span className="loading-spinner"></span> : 'SALVAR'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div >
    );
};

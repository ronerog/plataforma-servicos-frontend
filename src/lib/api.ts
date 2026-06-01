import axios from 'axios';

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://plataforma-servicos-prod.eba-m2g53m4u.sa-east-1.elasticbeanstalk.com';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (email: string, senha: string) =>
  api.post('/api/auth/login', { email, senha });

// Usuários
export const cadastrarCidadao = (data: Record<string, unknown>) =>
  api.post('/api/usuarios/cidadao', data);

export const cadastrarPrestador = (data: Record<string, unknown>) =>
  api.post('/api/usuarios/prestador', data);

export const getPerfilCidadao = (id: number) =>
  api.get(`/api/usuarios/cidadao/${id}`);

export const getMeuPerfilPrestador = () =>
  api.get('/api/usuarios/prestador/meu-perfil');

export const getCidadaos = () => api.get('/api/usuarios/cidadaos');
export const getPrestadores = () => api.get('/api/usuarios/prestadores');
export const aprovarPrestador = (idPerfil: number) => api.patch(`/api/usuarios/prestador/${idPerfil}/aprovar`);
export const reprovarPrestador = (idPerfil: number) => api.patch(`/api/usuarios/prestador/${idPerfil}/reprovar`);

export const uploadAnexoPrestador = (arquivo: File, tipoDocumento: string) => {
  const form = new FormData();
  form.append('arquivo', arquivo);
  form.append('tipoDocumento', tipoDocumento);
  return api.post('/api/usuarios/prestador/meus-anexos', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const listarAnexosPrestador = (idPerfil: number) =>
  api.get(`/api/usuarios/prestador/${idPerfil}/anexos`);

export const downloadAnexo = (idAnexo: number) =>
  api.get(`/api/usuarios/prestador/anexos/${idAnexo}/download`, { responseType: 'blob' });

// Serviços
export const getCategorias = () => api.get('/api/servicos/categorias');
export const getTodasCategorias = () => api.get('/api/servicos/categorias/todas');

export const criarCategoria = (nomeCategoria: string) =>
  api.post('/api/servicos/categorias', { nomeCategoria });

export const inativarCategoria = (id: number) => api.patch(`/api/servicos/categorias/${id}/inativar`);
export const ativarCategoria = (id: number) => api.patch(`/api/servicos/categorias/${id}/ativar`);
export const renomearCategoria = (id: number, nomeCategoria: string) =>
  api.patch(`/api/servicos/categorias/${id}`, { nomeCategoria });

export const getServicos = () => api.get('/api/servicos');

export const getMeusServicos = () => api.get('/api/servicos/meus');

export const criarServico = (data: { titulo: string; descricao?: string; idCategoria: number; publicar?: boolean }) =>
  api.post('/api/servicos', data);

export const atualizarServico = (id: number, data: { titulo: string; descricao?: string; idCategoria: number }) =>
  api.patch(`/api/servicos/${id}`, data);

export const publicarServico = (id: number) => api.patch(`/api/servicos/${id}/publicar`);
export const inativarServico = (id: number) => api.patch(`/api/servicos/${id}/inativar`);
export const excluirServico = (id: number) => api.delete(`/api/servicos/${id}`);

export const uploadFotoServico = (id: number, arquivo: File, ordem: number) => {
  const form = new FormData();
  form.append('arquivo', arquivo);
  form.append('ordem', String(ordem));
  return api.post(`/api/servicos/${id}/fotos`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getFotoUrl = (idFoto: number) =>
  `${BASE_URL}/api/servicos/fotos/${idFoto}/download`;

// Solicitações
export const criarSolicitacao = (idServico: number) =>
  api.post('/api/solicitacoes', { idServico });

export const getMinhasSolicitacoes = () => api.get('/api/solicitacoes/minhas');
export const getSolicitacoesRecebidas = () => api.get('/api/solicitacoes/recebidas');
export const aceitarSolicitacao = (id: number) => api.patch(`/api/solicitacoes/${id}/aceitar`);
export const recusarSolicitacao = (id: number) => api.patch(`/api/solicitacoes/${id}/recusar`);
export const concluirSolicitacao = (id: number) => api.patch(`/api/solicitacoes/${id}/concluir`);

// Avaliações
export const avaliarComoCidadao = (data: Record<string, unknown>) =>
  api.post('/api/avaliacoes/cidadao', data);

export const avaliarComoPrestador = (data: Record<string, unknown>) =>
  api.post('/api/avaliacoes/prestador', data);

export const getAvaliacoesSolicitacao = (idSolicitacao: number) =>
  api.get(`/api/avaliacoes/solicitacao/${idSolicitacao}`);

export const getAvaliacoesServico = (idServico: number) =>
  api.get(`/api/avaliacoes/servico/${idServico}`);

export const getAvaliacoesCidadaoPerfil = (idPerfilCidadao: number) =>
  api.get(`/api/avaliacoes/cidadao-perfil/${idPerfilCidadao}`);

// Ocorrências
export const criarOcorrencia = (data: Record<string, unknown>) =>
  api.post('/api/ocorrencias', data);

export const getOcorrenciasUsuario = (idUsuario: number) =>
  api.get(`/api/ocorrencias/usuario/${idUsuario}`);

export const resubmeterPrestador = (data: Record<string, unknown>) =>
  api.post('/api/usuarios/prestador/resubmeter', data);

export const excluirMinhaConta = () =>
  api.delete('/api/usuarios/minha-conta');

// Perfil completo (edição)
export const getMeuPerfilCidadaoCompleto = () =>
  api.get('/api/usuarios/cidadao/meu-perfil');

export const atualizarPerfilCidadao = (data: Record<string, unknown>) =>
  api.patch('/api/usuarios/cidadao/meu-perfil', data);

export const getMeuPerfilPrestadorCompleto = () =>
  api.get('/api/usuarios/prestador/meu-perfil-completo');

export const atualizarPerfilPrestador = (data: Record<string, unknown>) =>
  api.patch('/api/usuarios/prestador/meu-perfil', data);

import React, { useEffect, useState, useRef } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  X,
  Building2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Can } from '../components/auth/Can';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Product, Supplier } from '../types';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; nome: string }>>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<Array<{ id: string; sigla: string; nome: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Active form tab
  const [activeTab, setActiveTab] = useState<'geral' | 'precos' | 'detalhes'>('geral');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFormState = {
    nome: '',
    sku: '',
    codigoBarras: '',
    categoryId: '',
    unitId: '',
    supplierId: '',
    precoCusto: 0,
    precoVenda: 0,
    estoqueMinimo: 5,
    estoqueMaximo: 100,
    imagemUrl: '',
    fabricante: '',
    linkFornecedor: '',
    peso: 0,
    dimensoes: '',
    garantiaMeses: 0,
    localizacaoEstoque: '',
    descricao: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products', {
        params: { search, categoryId: selectedCategory || undefined },
      });
      setProducts(res.data.data || []);
    } catch (err) {
      toast('Erro ao carregar produtos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [resCat, resSup, resUnits] = await Promise.all([
        api.get('/products/categories').catch(() => ({ data: { data: [] } })),
        api.get('/suppliers').catch(() => ({ data: { data: [] } })),
        api.get('/products/units').catch(() => ({ data: { data: [] } })),
      ]);
      setCategories(resCat.data.data || []);
      setSuppliers(resSup.data.data || []);
      setUnits(resUnits.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados auxiliares', err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('Por favor, selecione um arquivo de imagem válido', 'warning');
      return;
    }

    try {
      setUploadingImage(true);
      const uploadData = new FormData();
      uploadData.append('image', file);

      const res = await api.post('/products/upload-image', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrl = res.data.imageUrl;
      setFormData((prev) => ({ ...prev, imagemUrl: imageUrl }));
      toast('Imagem enviada com sucesso!', 'success');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao enviar imagem', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        categoryId: formData.categoryId || null,
        unitId: formData.unitId || null,
        supplierId: formData.supplierId || null,
        precoCusto: Number(formData.precoCusto) || 0,
        precoVenda: Number(formData.precoVenda) || 0,
        estoqueMinimo: Number(formData.estoqueMinimo) || 0,
        estoqueMaximo: Number(formData.estoqueMaximo) || 1000,
        peso: Number(formData.peso) || 0,
        garantiaMeses: Number(formData.garantiaMeses) || 0,
      };

      if (selectedProduct) {
        await api.put(`/products/${selectedProduct.id}`, payload);
        toast('Produto atualizado com sucesso!', 'success');
      } else {
        await api.post('/products', payload);
        toast('Produto cadastrado com sucesso!', 'success');
      }
      setIsModalOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao salvar produto', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast('Produto excluído', 'success');
      fetchProducts();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao excluir produto', 'error');
    }
  };

  const openNewModal = () => {
    setSelectedProduct(null);
    setFormData(initialFormState);
    setActiveTab('geral');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setSelectedProduct(p);
    setFormData({
      nome: p.nome,
      sku: p.sku || '',
      codigoBarras: p.codigoBarras || '',
      categoryId: p.categoryId || '',
      unitId: p.unitId || '',
      supplierId: p.supplierId || '',
      precoCusto: p.precoCusto,
      precoVenda: p.precoVenda,
      estoqueMinimo: p.estoqueMinimo,
      estoqueMaximo: p.estoqueMaximo,
      imagemUrl: p.imagemUrl || '',
      fabricante: p.fabricante || '',
      linkFornecedor: p.linkFornecedor || '',
      peso: p.peso || 0,
      dimensoes: p.dimensoes || '',
      garantiaMeses: p.garantiaMeses || 0,
      localizacaoEstoque: p.localizacaoEstoque || '',
      descricao: p.descricao || '',
    });
    setActiveTab('geral');
    setIsModalOpen(true);
  };

  const openDetailModal = (p: Product) => {
    setSelectedProduct(p);
    setIsDetailModalOpen(true);
  };

  // Helper para formatar a URL da imagem
  const getImageUrl = (url?: string) => {
    if (!url) return null;
    return url;
  };

  // Margem de Lucro
  const margemLucro =
    formData.precoVenda > 0
      ? (((formData.precoVenda - formData.precoCusto) / formData.precoVenda) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Catálogo de Produtos</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Cadastro enriquecido com upload de imagens, fabricante, links externos de fornecedores e controle de estoque
              </p>
            </div>
          </div>
        </div>

        <Can permission="products.create">
          <button
            onClick={openNewModal}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-900/30 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Produto</span>
          </button>
        </Can>
      </div>

      {/* Main Card */}
      <Card>
        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por nome, SKU, fabricante ou código de barras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-56 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              <option value="">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-16">Foto</th>
                <th className="py-3.5 px-4">SKU / Cód.</th>
                <th className="py-3.5 px-4">Produto</th>
                <th className="py-3.5 px-4">Fabricante</th>
                <th className="py-3.5 px-4">Preço Custo</th>
                <th className="py-3.5 px-4">Preço Venda</th>
                <th className="py-3.5 px-4">Estoque</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      <span>Carregando catálogo de produtos...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-600 opacity-60" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">Nenhum produto cadastrado</p>
                    <p className="text-xs text-slate-400 mt-1">Clique em "Novo Produto" para adicionar itens com fotos e detalhes.</p>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const fullImg = getImageUrl(p.imagemUrl);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Foto Thumbnail */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => openDetailModal(p)}
                          className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          {fullImg ? (
                            <img src={fullImg} alt={p.nome} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400 opacity-50" />
                          )}
                        </div>
                      </td>

                      {/* SKU / Código */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {p.sku || p.codigo || '—'}
                      </td>

                      {/* Nome do Produto */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-100 block">{p.nome}</span>
                          {p.category && (
                            <span className="text-[11px] text-primary-600 dark:text-primary-400 font-semibold">
                              {p.category.nome}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Fabricante / Fornecedor */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs">
                          {p.fabricante ? (
                            <span className="font-semibold text-slate-700 dark:text-slate-300 block">{p.fabricante}</span>
                          ) : (
                            <span className="text-slate-400 italic">Não informado</span>
                          )}
                          {p.linkFornecedor && (
                            <a
                              href={p.linkFornecedor}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-[11px] text-sky-600 dark:text-sky-400 hover:underline mt-0.5"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Link Fornecedor
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Preço Custo */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        R$ {p.precoCusto.toFixed(2)}
                      </td>

                      {/* Preço Venda */}
                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                        R$ {p.precoVenda.toFixed(2)}
                      </td>

                      {/* Estoque */}
                      <td className="py-3.5 px-4">
                        <Badge variant={p.estoqueAtual <= p.estoqueMinimo ? 'warning' : 'success'}>
                          {p.estoqueAtual} {p.unit?.sigla || 'UN'}
                        </Badge>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openDetailModal(p)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-colors"
                            title="Ver Detalhes do Produto"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <Can permission="products.edit">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                              title="Editar Produto"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </Can>
                          <Can permission="products.delete">
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="Excluir Produto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Cadastro/Edição de Produto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProduct ? 'Editar Produto Detalhado' : 'Novo Produto Completo'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Navegação por Abas do Formulário */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4">
            <button
              type="button"
              onClick={() => setActiveTab('geral')}
              className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'geral'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              1. Identificação & Foto
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('precos')}
              className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'precos'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              2. Preços & Estoque
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('detalhes')}
              className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'detalhes'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              3. Fabricante, Fornecedor & Ficha Técnica
            </button>
          </div>

          {/* TAB 1: Identificação & Foto */}
          {activeTab === 'geral' && (
            <div className="space-y-4 animate-fade-in">
              {/* Seção Upload de Imagem */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-2">
                  Foto do Produto
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden group">
                    {formData.imagemUrl ? (
                      <>
                        <img
                          src={getImageUrl(formData.imagemUrl) || ''}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imagemUrl: '' })}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remover Imagem"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400 opacity-60" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        disabled={uploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingImage ? 'Enviando...' : 'Fazer Upload de Imagem'}</span>
                      </button>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Ou informe a URL externa da imagem:</span>
                      <input
                        type="url"
                        placeholder="https://exemplo.com/imagem-produto.jpg"
                        value={formData.imagemUrl}
                        onChange={(e) => setFormData({ ...formData, imagemUrl: e.target.value })}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Nome do Produto */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Furadeira de Impacto Profissional 750W"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              {/* SKU & Código de Barras */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Ex: FUR-750-IMP"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Código de Barras (EAN)
                  </label>
                  <input
                    type="text"
                    value={formData.codigoBarras}
                    onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
                    placeholder="Ex: 7891234567890"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              {/* Categoria & Unidade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Categoria
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  >
                    <option value="">Selecione uma Categoria...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={formData.unitId}
                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  >
                    <option value="">Selecione a Unidade...</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.sigla} - {u.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Preços & Estoque */}
          {activeTab === 'precos' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Preço de Custo (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.precoCusto}
                    onChange={(e) => setFormData({ ...formData, precoCusto: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.precoVenda}
                    onChange={(e) => setFormData({ ...formData, precoVenda: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              {/* Indicador de Margem */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-500">Margem de Lucro Estimada:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {margemLucro}% (Lucro Bruto: R$ {(formData.precoVenda - formData.precoCusto).toFixed(2)})
                </span>
              </div>

              {/* Estoques */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    value={formData.estoqueMinimo}
                    onChange={(e) => setFormData({ ...formData, estoqueMinimo: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Estoque Máximo Recomendado
                  </label>
                  <input
                    type="number"
                    value={formData.estoqueMaximo}
                    onChange={(e) => setFormData({ ...formData, estoqueMaximo: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Localização no Estoque */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Localização Física no Estoque
                </label>
                <input
                  type="text"
                  placeholder="Ex: Corredor B, Prateleira 3, Caixa 12"
                  value={formData.localizacaoEstoque}
                  onChange={(e) => setFormData({ ...formData, localizacaoEstoque: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
            </div>
          )}

          {/* TAB 3: Fabricante, Fornecedor & Ficha Técnica */}
          {activeTab === 'detalhes' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Fabricante / Marca
                  </label>
                  <input
                    type="text"
                    value={formData.fabricante}
                    onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                    placeholder="Ex: Bosch, Makita, Samsung..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Fornecedor Principal
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  >
                    <option value="">Selecione o Fornecedor...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nomeRazao}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Link do Fornecedor */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Link Direto do Fornecedor / Anúncio
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="url"
                    placeholder="https://fornecedor.com.br/produtos/item-123"
                    value={formData.linkFornecedor}
                    onChange={(e) => setFormData({ ...formData, linkFornecedor: e.target.value })}
                    className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                  {formData.linkFornecedor && (
                    <a
                      href={formData.linkFornecedor}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors"
                      title="Testar Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Peso, Dimensões e Garantia */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Peso (Kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1.85"
                    value={formData.peso}
                    onChange={(e) => setFormData({ ...formData, peso: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Dimensões (CxLxA)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 25x10x15 cm"
                    value={formData.dimensoes}
                    onChange={(e) => setFormData({ ...formData, dimensoes: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Garantia (Meses)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 12"
                    value={formData.garantiaMeses}
                    onChange={(e) => setFormData({ ...formData, garantiaMeses: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Descrição Detalhada */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Descrição Completa do Produto
                </label>
                <textarea
                  rows={3}
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Especificações técnicas, compatibilidades e notas..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
            </div>
          )}

          {/* Footer do Modal */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex space-x-2">
              {activeTab !== 'geral' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'detalhes' ? 'precos' : 'geral')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  ← Anterior
                </button>
              )}
              {activeTab !== 'detalhes' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'geral' ? 'precos' : 'detalhes')}
                  className="px-3 py-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 rounded-lg"
                >
                  Próximo →
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 rounded-xl shadow-md transition-all"
              >
                Salvar Produto
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal de Detalhes do Produto */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Ficha do Produto - ${selectedProduct?.nome}`}
        maxWidth="2xl"
      >
        {selectedProduct && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Imagem Grande */}
              <div className="w-full sm:w-48 h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                {selectedProduct.imagemUrl ? (
                  <img
                    src={getImageUrl(selectedProduct.imagemUrl) || ''}
                    alt={selectedProduct.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-16 h-16 text-slate-400 opacity-40" />
                )}
              </div>

              {/* Informações Principais */}
              <div className="flex-1 space-y-3 w-full">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">{selectedProduct.nome}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedProduct.sku && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs text-slate-600 dark:text-slate-300">
                        SKU: {selectedProduct.sku}
                      </span>
                    )}
                    {selectedProduct.codigoBarras && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs text-slate-600 dark:text-slate-300">
                        EAN: {selectedProduct.codigoBarras}
                      </span>
                    )}
                    {selectedProduct.fabricante && (
                      <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 rounded text-xs font-semibold">
                        {selectedProduct.fabricante}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block">Preço de Custo</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      R$ {selectedProduct.precoCusto.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Preço de Venda</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      R$ {selectedProduct.precoVenda.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Estoque Atual</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {selectedProduct.estoqueAtual} {selectedProduct.unit?.sigla || 'UN'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Localização</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {selectedProduct.localizacaoEstoque || 'Não cadastrada'}
                    </span>
                  </div>
                </div>

                {selectedProduct.linkFornecedor && (
                  <a
                    href={selectedProduct.linkFornecedor}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-3.5 py-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-xl text-xs font-bold hover:bg-sky-100 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    <span>Acessar Link do Fornecedor</span>
                  </a>
                )}
              </div>
            </div>

            {/* Ficha Técnica Extra */}
            <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl">
              <div>
                <span className="text-slate-400 block">Peso</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {selectedProduct.peso ? `${selectedProduct.peso} kg` : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Dimensões</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {selectedProduct.dimensoes || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Garantia</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {selectedProduct.garantiaMeses ? `${selectedProduct.garantiaMeses} meses` : 'Garantia legal'}
                </span>
              </div>
            </div>

            {selectedProduct.descricao && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição do Produto</h4>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedProduct.descricao}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-sm font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

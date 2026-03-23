import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, X, Activity } from 'lucide-react';
import api from '@/lib/api';

const PROVIDERS = [
  { 
    id: 'groq', 
    name: 'Groq', 
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'], 
    color: '#F55036',
    initial: 'G',
    hintUrl: 'console.groq.com'
  },
  { 
    id: 'openai', 
    name: 'OpenAI', 
    models: ['gpt-4o-mini', 'gpt-4o'], 
    color: '#10A37F',
    initial: 'O',
    hintUrl: 'platform.openai.com'
  },
  { 
    id: 'anthropic', 
    name: 'Anthropic', 
    models: ['claude-haiku-20240307', 'claude-sonnet-4-5'], 
    color: '#CC785C',
    initial: 'A',
    hintUrl: 'console.anthropic.com'
  },
  { 
    id: 'gemini', 
    name: 'Gemini', 
    models: ['gemini-1.5-flash', 'gemini-1.5-pro'], 
    color: '#4285F4',
    initial: 'G',
    hintUrl: 'aistudio.google.com'
  }
];

export function AIKeySection() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [activeModal, setActiveModal] = useState(null);
  const [modalKeyInput, setModalKeyInput] = useState('');
  const [modalModelInput, setModalModelInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  
  // Status Banner State in Modal
  const [bannerState, setBannerState] = useState(null);

  const fetchConfig = async () => {
    try {
      const response = await api.get('/profile/ai-config');
      if (response.data.success) {
        setConfig(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch AI config", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const openModal = (provider) => {
    setActiveModal(provider);
    setModalKeyInput('');
    setModalModelInput(config.preferredModels[provider.id] || provider.models[0]);
    setShowKey(false);
    setBannerState(null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalKeyInput('');
    setShowKey(false);
    setBannerState(null);
  };

  const testAndSave = async () => {
    setBannerState('testing');
    
    // Simulate testing delay
    await new Promise(resolve => setTimeout(resolve, 1600));

    try {
      const response = await api.post('/profile/ai-config/key', { 
        provider: activeModal.id, 
        key: modalKeyInput 
      });
      
      if (response.data.success) {
        setBannerState('success');
        
        await api.put('/profile/ai-config/default', {
          provider: activeModal.id,
          model: modalModelInput
        });

        setTimeout(() => {
          closeModal();
          fetchConfig();
        }, 1200);
      } else {
        setBannerState('error');
      }
    } catch (err) {
      setBannerState('error');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-10">
      <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
    </div>
  );

  if (!config) return null;

  const hasAnyKey = Object.values(config.providers).some(p => p.hasKey);

  return (
    <div className="mb-8">
      <h2 className="text-[14px] font-medium text-neutral-900 leading-tight">AI provider</h2>
      <p className="text-[12px] text-neutral-500 mb-4 mt-1">Add your own API key for unlimited AI generation</p>

      {/* Provider List Card */}
      <div className="bg-white border border-neutral-200/60 rounded-[12px] overflow-hidden flex flex-col">
        {PROVIDERS.map((provider, index) => {
          const state = config.providers[provider.id];
          const isDefault = config.defaultProvider === provider.id;
          const preferredModel = config.preferredModels[provider.id];

          return (
            <div 
              key={provider.id} 
              className={`flex items-center px-[16px] py-[12px] hover:bg-neutral-50 transition-colors ${index !== PROVIDERS.length - 1 ? 'border-b border-neutral-200/60' : ''}`}
            >
              <div 
                className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center text-white text-[12px] font-medium shrink-0"
                style={{ backgroundColor: provider.color }}
              >
                {provider.initial}
              </div>
              
              <div className="flex-1 ml-[12px]">
                <div className="text-[13px] font-medium text-neutral-900 leading-tight">{provider.name}</div>
                <div className="text-[11px] text-neutral-500 leading-tight mt-0.5">{preferredModel || provider.models[0]}</div>
              </div>

              <div className="flex items-center gap-[8px]">
                {/* Status Indicator */}
                <div className="flex items-center gap-1.5">
                  <div className={`w-[6px] h-[6px] rounded-full ${state.hasKey ? 'bg-[#3B6D11]' : 'bg-neutral-300'}`} />
                  <span className={`text-[11px] ${state.hasKey ? 'text-[#3B6D11]' : 'text-neutral-500'}`}>
                    {state.hasKey ? 'Active' : 'No key'}
                  </span>
                </div>

                {/* Default Pill */}
                {state.hasKey && isDefault && (
                  <div className="bg-[#EEEDFE] border border-[#CECBF6] text-[#3C3489] text-[10px] font-medium px-2 py-0.5 rounded-full">
                    Default
                  </div>
                )}

                {/* Action Button */}
                {!state.hasKey ? (
                  <button 
                    onClick={() => openModal(provider)}
                    className="border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-[8px] px-3 py-1.5 text-[12px] font-medium transition-colors focus:outline-none"
                  >
                    Add key
                  </button>
                ) : (
                  <button 
                    onClick={() => openModal(provider)}
                    className="bg-[#EAF3DE] border border-[#C0DD97] text-[#3B6D11] hover:bg-[#E1ECD4] rounded-[8px] px-3 py-1.5 text-[12px] font-medium transition-colors focus:outline-none"
                  >
                    Manage
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Free Tier Usage */}
      {!hasAnyKey && config.freeUsage && (
        <div className="mt-4 bg-white border border-neutral-200/60 rounded-[12px] p-[14px_16px] flex items-center">
          <div className="w-[28px] h-[28px] bg-neutral-100 rounded-[7px] flex items-center justify-center shrink-0">
            <Activity className="w-[14px] h-[14px] text-neutral-500" />
          </div>
          <div className="flex-1 ml-[12px]">
            <div className="text-[12px] font-medium text-neutral-900 leading-tight">Free tier</div>
            <div className="text-[11px] text-neutral-500 leading-tight mt-0.5">
              {Math.max(0, 10 - config.freeUsage.count)} of 10 daily uses remaining
            </div>
          </div>
          <div className="w-[80px] h-[4px] bg-neutral-200 rounded-full overflow-hidden flex items-center">
            <div 
              className="h-full bg-[#7F77DD] rounded-full" 
              style={{ width: `${(config.freeUsage.count / 10) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-[12px] border border-neutral-200 shadow-xl w-full max-w-[380px] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="px-[20px] py-[16px] flex items-start justify-between relative">
              <div>
                <h3 className="text-[14px] font-medium text-neutral-900 leading-tight">
                  {config.providers[activeModal.id].hasKey ? `Manage ${activeModal.name} key` : `Add ${activeModal.name} key`}
                </h3>
                <p className="text-[12px] text-neutral-500 mt-1 leading-tight">
                  {config.providers[activeModal.id].hasKey ? 'Update or remove your key' : 'Paste your API key below'}
                </p>
              </div>
              <button 
                onClick={closeModal}
                className="w-[24px] h-[24px] rounded-[5px] hover:bg-neutral-100 flex items-center justify-center text-neutral-500 transition-colors focus:outline-none absolute top-[16px] right-[16px]"
              >
                <X className="w-[14px] h-[14px]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-[20px] pb-[18px] flex flex-col gap-[14px]">
              
              {/* API Key Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-neutral-500">API key</label>
                <div className="relative">
                  <input 
                    type={showKey ? 'text' : 'password'}
                    value={modalKeyInput}
                    onChange={(e) => {
                      setModalKeyInput(e.target.value);
                      if (bannerState) setBannerState(null);
                    }}
                    placeholder="sk-••••••••••••••••••••"
                    className="w-full bg-neutral-50 border border-neutral-200/60 rounded-[8px] py-[9px] pl-[12px] pr-[36px] text-[12px] font-mono text-neutral-900 focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-[10px] top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                  >
                    {showKey ? <EyeOff className="w-[14px] h-[14px]" /> : <Eye className="w-[14px] h-[14px]" />}
                  </button>
                </div>
                
                {/* Status Banner */}
                {bannerState && (
                  <div className={`mt-1.5 px-3 py-2 rounded-[6px] text-[11px] transition-opacity duration-200 opacity-100 flex items-center gap-2
                    ${bannerState === 'testing' ? 'bg-neutral-50 text-neutral-600 border border-neutral-200/50' : ''}
                    ${bannerState === 'success' ? 'bg-[#EAF3DE] text-[#3B6D11] border border-[#C0DD97]' : ''}
                    ${bannerState === 'error' ? 'bg-[#FCEBEB] text-[#A32D2D] border border-[#F5C2C2]' : ''}
                  `}>
                    {bannerState === 'testing' && <Loader2 className="w-[12px] h-[12px] animate-spin shrink-0" />}
                    {bannerState === 'testing' && <span>Validating your key with the provider...</span>}
                    {bannerState === 'success' && <span>Key is valid — saved successfully.</span>}
                    {bannerState === 'error' && <span>Invalid key. Please check and try again.</span>}
                  </div>
                )}
              </div>

              {/* Model Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-neutral-500">Model</label>
                <select 
                  value={modalModelInput}
                  onChange={(e) => setModalModelInput(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200/60 rounded-[8px] py-[9px] px-[12px] text-[12px] text-neutral-900 focus:outline-none focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '14px' }}
                >
                  {activeModal.models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Hint */}
              <div className="text-[11px] text-neutral-500 leading-snug mt-1">
                Get your key at <a href={`https://${activeModal.hintUrl}`} target="_blank" rel="noreferrer" className="text-neutral-700 hover:text-neutral-900 underline decoration-neutral-300 underline-offset-2">{activeModal.hintUrl}</a><br/>
                Keys are encrypted before saving.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-neutral-200 px-[20px] py-[14px] flex justify-between items-center bg-neutral-50/50">
              <div>
                {config.providers[activeModal.id].hasKey && (
                  <button 
                    onClick={async () => {
                      await api.delete('/profile/ai-config/key', { data: { provider: activeModal.id } });
                      fetchConfig();
                      closeModal();
                    }}
                    className="text-[12px] text-[#A32D2D] font-medium hover:underline focus:outline-none"
                  >
                    Remove key
                  </button>
                )}
              </div>
              <div className="flex gap-[8px]">
                <button 
                  onClick={closeModal}
                  disabled={bannerState === 'testing'}
                  className="border border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50 rounded-[8px] px-4 py-1.5 text-[12px] font-medium transition-colors focus:outline-none disabled:opacity-50"
                >
                  Cancel
                </button>
                
                {config.providers[activeModal.id].hasKey && !modalKeyInput ? (
                  <button 
                    onClick={async () => {
                      await api.put('/profile/ai-config/default', {
                        provider: activeModal.id,
                        model: modalModelInput
                      });
                      fetchConfig();
                      closeModal();
                    }}
                    className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-[8px] px-4 py-1.5 text-[12px] font-medium transition-colors focus:outline-none"
                  >
                    Save settings
                  </button>
                ) : (
                  <button 
                    onClick={testAndSave}
                    disabled={modalKeyInput.length < 8 || bannerState === 'testing'}
                    className="bg-neutral-900 text-white rounded-[8px] px-4 py-1.5 text-[12px] font-medium transition-colors focus:outline-none disabled:opacity-35 disabled:cursor-not-allowed hover:bg-neutral-800"
                  >
                    {bannerState === 'testing' ? 'Testing...' : 'Test & save'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

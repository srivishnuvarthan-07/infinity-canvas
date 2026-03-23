import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { toast } from 'sonner';

const ACTIONS = {
  signout: {
    id: 'signout',
    title: 'Sign out',
    desc: 'Sign out of your current session on this device.',
    btnText: 'Sign out',
    style: 'outline',
    modalTitle: 'Sign out',
    modalSub: 'Are you sure you want to log out of your current session?',
    modalBtnText: 'Sign out',
    warning: null
  },
  alldevices: {
    id: 'alldevices',
    title: 'Sign out all devices',
    desc: 'Ends all active sessions everywhere you are logged in.',
    btnText: 'Sign out all',
    style: 'outline',
    modalTitle: 'Sign out all devices',
    modalSub: 'This will invalidate all current sessions across all devices.',
    modalBtnText: 'Sign out everywhere',
    warning: 'You will need to sign in again on all your devices.'
  },
  export: {
    id: 'export',
    title: 'Export my data',
    desc: 'Download all your boards and shapes as a JSON file.',
    btnText: 'Export',
    style: 'outline',
    modalTitle: 'Export my data',
    modalSub: 'Your data will be compiled into a single JSON file for download.',
    modalBtnText: 'Download export',
    warning: null
  },
  deleteboards: {
    id: 'deleteboards',
    title: 'Delete all boards',
    desc: 'Permanently removes all your boards. Cannot be undone.',
    btnText: 'Delete boards',
    style: 'solid',
    modalTitle: 'Delete all boards',
    modalSub: 'This action will permanently delete all boards you own.',
    modalBtnText: 'Delete all boards',
    matchPhrase: 'delete my boards',
    warning: 'This action is irreversible. All your canvas data will be lost immediately.'
  },
  deleteaccount: {
    id: 'deleteaccount',
    title: 'Delete account',
    desc: 'Permanently deletes your account and all data. Cannot be undone.',
    btnText: 'Delete account',
    style: 'solid',
    modalTitle: 'Delete account',
    modalSub: 'This action will permanently delete your account and all associated data.',
    modalBtnText: 'Delete my account',
    matchPhrase: 'delete my account',
    warning: 'This action is irreversible. Your account, boards, and settings will be permanently destroyed.'
  }
};

export function DangerZone() {
  const { logout } = useAuth();
  
  // Modal State
  const [activeAction, setActiveAction] = useState(null); // action key (e.g. 'signout')
  const [matchInput, setMatchInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const openModal = (actionId) => {
    setActiveAction(actionId);
    setMatchInput('');
  };

  const closeModal = () => {
    setActiveAction(null);
    setMatchInput('');
    setIsProcessing(false);
  };

  const handleConfirm = async () => {
    if (!activeAction) return;
    setIsProcessing(true);
    
    try {
      if (activeAction === 'signout') {
        await api.get('/auth/logout');
        await logout();
        toast.success("Signed out successfully");
      } else if (activeAction === 'alldevices') {
        await api.post('/profile/logout-all');
        await logout();
        toast.success("Logged out from all devices");
      } else if (activeAction === 'export') {
        toast.info("Preparing your export...");
        const response = await api.get('/profile/export');
        if (response.data.success) {
          const dataStr = JSON.stringify(response.data.data, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
          
          const exportFileDefaultName = `infinity-canvas-export-${new Date().toISOString().split('T')[0]}.json`;
          
          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', exportFileDefaultName);
          linkElement.click();
          
          toast.success("Data exported successfully!");
        }
      } else if (activeAction === 'deleteboards') {
        await api.delete('/profile/boards');
        toast.success("All your boards have been deleted.");
        // Optionally refresh page or redirect to dashboard
        setTimeout(() => window.location.reload(), 1500);
      } else if (activeAction === 'deleteaccount') {
        await api.delete('/profile/account');
        await logout();
        toast.success("Account and data permanently deleted.");
      }
    } catch (err) {
      console.error("Danger action failed:", err);
      toast.error(err.response?.data?.error || 'Action failed. Please try again.');
    } finally {
      setIsProcessing(false);
      if (activeAction !== 'signout' && activeAction !== 'alldevices' && activeAction !== 'deleteaccount') {
        closeModal();
      }
    }
  };

  const config = activeAction ? ACTIONS[activeAction] : null;
  const isMatchValid = config?.matchPhrase ? matchInput === config.matchPhrase : true;

  return (
    <div className="mb-8 mt-12 max-w-3xl mx-auto w-full">
      {/* Section Heading */}
      <div className="flex items-center gap-1.5 mb-3 px-1">
        <AlertTriangle className="w-[14px] h-[14px] text-[#A32D2D]" />
        <h2 className="text-[13px] font-medium text-[#A32D2D] leading-tight m-0">Danger zone</h2>
      </div>

      {/* Card */}
      <div className="bg-white border border-[#F09595] rounded-[12px] overflow-hidden flex flex-col">
        {Object.values(ACTIONS).map((action, index) => (
          <div 
            key={action.id} 
            className={`flex items-center justify-between px-[18px] py-[14px] ${index !== Object.values(ACTIONS).length - 1 ? 'border-b border-[#FEF0F0]' : ''}`}
          >
            <div className="flex-1 pr-6">
              <div className="text-[13px] font-medium text-neutral-900 leading-tight mb-1">{action.title}</div>
              <div className="text-[12px] text-neutral-500 leading-tight">{action.desc}</div>
            </div>

            <div className="flex-shrink-0">
              {action.style === 'outline' ? (
                <button 
                  onClick={() => openModal(action.id)}
                  className="bg-transparent border border-[#F09595] text-[#A32D2D] hover:bg-[#FCEBEB] hover:border-[#E24B4A] rounded-[7px] px-[14px] py-[6px] text-[12px] font-medium transition-colors focus:outline-none"
                >
                  {action.btnText}
                </button>
              ) : (
                <button 
                  onClick={() => openModal(action.id)}
                  className="bg-[#E24B4A] border-none text-white hover:bg-[#A32D2D] rounded-[7px] px-[14px] py-[6px] text-[12px] font-medium transition-colors focus:outline-none"
                >
                  {action.btnText}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {activeAction && config && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-[12px] border border-neutral-200 shadow-xl w-full max-w-[360px] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-[20px] py-[18px] border-b border-neutral-100 relative">
              <div className="w-[32px] h-[32px] rounded-[8px] bg-[#FCEBEB] flex items-center justify-center mb-3">
                <AlertTriangle className="w-[14px] h-[14px]" stroke="#E24B4A" />
              </div>
              <h3 className="text-[14px] font-medium text-neutral-900 leading-tight mb-1">
                {config.modalTitle}
              </h3>
              <p className="text-[11px] text-neutral-500 leading-[1.5]">
                {config.modalSub}
              </p>
              
              <button 
                onClick={closeModal}
                disabled={isProcessing}
                className="w-[24px] h-[24px] rounded-[5px] hover:bg-neutral-100 flex items-center justify-center text-neutral-500 transition-colors focus:outline-none absolute top-[16px] right-[16px]"
              >
                <X className="w-[14px] h-[14px]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-[20px] py-[16px] flex flex-col gap-[12px]">
              
              {/* Destructive Input */}
              {config.matchPhrase && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-neutral-500">
                    Type <span className="font-medium text-neutral-900">"{config.matchPhrase}"</span> to confirm
                  </label>
                  <input 
                    type="text"
                    value={matchInput}
                    onChange={(e) => setMatchInput(e.target.value)}
                    placeholder={config.matchPhrase}
                    className="w-full bg-neutral-50 border border-neutral-200/60 rounded-[8px] py-[9px] px-[12px] text-[12px] font-mono text-neutral-900 focus:outline-none focus:border-[#E24B4A] focus:ring-1 focus:ring-[#E24B4A] transition-all"
                  />
                </div>
              )}

              {/* Warning Note */}
              {config.warning && (
                <div className="bg-[#FCEBEB] border border-[#F7C1C1] rounded-[8px] p-3">
                  <p className="text-[11px] text-[#791F1F] leading-[1.5] m-0">
                    {config.warning}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-neutral-200 px-[20px] py-[12px] flex justify-end gap-[8px] bg-neutral-50/50">
              <button 
                onClick={closeModal}
                disabled={isProcessing}
                className="border border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50 rounded-[8px] px-4 py-1.5 text-[12px] font-medium transition-colors focus:outline-none disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button 
                onClick={handleConfirm}
                disabled={!isMatchValid || isProcessing}
                className="bg-[#E24B4A] text-white rounded-[8px] px-4 py-1.5 text-[12px] font-medium transition-colors focus:outline-none disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#A32D2D] border-none"
              >
                {isProcessing ? 'Processing...' : config.modalBtnText}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

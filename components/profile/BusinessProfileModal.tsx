"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Store, Save, Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface BusinessProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BusinessProfileModal({ isOpen, onClose }: BusinessProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    business_name: "",
    phone: "", // MATCHED TO YOUR SCHEMA
    business_address: "",
    logo_url: "", 
  });

  useEffect(() => {
    if (!isOpen) return;
    
    async function fetchProfile() {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("business_name, phone, business_address, logo_url") // MATCHED TO YOUR SCHEMA
          .eq("id", user.id)
          .single();

        if (data) {
          setProfile({
            business_name: data.business_name || "",
            phone: data.phone || "", // MATCHED TO YOUR SCHEMA
            business_address: data.business_address || "",
            logo_url: data.logo_url || "",
          });
        }
      }
      setLoading(false);
    }
    fetchProfile();
  }, [isOpen]);

  const updateField = (key: string, value: string) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const compressLogo = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 300; 
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png", 0.8));
      };
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const originalBase64 = reader.result as string;
      const compressed = await compressLogo(originalBase64);
      updateField("logo_url", compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({
          business_name: profile.business_name,
          phone: profile.phone, // MATCHED TO YOUR SCHEMA
          business_address: profile.business_address,
          logo_url: profile.logo_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        alert("Failed to save profile. Check console.");
        console.error(error);
      } else {
        onClose(); 
      }
    }
    setSaving(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Store className="text-[#134e4a]" size={22} />
                <h2 className="font-black text-lg text-gray-900">Shop Profile</h2>
              </div>
              <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col items-center mb-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-24 h-24 rounded-full border-4 border-gray-50 bg-gray-100 flex items-center justify-center cursor-pointer group overflow-hidden shadow-sm"
                  >
                    {profile.logo_url ? (
                      <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store size={32} className="text-gray-300" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={20} className="text-white mb-1" />
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase mt-3 tracking-widest">Tap to upload Logo</p>
                  <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Business Name</label>
                    <input 
                      placeholder="e.g. SabiWoka Ventures"
                      value={profile.business_name} 
                      onChange={(e) => updateField("business_name", e.target.value)} 
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#134e4a]/20 font-bold text-gray-900 text-sm transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Business Phone</label>
                    <input 
                      type="tel"
                      placeholder="e.g. +234 800 000 0000"
                      value={profile.phone} 
                      onChange={(e) => updateField("phone", e.target.value)} 
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#134e4a]/20 font-bold text-gray-900 text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Shop Address</label>
                    <textarea 
                      placeholder="Where is your shop located?"
                      value={profile.business_address} 
                      onChange={(e) => updateField("business_address", e.target.value)} 
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#134e4a]/20 font-bold text-gray-900 text-sm transition-all resize-none h-24"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-4 bg-[#134e4a] text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg mt-2 disabled:opacity-50 transition-opacity"
                >
                  {saving ? "Saving Profile..." : <><Save size={18} /> Save Business Profile</>}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
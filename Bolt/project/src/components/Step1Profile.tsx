import React from 'react';
import { motion } from 'framer-motion';
import { User, Building2 } from 'lucide-react';
import { StudentProfile } from '../types';

interface Step1ProfileProps {
  profile: StudentProfile;
  setProfile: (profile: StudentProfile) => void;
  onNext: (name: string, branch: string) => void;
}

const fieldVariants = {
  hidden: { opacity: 0, y: 15 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1 + 0.2, duration: 0.4, ease: "easeOut" }
  } as const)
} as const;

export default function Step1Profile({ profile, setProfile, onNext }: Step1ProfileProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.full_name && profile.branch) {
      onNext(profile.full_name, profile.branch);
    }
  };

  const inputClass = "w-full px-6 py-4 text-lg bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:shadow-lg focus:scale-[1.01] transition-all duration-200 hover:border-gray-500";

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-gray-800 rounded-3xl shadow-2xl p-10 lg:p-16 border border-gray-700"
      >
        <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl lg:text-5xl font-bold text-white mb-4">
          Student Profile
        </motion.h2>


        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <User size={14} className="text-purple-400" />
                Full Name
              </label>
              <input type="text" required value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className={inputClass} placeholder="Enter your full name" />
            </motion.div>

            <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Building2 size={14} className="text-purple-400" />
                Branch
              </label>
              <select required value={profile.branch} onChange={(e) => setProfile({ ...profile, branch: e.target.value })} className={inputClass}>
                <option value="">Select Branch</option>
                <option value="B.Tech CSE">B.Tech CSE</option>
                <option value="B.Tech AIML">B.Tech AIML</option>
                <option value="B.Tech AIDS">B.Tech AIDS</option>
              </select>
            </motion.div>
          </div>

          <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show" className="mt-12 flex justify-end">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="px-12 py-4 text-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200"
            >
              Continue →
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
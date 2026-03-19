import React, { useState } from 'react';
import { motion } from 'framer-motion';
import API from '../utils/api';
import { StudentProfile } from '../types';

interface Step1ProfileProps {
  profile: StudentProfile;
  setProfile: (profile: StudentProfile) => void;
  onNext: () => void;
}

const fieldVariants = {
  hidden: { opacity: 0, y: 15 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1 + 0.2, duration: 0.4, ease: "easeOut" }
  })
};

export default function Step1Profile({ profile, setProfile, onNext }: Step1ProfileProps) {
  const [error, setError] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!profile.full_name || !profile.roll_number || !profile.branch || !profile.year) {
      setError('Please fill in all required fields');
      return;
    }

    setIsValidating(true);
    try {
      const response = await API.post('/validate-student', {
        name: profile.full_name,
        rollNo: profile.roll_number,
        branch: profile.branch
      });

      if (response.data.valid) {
        onNext();
      } else {
        setError('Student not found. Please check Name, Roll No, or Branch.');
      }
    } catch (err) {
      setError('Failed to validate student information. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const inputClass = "w-full px-6 py-4 text-lg bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:shadow-lg focus:scale-[1.01] transition-all duration-200 hover:border-gray-500";

  return (
    <div className="w-full max-w-5xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-gray-800 rounded-3xl shadow-2xl p-10 lg:p-16 border border-gray-700"
      >
        <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl lg:text-5xl font-bold text-white mb-4">
          Student Profile
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-lg text-gray-400 mb-10">
          Enter your basic information to get started.
        </motion.p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
              <label className="block text-lg font-medium text-gray-300 mb-3">Full Name</label>
              <input type="text" required value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className={inputClass} placeholder="Enter your full name" />
            </motion.div>

            <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
              <label className="block text-lg font-medium text-gray-300 mb-3">Roll Number</label>
              <input type="text" required value={profile.roll_number} onChange={(e) => setProfile({ ...profile, roll_number: e.target.value })} className={inputClass} placeholder="Enter your roll number" />
            </motion.div>

            <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
              <label className="block text-lg font-medium text-gray-300 mb-3">Branch</label>
              <select required value={profile.branch} onChange={(e) => setProfile({ ...profile, branch: e.target.value })} className={inputClass}>
                <option value="">Select Branch</option>
                <option value="B.Tech CSE">B.Tech CSE</option>
                <option value="B.Tech AIML">B.Tech AIML</option>
                <option value="B.Tech AIDS">B.Tech AIDS</option>
              </select>
            </motion.div>

            <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show">
              <label className="block text-lg font-medium text-gray-300 mb-3">Year of Study</label>
              <select required value={profile.year} onChange={(e) => setProfile({ ...profile, year: e.target.value })} className={inputClass}>
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </motion.div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-8 p-4 bg-red-900/50 border border-red-500/50 rounded-xl">
              <p className="text-red-200 text-sm font-medium">{error}</p>
            </motion.div>
          )}

          <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="show" className="mt-12 flex justify-end">
            <motion.button
              type="submit"
              disabled={isValidating}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="px-12 py-4 text-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 disabled:opacity-50"
            >
              {isValidating ? 'Validating...' : 'Next Step →'}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
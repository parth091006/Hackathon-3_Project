import { StudentProfile } from '../types';

interface Step1ProfileProps {
  profile: StudentProfile;
  setProfile: (profile: StudentProfile) => void;
  onNext: () => void;
}

export default function Step1Profile({ profile, setProfile, onNext }: Step1ProfileProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.full_name && profile.roll_number && profile.branch && profile.year) {
      onNext();
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-3xl shadow-2xl p-12 lg:p-16 border border-gray-700">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">Student Profile</h2>
          <p className="text-lg lg:text-xl text-gray-400 mb-12">Enter your basic information to get started</p>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label className="block text-base lg:text-lg font-medium text-gray-300 mb-3">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full px-6 py-4 text-lg bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-base lg:text-lg font-medium text-gray-300 mb-3">
                  Roll Number
                </label>
                <input
                  type="text"
                  required
                  value={profile.roll_number}
                  onChange={(e) => setProfile({ ...profile, roll_number: e.target.value })}
                  className="w-full px-6 py-4 text-lg bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your roll number"
                />
              </div>

              <div>
                <label className="block text-base lg:text-lg font-medium text-gray-300 mb-3">
                  Branch
                </label>
                <select
                  required
                  value={profile.branch}
                  onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                  className="w-full px-6 py-4 text-lg bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Branch</option>
                  <option value="B.Tech CSE">B.Tech CSE</option>
                  <option value="B.Tech AIML">B.Tech AIML</option>
                  <option value="B.Tech AIDS">B.Tech AIDS</option>
                </select>
              </div>

              <div>
                <label className="block text-base lg:text-lg font-medium text-gray-300 mb-3">
                  Year of Study
                </label>
                <select
                  required
                  value={profile.year}
                  onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                  className="w-full px-6 py-4 text-lg bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
            </div>

            <div className="mt-12 flex justify-end">
              <button
                type="submit"
                className="px-12 py-4 text-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Next →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

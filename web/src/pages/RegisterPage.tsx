import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { api } from "../services/api";

export default function RegisterPage() {
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/register", { email, password, clinicName });
      setAuth(res.data.accessToken, res.data.user);
      navigate("/dashboard?checkout=needed");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error creating account. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-zinc-900 shadow rounded-lg border border-gray-200 dark:border-zinc-800">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            ClinicOS
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Create a new clinic account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="clinic-name"
                name="clinicName"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 placeholder-gray-500 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-transparent"
                placeholder="Clinic Name"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
              />
            </div>
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-transparent"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 placeholder-gray-500 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-transparent"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Sign Up"}
            </button>
          </div>
          
          <div className="text-sm text-center">
             <Link to="/login" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
               Already have an account? Sign in
             </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

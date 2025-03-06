import React, { useState } from "react";
import { register } from "../../services/AuthService";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const RegisterForm: React.FC = () => {
  const [userName, setUserName] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    
    e.preventDefault();
    setError(""); 
    try {
      await register(userName, email, password, firstName, lastName);
      navigate('/home');
      //alert(response.message);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <div className="font-[sans-serif] min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <motion.div 
        className="grid md:grid-cols-2 w-full items-center"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Left Side - Text */}
        <motion.div 
          className="text-left px-25"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.h2 className="lg:text-5xl text-3xl font-extrabold lg:leading-[55px] text-gray-800"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          >
            Simplify Your Chores, Simplify Your Life!
          </motion.h2>
          <motion.p className="text-sm mt-6 text-gray-800"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          >
            Ready to take control of your chores? Register now to effortlessly manage tasks, track your progress, and keep your home running smoothly with your roommates!
          </motion.p>
          <motion.p className="text-sm mt-6 text-gray-800"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          >
            Already part of a Crew?
            <a href="/login" className="text-blue-600 font-semibold hover:underline ml-1">
              Login here
            </a> and get back to organizing your chores.
          </motion.p>
        </motion.div>

        {/* Right Side - Register Form */}
        <motion.div 
          className="flex justify-left"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
            <motion.h3 
              className="text-gray-800 text-3xl font-extrabold mb-6 text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 2 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              Register
            </motion.h3>

            {error && (
              <motion.p 
                className="text-red-500 text-sm text-center mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { value: firstName, setValue: setFirstName, placeholder: "First Name" },
                { value: lastName, setValue: setLastName, placeholder: "Last Name" },
                { value: email, setValue: setEmail, placeholder: "Email" },
                { value: userName, setValue: setUserName, placeholder: "Username" },
                { value: password, setValue: setPassword, placeholder: "Password", type: "password" }
              ].map((field, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                >
                  <input
                    type={field.type || "text"}
                    value={field.value}
                    onChange={(e) => field.setValue(e.target.value)}
                    placeholder={field.placeholder}
                    className="bg-gray-100 w-full text-sm text-gray-800 px-4 py-3.5 rounded-md outline-blue-600 focus:bg-transparent"
                    required
                  />
                </motion.div>
              ))}

              <motion.button
                type="submit"
                className="w-full shadow-xl py-2.5 px-4 text-sm font-semibold rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Register
              </motion.button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RegisterForm;

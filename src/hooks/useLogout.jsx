import useAuth from "./useAuth";
import backed_api from "../api/axios";

const useLogout = () => {
  const { setAuth } = useAuth();

  const logout = async () => {
    try {
      const response = await backed_api.post(`/logout`);
      setAuth({});
      return response.data;
    } catch (err) {
      console.error(err);
    }
  };

  return logout;
};

export default useLogout;
import axios from "axios";

export const trackVisitor = async (email) => {
  return await axios.post("http://localhost:5000/enrich", { email }); // Update URL if deployed
};